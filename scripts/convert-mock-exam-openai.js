#!/usr/bin/env node
/**
 * Convert legacy streak-format exam JSON into the normalized exam schema.
 *
 * Usage:
 *   node scripts/convert-mock-exam-openai.js --local
 *   node scripts/convert-mock-exam-openai.js --input ChapterData/MockExam.json --output ChapterData/MockExam.practiceExam.json
 *   node scripts/convert-mock-exam-openai.js --local --input ChapterData/allChaptersData.json --output ChapterData/allChaptersData.practiceExam.json --mock
 *
 * Notes:
 * - By default, this uses OpenAI. Pass --local to skip GPT and use deterministic conversion.
 * - Chapter mapping is applied to chapterName only to preserve numeric IDs for app compatibility.
 * - Use --mock to label chapterName as "Mock Exam {n}" (default base is 73).
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const argv = process.argv.slice(2);
const ROOT = path.resolve(__dirname, '..');

const getArgValue = (flag) => {
  const idx = argv.indexOf(flag);
  if (idx === -1) return null;
  return argv[idx + 1] || null;
};

const useLocal = argv.includes('--local');
const mockMode = argv.includes('--mock');
const inputPath = path.resolve(ROOT, getArgValue('--input') || path.join('ChapterData', 'MockExam.json'));
const outputPath = path.resolve(ROOT, getArgValue('--output') || path.join('ChapterData', 'MockExam.practiceExam.json'));
const mockPrefix = getArgValue('--mock-prefix') || 'Mock Exam';
const mockBase = Number(getArgValue('--mock-base') || 73);

const nowIso = new Date().toISOString();

const getMappedChapterLabel = (sourceId) => {
  if (sourceId === 41) return '1-2';
  if (sourceId >= 42 && sourceId <= 51) return `3.${sourceId - 41}`;
  if (sourceId >= 52 && sourceId <= 63) return `4.${sourceId - 51}`;
  if (sourceId >= 64 && sourceId <= 73) return `5.${sourceId - 63}`;
  return String(sourceId);
};

const getChapterName = (chapterId) => {
  if (mockMode && Number.isFinite(mockBase)) {
    const mockIndex = chapterId - mockBase;
    if (mockIndex > 0) return `${mockPrefix} ${mockIndex}`;
  }
  return `Chapter ${getMappedChapterLabel(chapterId)}`;
};

const extractOptions = (options) =>
  (options || []).map((opt) => {
    if (typeof opt === 'string') return opt;
    if (opt && typeof opt.text === 'string') return opt.text;
    return String(opt);
  });

const isTrueFalse = (options) => {
  if (!Array.isArray(options) || options.length !== 2) return false;
  const normalized = options.map((t) => (t || '').toString().trim().toLowerCase());
  return normalized.includes('true') && normalized.includes('false');
};

const deriveType = (options, correct) => {
  if (isTrueFalse(options)) return 'true_false';
  if (Array.isArray(correct) && correct.length > 1) return 'multiple_choice';
  if (Array.isArray(options) && options.length === 2) return 'statement_choice';
  return 'single_choice';
};

const coerceIndexes = (indexes, optionsLength, fallback) => {
  if (!Array.isArray(indexes)) return fallback;
  const numeric = indexes.filter((i) => Number.isInteger(i));
  if (!numeric.length) return fallback;
  const inRange = numeric.every((i) => i >= 0 && i < optionsLength);
  return inRange ? numeric : fallback;
};

const buildSelections = (correct, optionsLength) => {
  const count = Array.isArray(correct) && correct.length > 1 ? correct.length : 1;
  const bounded = Math.min(count, optionsLength || 1);
  return { min: bounded, max: bounded };
};

const normalizeQuestionLocal = (raw, chapterId) => {
  const options = extractOptions(raw.options);
  const correct = Array.isArray(raw.correctAnswer) ? raw.correctAnswer : [];
  const type = deriveType(options, correct);
  const { min, max } = buildSelections(correct, options.length);

  return {
    id: `Q${raw.questionID}`,
    type,
    prompt: raw.question || '',
    options,
    correct_option_indexes: correct,
    min_selections: min,
    max_selections: max,
    explanation: raw.explanation || '',
    hint: null,
    media: {
      image_url: null,
      audio_prompt_url: null,
      audio_option_urls: [],
    },
    meta: {
      chapter_id: chapterId,
      tags: [],
      difficulty: 'medium',
      source: 'handbook',
      updated_at: nowIso,
    },
  };
};

const coerceQuestion = (raw, chapterId, gptQuestion) => {
  const fallback = normalizeQuestionLocal(raw, chapterId);
  if (!gptQuestion || typeof gptQuestion !== 'object') return fallback;

  const options = extractOptions(raw.options);
  const gptOptions = Array.isArray(gptQuestion.options) ? gptQuestion.options : null;
  const finalOptions =
    gptOptions && gptOptions.length === options.length && gptOptions.every((o) => typeof o === 'string')
      ? gptOptions
      : options;

  const correct = Array.isArray(raw.correctAnswer) ? raw.correctAnswer : [];
  const finalCorrect = coerceIndexes(gptQuestion.correct_option_indexes, finalOptions.length, correct);
  const type = ['single_choice', 'multiple_choice', 'true_false', 'statement_choice'].includes(gptQuestion.type)
    ? gptQuestion.type
    : deriveType(finalOptions, finalCorrect);
  const { min, max } = buildSelections(finalCorrect, finalOptions.length);

  return {
    id: `Q${raw.questionID}`,
    type,
    prompt: typeof gptQuestion.prompt === 'string' ? gptQuestion.prompt : raw.question || '',
    options: finalOptions,
    correct_option_indexes: finalCorrect,
    min_selections: min,
    max_selections: max,
    explanation: typeof gptQuestion.explanation === 'string' ? gptQuestion.explanation : raw.explanation || '',
    hint: gptQuestion.hint ?? null,
    media: {
      image_url: null,
      audio_prompt_url: null,
      audio_option_urls: [],
    },
    meta: {
      chapter_id: chapterId,
      tags: [],
      difficulty: 'medium',
      source: 'handbook',
      updated_at: nowIso,
    },
  };
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let openai = null;
if (!useLocal) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY is missing in .env or environment. Use --local to skip GPT.');
    process.exit(1);
  }
  const OpenAI = require('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const convertBatchOpenAI = async (batch, chapterId) => {
  const simplified = batch.map((q) => ({
    questionID: q.questionID,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
  }));

  const prompt = `
You are converting exam questions from a legacy JSON format into a normalized schema.

Target question schema (EXACT structure):
{
  "id": "Q<questionID>",
  "type": "single_choice | multiple_choice | true_false | statement_choice",
  "prompt": "<question>",
  "options": ["<option text>", "..."],
  "correct_option_indexes": [0, 2],
  "min_selections": 1,
  "max_selections": 1,
  "explanation": "<explanation>",
  "hint": null,
  "media": { "image_url": null, "audio_prompt_url": null, "audio_option_urls": [] },
  "meta": {
    "chapter_id": ${chapterId},
    "tags": [],
    "difficulty": "medium",
    "source": "handbook",
    "updated_at": "${nowIso}"
  }
}

Type rules:
- true_false: options are exactly ["True","False"] (case-insensitive).
- multiple_choice: correct_option_indexes has length > 1.
- statement_choice: options length is 2 and it is NOT true_false.
- single_choice: all other cases.
- min_selections/max_selections: if multiple_choice then both equal correct_option_indexes length; otherwise 1.

Rules:
1. Keep ordering identical to input.
2. Do not translate text; preserve wording.
3. Use only raw JSON. No markdown, no extra text.
4. Return ONLY a JSON array of normalized questions.

Input JSON:
${JSON.stringify(simplified)}
  `.trim();

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a strict JSON transformer. You only return valid JSON arrays.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0,
  });

  let text = response.choices[0].message.content || '';
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
};

const main = async () => {
  const source = JSON.parse(await fs.promises.readFile(inputPath, 'utf8'));
  const chapters = source.data || {};
  const output = { data: {} };

  for (const [chapterKey, chapter] of Object.entries(chapters)) {
    const sourceId = Number(String(chapterKey).replace(/^\D+/g, '')) || chapter.chapterID;
    const chapterId = typeof chapter.chapterID === 'number' ? chapter.chapterID : sourceId;
    const chapterName = getChapterName(chapterId);

    const questions = chapter.questions || [];
    const normalizedQuestions = [];
    const BATCH_SIZE = 6;

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      let gptBatch = null;

      if (!useLocal) {
        let retries = 3;
        while (!gptBatch && retries > 0) {
          try {
            gptBatch = await convertBatchOpenAI(batch, chapterId);
          } catch (err) {
            retries -= 1;
            console.warn(`⚠️ GPT batch failed (${retries} retries left): ${err.message}`);
            await delay(1500);
          }
        }
      }

      const coerced = batch.map((raw, idx) => coerceQuestion(raw, chapterId, gptBatch ? gptBatch[idx] : null));
      normalizedQuestions.push(...coerced);

      if (!useLocal) {
        await delay(800);
      }
    }

    output.data[`chapter${chapterId}`] = {
      chapterID: chapterId,
      chapterName,
      questions: normalizedQuestions,
    };
  }

  await fs.promises.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅ Saved converted exam: ${outputPath}`);
};

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
