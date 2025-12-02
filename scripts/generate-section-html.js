const { execSync } = require('child_process');
const { writeFileSync, readFileSync, mkdirSync, existsSync } = require('fs');
const path = require('path');

const EPUB_PATH = path.join(__dirname, '..', 'src', 'assets', 'bookEpub', 'LIUKV3.epub');
const CHAPTERS_JSON = path.join(__dirname, '..', 'src', 'assets', 'content', 'chapters.json');
const OUTPUT_JSON = path.join(__dirname, '..', 'src', 'assets', 'content', 'bookContent.en.json');
const IMAGES_OUTPUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'book', 'images');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
  } catch (e) {
    console.warn(`Command failed: ${cmd}`);
    return '';
  }
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function listParts() {
  const out = run(`unzip -l "${EPUB_PATH}"`);
  const lines = out.split(/\r?\n/).filter(l => l.includes('OEBPS/part') && l.trim().endsWith('.xhtml'));
  return lines.map(l => l.trim().split(/\s+/).pop()).sort();
}

function extractFile(file) {
  try {
    return run(`unzip -p "${EPUB_PATH}" "${file}"`);
  } catch (e) {
    return '';
  }
}

function extractImages() {
  console.log('Extracting images...');
  ensureDir(IMAGES_OUTPUT_DIR);
  // List all files
  const out = run(`unzip -l "${EPUB_PATH}"`);
  // Filter for images in OEBPS
  const imageFiles = out.split(/\r?\n/)
    .filter(l => l.match(/OEBPS\/.*\.(jpg|jpeg|png|gif)$/i))
    .map(l => l.trim().split(/\s+/).pop());

  imageFiles.forEach(file => {
    const fileName = path.basename(file);
    const destPath = path.join(IMAGES_OUTPUT_DIR, fileName);
    // Extract to specific file
    // We use 'unzip -p' and write to file to handle flattening paths
    try {
      const buffer = execSync(`unzip -p "${EPUB_PATH}" "${file}"`);
      writeFileSync(destPath, buffer);
    } catch (e) {
      console.error(`Failed to extract ${file}`, e);
    }
  });
  console.log(`Extracted ${imageFiles.length} images to ${IMAGES_OUTPUT_DIR}`);
}

function buildCss() {
  const cssFiles = ['stylesheet.css', 'page_styles.css'];
  return cssFiles.map(extractFile).join('\n');
}

function sliceByTitle(html, target, allTitles) {
  const lower = html.toLowerCase();
  // Simple heuristic: find the title in a heading tag or similar
  // This might need tuning depending on the exact HTML structure
  const start = lower.indexOf(target.toLowerCase());
  if (start === -1) return null;
  
  let end = html.length;
  for (const title of allTitles) {
    if (title.toLowerCase() === target.toLowerCase()) continue;
    const pos = lower.indexOf(title.toLowerCase(), start + 1);
    if (pos !== -1 && pos < end) end = pos;
  }
  return html.slice(start, end);
}

