#!/usr/bin/env node
/**
 * Translate ChapterData exam JSON files into multiple languages using OpenAI.
 *
 * Usage:
 *   node scripts/translate-chapterdata-openai.js
 *   node scripts/translate-chapterdata-openai.js fr
 *   node scripts/translate-chapterdata-openai.js --source QuestionsByChapter
 *   node scripts/translate-chapterdata-openai.js --source allChaptersData.practiceExam --output-dir ChapterData/translations
 *   node scripts/translate-chapterdata-openai.js --source allChaptersData.practiceExam --output-dir ChapterData/translations --output-basename mockExam
 *   node scripts/translate-chapterdata-openai.js --source QuestionsByChapter --output-dir ChapterData/translations --output-basename questionsByChapter
 *
 * Notes:
 * - Only translates: prompt, options, explanation, hint.
 * - Preserves structure, ids, types, indexes, media, meta, chapterID, chapterName.
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const OpenAI = require('openai');

const argv = process.argv.slice(2);
const ROOT = path.resolve(__dirname, '..');

const getArgValue = (flag) => {
  const idx = argv.indexOf(flag);
  if (idx === -1) return null;
  return argv[idx + 1] || null;
};

const TARGET_LANGUAGES = [
//   { code: 'es', name: 'Spanish' },
//   { code: 'fr', name: 'French' },
//   { code: 'de', name: 'German' },
//   { code: 'it', name: 'Italian' },
//   { code: 'pt', name: 'Portuguese' },
//   { code: 'ru', name: 'Russian' },
//   { code: 'zh', name: 'Chinese (Simplified)' },
//   { code: 'ja', name: 'Japanese' },
//   { code: 'ko', name: 'Korean' },
//   { code: 'ar', name: 'Arabic' },
//   { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
];

const OUTPUT_BASENAME_FLAGS = ['--output-basename', '--basename'];
const SOURCE_LANGUAGE_CODES = ['en', ...TARGET_LANGUAGES.map((lang) => lang.code)];

const SOURCES = [
  {
    key: 'allChaptersData.practiceExam',
    path: path.join(ROOT, 'ChapterData', 'allChaptersData.practiceExam.json'),
  },
  {
    key: 'QuestionsByChapter',
    path: path.join(ROOT, 'ChapterData', 'QuestionsByChapter.json'),
  },
];

const apiKey = process.env.OPENAI_API_KEY || '';
if (!apiKey) {
  console.error('Error: OPENAI_API_KEY is missing in .env or environment.');
  process.exit(1);
}
const hasNonAscii = [...apiKey].some((ch) => ch.charCodeAt(0) > 255);
const hasWhitespace = /\s/.test(apiKey);
if (hasNonAscii || hasWhitespace) {
  console.error('Error: OPENAI_API_KEY contains invalid characters.');
  console.error('Please set a clean ASCII API key in .env with no spaces or quotes.');
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getLanguagesFromCli = () => {
  const arg = (argv[0] || '').toLowerCase().trim();
  if (!arg || arg.startsWith('--')) {
    return TARGET_LANGUAGES;
  }

  const lang =
    TARGET_LANGUAGES.find((l) => l.code.toLowerCase() === arg) ||
    TARGET_LANGUAGES.find((l) => l.name.toLowerCase() === arg);

  if (!lang) {
    console.error(`Error: Unknown language "${arg}".`);
    console.log('Supported languages:');
    TARGET_LANGUAGES.forEach((l) => console.log(`- ${l.code} (${l.name})`));
    process.exit(1);
  }

  return [lang];
};

const resolveSources = () => {
  const sourceArg = getArgValue('--source');
  if (!sourceArg) return SOURCES;

  const isPathLike =
    sourceArg.endsWith('.json') || sourceArg.includes('/') || sourceArg.includes('\\');
  if (isPathLike) {
    const resolved = path.resolve(ROOT, sourceArg);
    if (!fs.existsSync(resolved)) {
      console.error(`Error: Source file not found at "${resolved}".`);
      process.exit(1);
    }
    return [
      {
        key: path.basename(resolved, '.json'),
        path: resolved,
      },
    ];
  }

  const selected = SOURCES.filter(
    (s) =>
      s.key.toLowerCase() === sourceArg.toLowerCase() ||
      path.basename(s.path, '.json').toLowerCase() === sourceArg.toLowerCase(),
  );

  if (!selected.length) {
    console.error(`Error: Unknown source "${sourceArg}".`);
    console.log('Available sources:');
    SOURCES.forEach((s) => console.log(`- ${s.key} (${s.path})`));
    console.log('Or pass a file path with --source path/to/file.json');
    process.exit(1);
  }

  return selected;
};

const getOutputBasename = (sourcePath) => {
  const override =
    getArgValue(OUTPUT_BASENAME_FLAGS[0]) || getArgValue(OUTPUT_BASENAME_FLAGS[1]);
  if (override) {
    return override.replace(/\.json$/i, '');
  }

  const base = path.basename(sourcePath, '.json');
  const suffixPattern = new RegExp(`\\.(${SOURCE_LANGUAGE_CODES.join('|')})$`, 'i');
  return base.replace(suffixPattern, '');
};

const buildOutputPath = (sourcePath, langCode) => {
  const outputDirArg = getArgValue('--output-dir');
  const dir = outputDirArg ? path.resolve(ROOT, outputDirArg) : path.dirname(sourcePath);
  const base = getOutputBasename(sourcePath);
  return path.join(dir, `${base}.${langCode}.json`);
};

const sanitizeTranslation = (original, translated) => {
  if (!translated || typeof translated !== 'object') return original;

  const next = { ...original };

  if (typeof translated.prompt === 'string') {
    next.prompt = translated.prompt;
  }

  if (Array.isArray(translated.options) && translated.options.length === original.options.length) {
    const allStrings = translated.options.every((o) => typeof o === 'string');
    if (allStrings) next.options = translated.options;
  }

  if (typeof translated.explanation === 'string') {
    next.explanation = translated.explanation;
  }

  if (Object.prototype.hasOwnProperty.call(translated, 'hint')) {
    next.hint = translated.hint === null || typeof translated.hint === 'string' ? translated.hint : original.hint;
  }

  return next;
};

const translateBatch = async (questions, languageName) => {
  const simplified = questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: q.options,
    explanation: q.explanation,
    hint: q.hint,
  }));

  const prompt = `
You are a professional translator for a "Life in the UK" exam app.
Translate the following JSON array of exam questions into ${languageName}.

Rules:
1) Keep JSON structure and ordering EXACTLY the same.
2) Do NOT translate the "id".
3) Translate only: "prompt", "options", "explanation", and "hint".
4) Preserve meaning and maintain an official exam tone.
5) Return ONLY raw JSON (no markdown, no extra text).

INPUT JSON:
${JSON.stringify(simplified)}
  `.trim();

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: 'You are a careful JSON translator. You only return valid JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
  });

  let text = response.choices[0].message.content || '';
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
};

const processSource = async (source, language) => {
  const raw = JSON.parse(await fs.promises.readFile(source.path, 'utf8'));
  const chapters = raw.data || {};
  const output = { ...raw, data: {} };

  const chapterKeys = Object.keys(chapters);
  const BATCH_SIZE = 5;

  for (const chapterKey of chapterKeys) {
    const chapter = chapters[chapterKey];
    const questions = chapter.questions || [];
    const translatedQuestions = [];

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      let batchTranslated = null;
      let retries = 3;

      while (!batchTranslated && retries > 0) {
        try {
          batchTranslated = await translateBatch(batch, language.name);
        } catch (err) {
          retries -= 1;
          console.warn(`Batch failed (${retries} retries left): ${err.message}`);
          await delay(1500);
        }
      }

      if (batchTranslated) {
        const merged = batch.map((original, index) =>
          sanitizeTranslation(original, batchTranslated[index]),
        );
        translatedQuestions.push(...merged);
      } else {
        translatedQuestions.push(...batch);
      }

      await delay(800);
    }

    output.data[chapterKey] = {
      ...chapter,
      questions: translatedQuestions,
    };
  }

  const outPath = buildOutputPath(source.path, language.code);
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  await fs.promises.writeFile(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Saved ${outPath}`);
};

const main = async () => {
  const languages = getLanguagesFromCli();
  const sources = resolveSources();

  for (const language of languages) {
    for (const source of sources) {
      await processSource(source, language);
    }
  }
};

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
