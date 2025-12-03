// scripts/translate-book-openai.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const OpenAI = require('openai');

// --- CONFIGURATION ---
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

const SOURCE_FILE = path.join(__dirname, '../src/assets/content/bookContent.en.json');
const OUTPUT_DIR = path.join(__dirname, '../src/assets/content');

// --- OPENAI SETUP ---
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY is missing in .env file');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// --- HELPERS ---

function getLanguagesFromCli() {
  const arg = (process.argv[2] || '').toLowerCase().trim();
  if (!arg) {
    console.log('🌍 No language specified. Translating ALL target languages.');
    return TARGET_LANGUAGES;
  }
  const lang = TARGET_LANGUAGES.find(l => l.code.toLowerCase() === arg || l.name.toLowerCase() === arg);
  if (!lang) {
    console.error(`❌ Unknown language: "${arg}"`);
    process.exit(1);
  }
  console.log(`🌍 Translating ONLY: ${lang.code} (${lang.name})`);
  return [lang];
}

const IMG_PLACEHOLDER_PREFIX = '###IMG_';
const IMG_PLACEHOLDER_SUFFIX = '###';

function protectImages(html) {
  const images = [];
  // Match src="data:image/..." using new RegExp to avoid syntax issues
  const regex = new RegExp('src="data:image/[^"]+"', 'g');
  
  let protectedHtml = html.replace(regex, (match) => {
    const id = images.length;
    images.push(match); 
    return `src="${IMG_PLACEHOLDER_PREFIX}${id}${IMG_PLACEHOLDER_SUFFIX}"`;
  });
  return { protectedHtml, images };
}

function restoreImages(html, images) {
  // Restore using a flexible regex
  const regex = new RegExp(`src=["']?${IMG_PLACEHOLDER_PREFIX}(\d+)${IMG_PLACEHOLDER_SUFFIX}["']?`, 'g');
  return html.replace(regex, (match, id) => {
    const img = images[parseInt(id, 10)];
    if (!img) {
      console.warn(`   ⚠️ Warning: Could not restore image ID ${id}. Keeping placeholder.`);
      return match;
    }
    return img;
  });
}

// --- TRANSLATION FUNCTIONS ---

async function translateChapterMetadata(chapters, languageName) {
  const simplified = chapters.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description
  }));

  const prompt = `
Translate the 'title' and 'description' fields into ${languageName}.
Keep 'id' unchanged.
Return strictly valid JSON array.
INPUT: ${JSON.stringify(simplified)}
  `.trim();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful translator. Return only JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
    });
    
    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from OpenAI');
    
    let text = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    console.error(`Error translating chapter metadata: ${e.message}`);
    return null;
  }
}

async function translateSectionBatch(sections, languageName) {
  // 1. Protect images in all sections
  const protectedSections = sections.map(s => {
    const { protectedHtml, images } = protectImages(s.content);
    return {
      id: s.id,
      title: s.title,
      content: protectedHtml,
      _images: images 
    };
  });

  // 2. Prepare minimal input for AI
  const inputForAi = protectedSections.map(s => ({
    id: s.id,
    title: s.title,
    content: s.content
  }));

  const prompt = `
Translate the following JSON array into ${languageName}.
Each item has 'title' and 'content' (HTML).
RULES:
1. Translate 'title' and visible text in 'content'.
2. Do NOT translate HTML tags, classes, ids, or attributes (src, href, style).
3. Preserve the HTML structure exactly.
4. Do NOT remove the src="###IMG_x###" placeholders.
5. Return strictly valid JSON array.

INPUT:
${JSON.stringify(inputForAi)}
  `.trim();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a precise translator. Preserve HTML tags and placeholders. Return only JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response');

    let text = content.replace(/```json/g, '').replace(/```/g, '').trim();
    let translated;
    try {
        translated = JSON.parse(text);
    } catch (parseError) {
        console.error('JSON Parse Error:', text.substring(0, 100) + '...');
        throw parseError;
    }

    if (!Array.isArray(translated)) throw new Error('Response is not an array');

    // 3. Restore images
    return translated.map((t, idx) => {
      const original = protectedSections[idx];
      // Safety check: match IDs
      if (t.id !== original.id) console.warn(`   ⚠️ ID mismatch in batch: expected ${original.id}, got ${t.id}`);
      
      return {
        id: t.id || original.id,
        title: t.title,
        content: restoreImages(t.content, original._images)
      };
    });

  } catch (e) {
    console.error(`Error translating section batch: ${e.message}`);
    return null;
  }
}

async function processLanguage(language, sourceData) {
  console.log(`
🚀 Starting book translation for: ${language.name} (${language.code})...`);
  const targetFile = path.join(OUTPUT_DIR, `bookContent.${language.code}.json`);
  
  if (fs.existsSync(targetFile)) {
      console.log(`  ⚠️ File exists. Skipping...`);
      return;
  }

  const translatedBook = {
    language: language.code,
    version: sourceData.version,
    chapters: []
  };

  // 1. Translate Metadata
  console.log('  Processing Chapter Metadata...');
  const metaTranslations = await translateChapterMetadata(sourceData.chapters, language.name);
  if (!metaTranslations) {
      console.error('  ❌ Failed to translate metadata. Skipping language.');
      return;
  }

  // 2. Process Chapters & Sections
  for (let i = 0; i < sourceData.chapters.length; i++) {
    const srcChapter = sourceData.chapters[i];
    const transMeta = metaTranslations.find(t => t.id === srcChapter.id);
    
    console.log(`  📖 Chapter ${srcChapter.id}: ${srcChapter.title}`);

    const newChapter = {
      id: srcChapter.id,
      title: transMeta ? transMeta.title : srcChapter.title,
      description: transMeta ? transMeta.description : srcChapter.description,
      subSections: []
    };

    for (const section of srcChapter.subSections) {
        process.stdout.write(`    - Section ${section.id}... `);
        
        let translatedSection = null;
        let retries = 3;
        
        while (!translatedSection && retries > 0) {
            const result = await translateSectionBatch([section], language.name);
            if (result && result[0]) {
                translatedSection = result[0];
            } else {
                process.stdout.write(`(retry ${retries}) `);
                retries--;
                await delay(2000);
            }
        }

        if (translatedSection) {
            newChapter.subSections.push(translatedSection);
            console.log('✅');
        } else {
            console.log('❌ Failed (using English)');
            newChapter.subSections.push(section);
        }
        await delay(500); 
    }
    
    translatedBook.chapters.push(newChapter);
  }

  fs.writeFileSync(targetFile, JSON.stringify(translatedBook, null, 2));
  console.log(`✅ Saved: ${targetFile}`);
}

async function main() {
  const languages = getLanguagesFromCli();
  console.log(`📂 Reading source from: ${SOURCE_FILE}`);
  
  if (!fs.existsSync(SOURCE_FILE)) {
      console.error('❌ Source file not found!');
      process.exit(1);
  }
  
  const sourceData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

  for (const language of languages) {
    await processLanguage(language, sourceData);
  }
  console.log('Book translation completed!');
}

main().catch(console.error);