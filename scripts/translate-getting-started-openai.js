/**
 * Translate firebase_config/getting_started_help.en.json into other languages using OpenAI.
 *
 * Usage:
 *   node scripts/translate-getting-started-openai.js           # translate ALL target languages
 *   node scripts/translate-getting-started-openai.js fr        # translate only French (code or name)
 *
 * Requires:
 *   - OPENAI_API_KEY in your environment/.env
 *
 * Output:
 *   firebase_config/getting_started_help.<lang>.json
 *   (IDs, structure, and ordering are preserved; only text content is translated)
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const OpenAI = require('openai');

// --- CONFIG ---
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
  { code: 'nl', name: 'Dutch' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
];

const SOURCE_FILE = path.join(__dirname, '..', 'firebase_config', 'getting_started_help.en.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'firebase_config');

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY is missing in .env or environment.');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// CLI language selection
function getLanguagesFromCli() {
  const arg = (process.argv[2] || '').trim().toLowerCase();
  if (!arg) {
    console.log('🌍 No language specified. Translating ALL target languages:');
    TARGET_LANGUAGES.forEach((l) => console.log(`  - ${l.code} (${l.name})`));
    return TARGET_LANGUAGES;
  }

  const lang =
    TARGET_LANGUAGES.find((l) => l.code.toLowerCase() === arg) ||
    TARGET_LANGUAGES.find((l) => l.name.toLowerCase() === arg);

  if (!lang) {
    console.error(`❌ Unknown language: "${arg}"`);
    console.log('Supported languages:');
    TARGET_LANGUAGES.forEach((l) => console.log(`  - ${l.code} (${l.name})`));
    process.exit(1);
  }

  console.log(`🌍 Translating ONLY: ${lang.code} (${lang.name})`);
  return [lang];
}

// OpenAI translation
async function translateDoc(doc, languageName) {
  const prompt = `
You are a professional translator for a "Life in the UK" app onboarding/help center. Translate the given JSON into ${languageName}.

Rules:
- Keep JSON structure and ordering EXACTLY the same.
- Do NOT change or translate: keys, ids, type values.
- Translate ONLY these string fields: intro; each section.title; for content blocks: paragraph.text; list.items array strings.
- Maintain a clear, concise, supportive tone.
- Return ONLY raw JSON (no markdown).

JSON to translate:
${JSON.stringify(doc)}
  `.trim();

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: 'You are a careful JSON translator. You only return valid JSON, nothing else.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
  });

  let text = response.choices[0].message.content || '';
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}

async function processLanguage(language, sourceDoc) {
  console.log(`\n🚀 Translating getting-started help for ${language.name} (${language.code})...`);

  let translated = null;
  let retries = 3;
  while (!translated && retries > 0) {
    try {
      translated = await translateDoc(sourceDoc, language.name);
    } catch (err) {
      retries -= 1;
      console.warn(`   ⚠️ Translate failed (${retries} retries left):`, err.message);
      await delay(1500);
    }
  }

  if (!translated) {
    console.error(`❌ Could not translate ${language.name}; skipping.`);
    return;
  }

  const outPath = path.join(OUTPUT_DIR, `getting_started_help.${language.code}.json`);
  fs.writeFileSync(outPath, JSON.stringify(translated, null, 2));
  console.log(`✅ Saved ${outPath}`);
}

async function main() {
  const languages = getLanguagesFromCli();

  console.log('📂 Reading English source...');
  const source = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

  for (const lang of languages) {
    await processLanguage(lang, source);
  }

  console.log('\n✨ Done translating getting started help files.');
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
