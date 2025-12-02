// tools/translate-exam-openai.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const OpenAI = require('openai');

// --- CONFIGURATION ---
// Languages to translate into
const TARGET_LANGUAGES = [
  { code: 'fr', name: 'French' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' }
];

// Paths
const SOURCE_FILE = path.join(__dirname, '../src/data/exam/normalized/allChaptersData.normalized.json');
const OUTPUT_DIR = path.join(__dirname, '../src/data/exam/translations');

// --- OPENAI SETUP ---
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY is missing in .env file');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper: Delay function to respect rate limits
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// --- CLI LANGUAGE SELECTION ---

/**
 * If no CLI argument:
 *   -> return ALL TARGET_LANGUAGES
 *
 * If CLI argument given (code or name):
 *   -> return array with only that language
 */
function getLanguagesFromCli() {
  const arg = (process.argv[2] || '').toLowerCase().trim();

  // No argument -> run ALL languages
  if (!arg) {
    console.log('🌍 No language specified. Translating ALL target languages:');
    TARGET_LANGUAGES.forEach(l => console.log(`  - ${l.code} (${l.name})`));
    return TARGET_LANGUAGES;
  }

  // Try to match by code first, then by name
  const lang =
    TARGET_LANGUAGES.find(l => l.code.toLowerCase() === arg) ||
    TARGET_LANGUAGES.find(l => l.name.toLowerCase() === arg);

  if (!lang) {
    console.error(`❌ Unknown language: "${arg}"`);
    console.log('Supported languages:');
    TARGET_LANGUAGES.forEach(l => {
      console.log(`  - ${l.code} (${l.name})`);
    });
    process.exit(1);
  }

  console.log(`🌍 Translating ONLY: ${lang.code} (${lang.name})`);
  return [lang];
}

// --- OPENAI TRANSLATION LOGIC ---

async function translateBatch(questions, languageName) {
  // We only need to translate specific fields
  const simplifiedQuestions = questions.map(q => ({
    id: q.id,
    prompt: q.prompt,
    options: q.options,
    explanation: q.explanation,
    hint: q.hint
  }));

  const prompt = `
You are a professional translator for a "Life in the UK" citizenship test app. 
Translate the following JSON array of exam questions into ${languageName}.

RULES:
1. Keep the JSON structure EXACTLY the same.
2. Do NOT translate the 'id'.
3. Translate 'prompt', 'options' array, 'explanation', and 'hint'.
4. Keep the meaning precise and suitable for an official exam context.
5. Return ONLY the raw JSON array. No markdown code blocks. No extra text.

INPUT JSON:
${JSON.stringify(simplifiedQuestions)}
  `.trim();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini', // cheap + effective
      messages: [
        {
          role: 'system',
          content: 'You are a highly accurate, conservative JSON translator. You always return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
    });

    let text = response.choices[0].message.content || '';

    // Clean up potential markdown formatting (just in case)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text);
  } catch (error) {
    console.error(`Error translating batch for ${languageName}:`, error.response?.data || error.message);
    return null;
  }
}

// --- PER-LANGUAGE PROCESSING ---

async function processLanguage(language, sourceData) {
  console.log(`\n🚀 Starting translation for: ${language.name} (${language.code})...`);

  const translatedData = { ...sourceData, meta: { ...sourceData.meta, language: language.code } };
  const chapters = Object.keys(sourceData.data);

  // Create a deep copy of data structure to fill
  translatedData.data = {};

  for (const chapterKey of chapters) {
    const chapter = sourceData.data[chapterKey];
    console.log(`   Processing ${chapterKey} (${chapter.questions.length} questions)...`);

    const questions = chapter.questions;
    const BATCH_SIZE = 5; // keep as in your Gemini version
    const translatedQuestions = [];

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);

      let batchTranslated = null;
      let retries = 3;

      while (!batchTranslated && retries > 0) {
        batchTranslated = await translateBatch(batch, language.name);
        if (!batchTranslated) {
          console.log(`     ⚠️ Batch failed. Retrying... (${retries} left)`);
          retries--;
          await delay(2000);
        }
      }

      if (batchTranslated) {
        // Merge translated fields back into original objects (keeping strict structure)
        const merged = batch.map((original, index) => ({
          ...original,              // id, type, correct_option_indexes, media, meta, etc.
          ...batchTranslated[index] // prompt, options, explanation, hint
        }));
        translatedQuestions.push(...merged);
      } else {
        console.error(`     ❌ FAILED to translate batch starting at index ${i}. Keeping original English.`);
        translatedQuestions.push(...batch); // Fallback to English on failure
      }

      // Rate limiting delay
      await delay(1000);
    }

    translatedData.data[chapterKey] = {
      ...chapter,
      questions: translatedQuestions
    };
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write file
  const filename = `allChaptersData.${language.code}.json`;
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), JSON.stringify(translatedData, null, 2));
  console.log(`✅ Saved: ${filename}`);
}

// --- MAIN ---

async function main() {
  const languages = getLanguagesFromCli();

  console.log('📂 Reading source data...');
  const sourceData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

  for (const language of languages) {
    await processLanguage(language, sourceData);
  }

  console.log('\n✨ Translation completed successfully (OpenAI)!');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});