function processHtml(html, css) {
  // 0. Clean up structure (strip outer tags)
  let bodyContent = html.trim();
  
  // Strip XML declaration
  bodyContent = bodyContent.replace(/<\?xml[^>]*\?>/gi, '');
  
  // Strip Head (if present) - do this before stripping body to ensure we don't leave head content if body tag is missing
  bodyContent = bodyContent.replace(/<head>[\s\S]*?<\/head>/gi, '');
  
  // Strip HTML start tag
  bodyContent = bodyContent.replace(/<html[^>]*>/gi, '');
  
  // Strip Body start tag
  bodyContent = bodyContent.replace(/<body[^>]*>/gi, '');
  
  // Strip Body/HTML end tags
  bodyContent = bodyContent.replace(/<\/body>/gi, '');
  bodyContent = bodyContent.replace(/<\/html>/gi, '');
  
  bodyContent = bodyContent.trim();

  // 1. Embed images as Base64
  let processed = bodyContent.replace(/src="([^"]+)"/g, (match, src) => {
    const filename = path.basename(src);
    const localPath = path.join(IMAGES_OUTPUT_DIR, filename);
    
    if (existsSync(localPath)) {
      try {
        const ext = path.extname(filename).toLowerCase().replace('.', '');
        // Mapping for common types
        const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        const b64 = readFileSync(localPath, 'base64');
        return `src="data:${mimeType};base64,${b64}"`;
      } catch (e) {
        console.warn(`Failed to embed ${filename}: ${e.message}`);
        return `src="${filename}"`; // Fallback
      }
    } else {
        console.warn(`Image not found: ${localPath}`);
        return `src="${filename}"`;
    }
  });

  // 2. Wrap in minimal structure with CSS
  // We insert a specific class/id for styling hooks if needed
  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
      body { font-family: -apple-system, Roboto, sans-serif; line-height: 1.6; padding: 16px; color: #000000; background-color: #ffffff; }
      img { max-width: 100%; height: auto; }
      ${css}
    </style>
  </head>
  <body>
    ${processed}
  </body>
</html>`;
}

function generate() {
  console.log('Starting generation...');
  const chaptersDef = JSON.parse(readFileSync(CHAPTERS_JSON, 'utf8')).chapters;
  const parts = listParts();
  const cssText = buildCss();
  
  extractImages();

  const outputBook = {
    language: 'en',
    version: 1,
    chapters: []
  };

  for (const chapter of chaptersDef) {
    console.log(`Processing Chapter: ${chapter.title}`);
    
    const newChapter = {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      subSections: []
    };

    const anchors = chapter.sections.map(s => s.anchor).filter(Boolean);

    // Find the specific file for this chapter
    const chapterFilePart = parts.find(p => p.endsWith(chapter.fileName));
    
    if (!chapterFilePart) {
      console.warn(`Warning: File ${chapter.fileName} not found in EPUB for chapter ${chapter.title}`);
    }

    const rawChapterContent = chapterFilePart ? extractFile(chapterFilePart) : '';

    for (const section of chapter.sections) {
      let htmlContent = '';
      
      if (rawChapterContent) {
        if (section.anchor) {
           // Find start
           const startRegex = new RegExp(`id="${section.anchor}"`, 'i');
           const startMatch = rawChapterContent.match(startRegex);
           
           if (startMatch) {
             // Backtrack to the start of the tag containing the ID
             const startIdx = rawChapterContent.lastIndexOf('<', startMatch.index);
             
             if (startIdx !== -1) {
               let endIdx = rawChapterContent.length;
               
               // Find end (next anchor)
               for (const otherAnchor of anchors) {
                 if (otherAnchor === section.anchor) continue;
                 const otherRegex = new RegExp(`id="${otherAnchor}"`, 'i');
                 const otherMatch = rawChapterContent.match(otherRegex);
                 
                 if (otherMatch && otherMatch.index > startIdx) {
                   // Backtrack to start of that tag
                   const tagStart = rawChapterContent.lastIndexOf('<', otherMatch.index);
                   if (tagStart > startIdx && tagStart < endIdx) {
                     endIdx = tagStart;
                   }
                 }
               }
               htmlContent = processHtml(rawChapterContent.slice(startIdx, endIdx), cssText);
             } else {
                htmlContent = processHtml(`<p>Invalid HTML structure for ${section.anchor}</p>`, cssText);
             }
           } else {
             htmlContent = processHtml(`<p>Anchor ${section.anchor} not found</p>`, cssText);
           }
        } else {
           // No anchor, take whole content (used for single-section chapters like Ch 2)
           htmlContent = processHtml(rawChapterContent, cssText);
        }
      } else {
        htmlContent = processHtml(`<p>Content not found for ${section.title}</p>`, cssText);
      }

      newChapter.subSections.push({
        id: section.id,
        title: section.title,
        content: htmlContent
      });
    }
    outputBook.chapters.push(newChapter);
  }

  writeFileSync(OUTPUT_JSON, JSON.stringify(outputBook, null, 2), 'utf8');
  console.log('Generated', OUTPUT_JSON);
}

generate();
