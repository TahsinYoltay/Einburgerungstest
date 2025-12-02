const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// --- CONFIGURATION ---
// Languages to translate into
const TARGET_LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
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

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Helper: Delay function to respect rate limits
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// --- MAIN LOGIC ---

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
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown formatting
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error(`Error translating batch for ${languageName}:`, error.message);
    return null;
  }
}

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
    const BATCH_SIZE = 5; // Small batch size to prevent token limits
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
        // Merge translated fields back into original objects (keeping strict structure like correct_option_indexes)
        const merged = batch.map((original, index) => ({
          ...original, // keep id, type, correct_option_indexes, media, etc.
          ...batchTranslated[index] // overwrite prompt, options, explanation
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

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY is missing in .env file");
    process.exit(1);
  }

  console.log("📂 Reading source data...");
  const sourceData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

  for (const language of TARGET_LANGUAGES) {
    await processLanguage(language, sourceData);
  }

  console.log("\n✨ All translations completed successfully!");
}

main();
