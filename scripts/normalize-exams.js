#!/usr/bin/env node
/**
 * Normalize legacy question JSON files to the new exam schema and emit:
 *  - Normalized per-chapter files under src/data/exam/normalized
 *  - A consolidated allChaptersData.normalized.json
 *  - exams.json manifest (chapter exams + mock exams)
 *  - question_chapter_map.json for analytics/lookups
 *
 * This is a pure Node script; no external deps.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEGACY_DIR = path.join(ROOT, 'src', 'data', 'exam', 'testQuestionDataJSON');
const OUTPUT_DIR = path.join(ROOT, 'src', 'data', 'exam', 'normalized');

const nowIso = new Date().toISOString();

const isTrueFalse = (options) => {
  if (!Array.isArray(options) || options.length !== 2) return false;
  const normalized = options.map((t) => (t || '').toString().trim().toLowerCase());
  return normalized.includes('true') && normalized.includes('false');
};

const normalizeQuestion = (raw, chapterId) => {
  const options = (raw.options || []).map((opt) => {
    if (typeof opt === 'string') return opt;
    if (opt && typeof opt.text === 'string') return opt.text;
    return String(opt);
  });

  const correct = Array.isArray(raw.correctAnswer) ? raw.correctAnswer : [];
  let type = 'single_choice';
  if (isTrueFalse(options)) {
    type = 'true_false';
  } else if (correct.length > 1) {
    type = 'multiple_choice';
  } else if (options.length === 2) {
    type = 'statement_choice';
  }

  const minSelections = correct.length > 1 ? correct.length : 1;
  const maxSelections = correct.length > 1 ? correct.length : 1;

  return {
    id: `Q${raw.questionID}`,
    type,
    prompt: raw.question || '',
    options,
    correct_option_indexes: correct,
    min_selections: Math.min(minSelections, options.length || 1),
    max_selections: Math.min(maxSelections, options.length || 1),
    explanation: raw.explanation || '',
    hint: raw.hint ?? null,
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

const readJson = async (p) => JSON.parse(await fs.promises.readFile(p, 'utf8'));
const writeJson = async (p, data) => {
  await fs.promises.mkdir(path.dirname(p), { recursive: true });
  await fs.promises.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
};

const main = async () => {
  if (!fs.existsSync(LEGACY_DIR)) {
    throw new Error(
      `Legacy questions directory missing at ${LEGACY_DIR}. If you need to re-run normalization, restore the legacy files or set LEGACY_DIR to a source path.`,
    );
  }
  const files = (await fs.promises.readdir(LEGACY_DIR)).filter((f) => /^chapter\d+\.json$/i.test(f));
  const normalizedChapters = {};
  const chapterList = [];
  const questionChapterMap = {};
  let allQuestions = [];

  for (const file of files) {
    const filePath = path.join(LEGACY_DIR, file);
    const legacy = await readJson(filePath);
    const chapterId =
      typeof legacy.chapterID === 'number'
        ? legacy.chapterID
        : Number((file.match(/\d+/) || [0])[0]);
    const chapterName = legacy.chapterName || `Chapter ${chapterId}`;

    const normalizedQuestions = (legacy.questions || []).map((q) => {
      const normalized = normalizeQuestion(q, chapterId);
      questionChapterMap[normalized.id] = chapterId;
      return normalized;
    });

    const normalizedChapter = {
      chapterID: chapterId,
      chapterName,
      questions: normalizedQuestions,
    };

    normalizedChapters[`chapter${chapterId}`] = normalizedChapter;
    chapterList.push({ chapterId, chapterName, questionCount: normalizedQuestions.length });
    allQuestions = allQuestions.concat(normalizedQuestions);

    const outPath = path.join(OUTPUT_DIR, `chapter${chapterId}.json`);
    await writeJson(outPath, normalizedChapter);
  }

  const aggregatedPath = path.join(OUTPUT_DIR, 'allChaptersData.normalized.json');
  await writeJson(aggregatedPath, { data: normalizedChapters });

  const mapPath = path.join(OUTPUT_DIR, 'question_chapter_map.json');
  await writeJson(mapPath, questionChapterMap);

  // Build exams manifest
  const exams = [];
  const allQuestionIds = allQuestions.map((q) => q.id);

  // Treat each chapter file as a fixed practice exam (no cross-mixing)
  chapterList
    .sort((a, b) => a.chapterId - b.chapterId)
    .forEach((chapter, idx) => {
      exams.push({
        id: `practice-${chapter.chapterId}`,
        title: `Practice Exam ${chapter.chapterId}`,
        mode: 'practice',
        chapter_ids: [chapter.chapterId],
        questions_per_exam: Math.min(24, chapter.questionCount),
        time_limit_minutes: 45,
        pass_mark: 0.75,
        is_free: idx === 0,
        version: 1,
        updated_at: nowIso,
      });
    });

  const examsPath = path.join(OUTPUT_DIR, 'exams.json');
  await writeJson(examsPath, exams);

  // Validation summary
  console.log(`Normalized chapters: ${chapterList.length}`);
  console.log(`Total questions: ${allQuestions.length}`);
  console.log(`Manifest entries: ${exams.length}`);
  console.log(`Output written to: ${OUTPUT_DIR}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
