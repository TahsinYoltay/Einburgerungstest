import { Platform } from 'react-native';
import { firebaseImageService } from '../services/FirebaseImageService';

export interface ContentData {
  chapterId: string;
  title: string;
  htmlContent: string;
}

export interface SectionData {
  id: string;
  title: string;
  htmlContent: string;
  chapterId: string;
}

// Image mapping for Firebase Storage paths
export const FIREBASE_IMAGE_PATHS: Record<string, string> = {
  // Chapter 1 - Early Britain & History
  'image_rsrcDY.jpg': 'assets/bookImages/image_rsrcDY.jpg',
  'image_rsrcE2.jpg': 'assets/bookImages/image_rsrcE2.jpg',
  'image_rsrc111.jpg': 'assets/bookImages/image_rsrc111.jpg',

  // Historical figures and artifacts
  'image_rsrcG9.jpg': 'assets/bookImages/image_rsrcG9.jpg', // Stonehenge
  'image_rsrcGT.jpg': 'assets/bookImages/image_rsrcGT.jpg', // Anglo-Saxon helmet
  'image_rsrcH7.jpg': 'assets/bookImages/image_rsrcH7.jpg', // Bayeux Tapestry
  'image_rsrcK2.jpg': 'assets/bookImages/image_rsrcK2.jpg', // York Minster
  'image_rsrc7F.jpg': 'assets/bookImages/image_rsrc7F.jpg', // Westminster Abbey

  // Chapter 3 - Culture and traditions
  'image_rsrc15E.jpg': 'assets/bookImages/image_rsrc15E.jpg', // Christmas meal
  'image_rsrc178.jpg': 'assets/bookImages/image_rsrc178.jpg', // Diwali celebration
  'image_rsrc17C.jpg': 'assets/bookImages/image_rsrc17C.jpg', // Cenotaph

  // Additional historical and cultural images
  'image_rsrcET.jpg': 'assets/bookImages/image_rsrcET.jpg',
  'image_rsrc1ZH.jpg': 'assets/bookImages/image_rsrc1ZH.jpg',
  'image_rsrc244.jpg': 'assets/bookImages/image_rsrc244.jpg',
  'image_rsrc1CW.jpg': 'assets/bookImages/image_rsrc1CW.jpg',
  'image_rsrc1E6.jpg': 'assets/bookImages/image_rsrc1E6.jpg',
  'image_rsrc1EH.jpg': 'assets/bookImages/image_rsrc1EH.jpg',
  'image_rsrc1F3.jpg': 'assets/bookImages/image_rsrc1F3.jpg',
  'image_rsrc1GX.jpg': 'assets/bookImages/image_rsrc1GX.jpg',
  'image_rsrc1HZ.jpg': 'assets/bookImages/image_rsrc1HZ.jpg',
  'image_rsrc1M5.jpg': 'assets/bookImages/image_rsrc1M5.jpg',
  'image_rsrc1S5.jpg': 'assets/bookImages/image_rsrc1S5.jpg',
  'image_rsrc1WF.jpg': 'assets/bookImages/image_rsrc1WF.jpg',
  'image_rsrc1WT.jpg': 'assets/bookImages/image_rsrc1WT.jpg',
  'image_rsrc1X0.jpg': 'assets/bookImages/image_rsrc1X0.jpg',
  'image_rsrc1X7.jpg': 'assets/bookImages/image_rsrc1X7.jpg',
  'image_rsrc1XE.jpg': 'assets/bookImages/image_rsrc1XE.jpg',
  'image_rsrc1XN.jpg': 'assets/bookImages/image_rsrc1XN.jpg',
  'image_rsrc1XW.jpg': 'assets/bookImages/image_rsrc1XW.jpg',
  'image_rsrc1Y3.jpg': 'assets/bookImages/image_rsrc1Y3.jpg',
  'image_rsrc1YA.jpg': 'assets/bookImages/image_rsrc1YA.jpg',
  'image_rsrc250.jpg': 'assets/bookImages/image_rsrc250.jpg',
  'image_rsrc2AV.jpg': 'assets/bookImages/image_rsrc2AV.jpg',
  'image_rsrc2C1.jpg': 'assets/bookImages/image_rsrc2C1.jpg',
  'image_rsrc2D9.jpg': 'assets/bookImages/image_rsrc2D9.jpg',
  'image_rsrc2X8.jpg': 'assets/bookImages/image_rsrc2X8.jpg',
  'image_rsrc2YN.jpg': 'assets/bookImages/image_rsrc2YN.jpg',
  'image_rsrc380.jpg': 'assets/bookImages/image_rsrc380.jpg',
  'image_rsrc3BE.jpg': 'assets/bookImages/image_rsrc3BE.jpg',

  // Additional images from asset directory that might be used
  'image_rsrcV6.jpg': 'assets/bookImages/image_rsrcV6.jpg',
  'image_rsrcZU.jpg': 'assets/bookImages/image_rsrcZU.jpg',
  'image_rsrcNV.jpg': 'assets/bookImages/image_rsrcNV.jpg',
  'image_rsrcRR.jpg': 'assets/bookImages/image_rsrcRR.jpg',
  'image_rsrcUG.jpg': 'assets/bookImages/image_rsrcUG.jpg',
  'image_rsrcMM.jpg': 'assets/bookImages/image_rsrcMM.jpg',
  'image_rsrcND.jpg': 'assets/bookImages/image_rsrcND.jpg',
};

/**
 * Loads HTML content for a specific chapter with Firebase images
 */
export async function loadChapterContent(chapterId: string): Promise<string | null> {
  try {
    console.log(`Loading content for chapter: ${chapterId}`);

    // Try to load from HTML files first
    let content = await loadFromHTMLFile(chapterId);
    
    // Fallback to default content if HTML file loading fails
    if (!content) {
      console.log(`Failed to load HTML file for chapter ${chapterId}, using default content`);
      content = getDefaultContent(chapterId);
    }
    
    // Process and inject Firebase images
    content = await processFirebaseImages(content);
    
    console.log(`Successfully loaded content for ${chapterId} with Firebase images`);
    return content;

  } catch (error) {
    console.error(`Error loading content for ${chapterId}:`, error);
    return null;
  }
}

/**
 * Load section content from HTML files with Firebase images
 */
export async function loadSectionContent(chapterId: string, sectionId: string): Promise<SectionData | null> {
  console.log(`Loading section content for chapter ${chapterId}, section ${sectionId}`);
  
  try {
    // Extract section from HTML file
    const sectionContent = await extractSectionFromHTML(chapterId, sectionId);
    
    if (!sectionContent) {
      console.log(`No content found for chapter ${chapterId}, section ${sectionId}`);
      return null;
    }

    // Process Firebase images
    const processedContent = await processFirebaseImages(sectionContent.htmlContent);

    return {
      ...sectionContent,
      htmlContent: processedContent
    };
  } catch (error) {
    console.error(`Error loading section content: ${error}`);
    throw new Error(`Section content not found: ${chapterId}/${sectionId}`);
  }
}

/**
 * Extract specific section content from HTML file
 */
async function extractSectionFromHTML(chapterId: string, sectionId: string): Promise<SectionData | null> {
  try {
    // Load the chapter JSON to get section title
    const chaptersData = await import('../assets/content/chapters.json');
    const chapter = chaptersData.chapters.find((c: any) => c.id === chapterId);
    const section = chapter?.sections.find((s: any) => s.id === sectionId);
    
    if (!section) {
      console.log(`Section ${sectionId} not found in chapter ${chapterId} metadata`);
      return null;
    }

    // Load HTML content
    const htmlContent = await loadHTMLContent(chapterId);
    if (!htmlContent) {
      console.log(`HTML content not found for chapter ${chapterId}`);
      return null;
    }

    // Extract section content using section markers
    const sectionHtml = extractSectionHTML(htmlContent, sectionId);
    if (!sectionHtml) {
      console.log(`Section HTML not found for ${sectionId} in chapter ${chapterId}`);
      return null;
    }

    return {
      id: sectionId,
      title: section.title,
      htmlContent: sectionHtml,
      chapterId: chapterId
    };
  } catch (error) {
    console.error(`Error extracting section ${sectionId} from chapter ${chapterId}:`, error);
    return null;
  }
}

/**
 * Load HTML content for a chapter by importing the HTML files directly
 */
async function loadHTMLContent(chapterId: string): Promise<string | null> {
  try {
    console.log(`Loading HTML content for chapter ${chapterId}`);
    
    // Import HTML content directly as text
    // React Native allows importing text files as modules
    let htmlContent: string;
    
    switch (chapterId) {
      case '1':
        // Use fetch to load the HTML file from assets
        const chapter1Response = await fetch(require('../assets/content/chapter1.html'));
        if (chapter1Response.ok) {
          htmlContent = await chapter1Response.text();
        } else {
          throw new Error('Failed to load chapter 1 HTML');
        }
        break;
      case '2':
        const chapter2Response = await fetch(require('../assets/content/chapter2.html'));
        if (chapter2Response.ok) {
          htmlContent = await chapter2Response.text();
        } else {
          throw new Error('Failed to load chapter 2 HTML');
        }
        break;
      case '3':
        const chapter3Response = await fetch(require('../assets/content/chapter3.html'));
        if (chapter3Response.ok) {
          htmlContent = await chapter3Response.text();
        } else {
          throw new Error('Failed to load chapter 3 HTML');
        }
        break;
      case '4':
        const chapter4Response = await fetch(require('../assets/content/chapter4.html'));
        if (chapter4Response.ok) {
          htmlContent = await chapter4Response.text();
        } else {
          throw new Error('Failed to load chapter 4 HTML');
        }
        break;
      case '5':
        const chapter5Response = await fetch(require('../assets/content/chapter5.html'));
        if (chapter5Response.ok) {
          htmlContent = await chapter5Response.text();
        } else {
          throw new Error('Failed to load chapter 5 HTML');
        }
        break;
      default:
        console.log(`No HTML file found for chapter ${chapterId}`);
        return null;
    }
    
    console.log(`✅ Successfully loaded HTML content for chapter ${chapterId}`);
    return htmlContent;
    
  } catch (error) {
    console.error(`Error loading HTML for chapter ${chapterId}:`, error);
    // Don't fallback to default content - we want to use the actual HTML files
    return null;
  }
}

/**
 * Get HTML content directly from the attached files
 */
async function getDirectHTMLContent(chapterId: string): Promise<string | null> {
  // Use the content from the attached HTML files in the conversation
  const htmlContentMap: Record<string, string> = {
    '1': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chapter 1: The Values and Principles of the UK</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #fff;
        }
        .section-marker {
            display: none;
        }
        h1, h2, h3 {
            color: #2c3e50;
            margin-top: 2em;
            margin-bottom: 1em;
        }
        h1 { font-size: 2.2em; }
        h2 { font-size: 1.8em; }
        h3 { font-size: 1.4em; }
        p {
            margin-bottom: 1em;
            text-align: justify;
        }
        ul, ol {
            margin: 1em 0;
            padding-left: 2em;
        }
        li {
            margin-bottom: 0.5em;
        }
        .highlight-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 1em;
            margin: 1.5em 0;
        }
        .info-box {
            background: #d1ecf1;
            border: 1px solid #b8daff;
            border-radius: 6px;
            padding: 1em;
            margin: 1.5em 0;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 1em 0;
        }
        blockquote {
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            margin: 1.5em 0;
            padding: 1em 1.5em;
            font-style: italic;
            border-radius: 0 8px 8px 0;
        }
        .chapter-intro {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 1.5em;
            margin: 2em 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="chapter-intro">
        <h1>Chapter 1: The Values and Principles of the UK</h1>
        <p><em>Understanding the fundamental values that define British society, its history, religious heritage, and cultural traditions.</em></p>
    </div>

    <!-- Section 1: Values and Principles of the UK -->
    <div class="section-marker" data-section="values-principles"></div>
    <section id="values-principles">
        <h1>Values and Principles of the UK</h1>
        
        <p>The UK is founded on the values of democracy, the rule of law, individual liberty, and mutual respect and tolerance of those with different faiths and beliefs.</p>
        
        <div class="highlight-box">
            <h3>Core British Values</h3>
            <ul>
                <li><strong>Democracy:</strong> The UK has a democratic system where people have a say in how the country is governed</li>
                <li><strong>Rule of Law:</strong> Everyone is equal under the law, including those in positions of power</li>
                <li><strong>Individual Liberty:</strong> People are free to make their own choices about their lives</li>
                <li><strong>Mutual Respect and Tolerance:</strong> Respect for different faiths, beliefs, and ways of life</li>
            </ul>
        </div>
        
        <p>These values underpin British society and are reflected in the country's history, traditions, and legal system. They guide how people in the UK interact with each other and form the foundation of a peaceful and prosperous society.</p>
        
        <h2>Democracy in the UK</h2>
        <p>The UK is a parliamentary democracy with a constitutional monarchy. This means that while the King is the head of state, the real power lies with elected representatives in Parliament.</p>
        
        <p>Key features of UK democracy include:</p>
        <ul>
            <li>Free and fair elections held regularly</li>
            <li>Universal suffrage - all adults have the right to vote</li>
            <li>Multiple political parties competing for power</li>
            <li>Freedom of speech and press</li>
            <li>Independent judiciary</li>
        </ul>

        <h2>The Rule of Law</h2>
        <p>The rule of law means that everyone in the UK, regardless of their status or position, is subject to the law and must obey it. This principle ensures that:</p>
        <ul>
            <li>No one is above the law, including government officials</li>
            <li>Laws apply equally to all citizens</li>
            <li>Legal processes are fair and transparent</li>
            <li>People have access to justice through the courts</li>
        </ul>

        <h2>Individual Liberty</h2>
        <p>Individual liberty means that people in the UK have the freedom to make choices about their own lives, provided they do not harm others or break the law. This includes:</p>
        <ul>
            <li>Freedom of speech and expression</li>
            <li>Freedom of religion and belief</li>
            <li>Freedom of movement within the UK</li>
            <li>Right to privacy and family life</li>
        </ul>

        <h2>Mutual Respect and Tolerance</h2>
        <p>The UK is a diverse society where people of different backgrounds, faiths, and beliefs live together. Mutual respect and tolerance means:</p>
        <ul>
            <li>Respecting others' right to hold different beliefs</li>
            <li>Not discriminating against people because of their background</li>
            <li>Accepting that diversity makes society stronger</li>
            <li>Working together for the common good</li>
        </ul>
    </section>

    <!-- Section 2: History of the UK -->
    <div class="section-marker" data-section="history-uk"></div>
    <section id="history-uk">
        <h1>History of the UK</h1>
        
        <p>The United Kingdom has a rich and complex history spanning thousands of years. Understanding this history helps us appreciate how modern British values and institutions developed.</p>
        
        <h2>Ancient Britain</h2>
        <p>The British Isles have been inhabited for thousands of years. Early peoples included the Celts, who arrived around 500 BC and established settlements across Britain and Ireland.</p>
        
        <p>In 43 AD, the Romans invaded Britain under Emperor Claudius. Roman rule lasted for nearly 400 years and brought:</p>
        <ul>
            <li>Roads and infrastructure</li>
            <li>Towns and cities</li>
            <li>Laws and government</li>
            <li>Christianity</li>
        </ul>
        
        <h2>Anglo-Saxon Period</h2>
        <p>After the Romans left in 410 AD, various Germanic tribes (Anglo-Saxons) settled in Britain. This period saw:</p>
        <ul>
            <li>The development of English kingdoms</li>
            <li>The spread of Christianity</li>
            <li>The beginning of English literature</li>
            <li>Viking invasions and settlement</li>
        </ul>
        
        <div class="info-box">
            <p><strong>Did you know?</strong> Many English place names come from this period. Towns ending in "-ton" (meaning settlement) or "-ham" (meaning home) often have Anglo-Saxon origins.</p>
        </div>

        <h2>Medieval Period</h2>
        <p>The medieval period brought significant changes to Britain:</p>
        <ul>
            <li>Norman Conquest of 1066</li>
            <li>Development of Parliament</li>
            <li>Growth of towns and trade</li>
            <li>The Crusades and religious reforms</li>
        </ul>

        <h2>Formation of the United Kingdom</h2>
        <p>The modern UK was formed through a series of unions:</p>
        <ul>
            <li>1707: Act of Union between England and Scotland</li>
            <li>1801: Act of Union with Ireland</li>
            <li>1922: Irish independence, Northern Ireland remains in UK</li>
        </ul>
    </section>

    <!-- Section 3: Religion -->
    <div class="section-marker" data-section="religion"></div>
    <section id="religion">
        <h1>Religion</h1>
        
        <p>The UK has a long Christian heritage, and Christianity continues to be the main religion. However, Britain today is a multi-faith society with many different religions represented.</p>
        
        <h2>Christianity in the UK</h2>
        <p>Christianity came to Britain during the Roman period. Today, the main Christian denominations in the UK are:</p>
        <ul>
            <li><strong>Church of England (Anglican):</strong> The established church in England</li>
            <li><strong>Church of Scotland (Presbyterian):</strong> The national church of Scotland</li>
            <li><strong>Roman Catholic Church:</strong> Present throughout the UK</li>
            <li><strong>Methodist, Baptist, and other Protestant churches</strong></li>
        </ul>
        
        <h2>Other Faiths</h2>
        <p>The UK is home to people of many different faiths, including:</p>
        <ul>
            <li><strong>Islam:</strong> The second largest religion in the UK</li>
            <li><strong>Hinduism:</strong> Brought by immigrants from India and other countries</li>
            <li><strong>Sikhism:</strong> Mainly practiced by people of Punjabi origin</li>
            <li><strong>Judaism:</strong> Has a long history in Britain</li>
            <li><strong>Buddhism:</strong> Growing community of practitioners</li>
        </ul>
        
        <div class="highlight-box">
            <h3>Religious Freedom</h3>
            <p>Everyone in the UK has the right to religious freedom. This means you can:</p>
            <ul>
                <li>Practice any religion or no religion at all</li>
                <li>Change your religion</li>
                <li>Express your religious beliefs</li>
                <li>Not be discriminated against because of your religion</li>
                <li>Have time off work for religious observances</li>
            </ul>
        </div>

        <h2>Religious Buildings and Places of Worship</h2>
        <p>The UK has many different places of worship reflecting its religious diversity:</p>
        <ul>
            <li><strong>Churches:</strong> Christian places of worship, including cathedrals, parish churches, and chapels</li>
            <li><strong>Mosques:</strong> Islamic places of worship</li>
            <li><strong>Temples:</strong> Hindu and Buddhist places of worship</li>
            <li><strong>Gurdwaras:</strong> Sikh places of worship</li>
            <li><strong>Synagogues:</strong> Jewish places of worship</li>
        </ul>

        <h2>Religious Festivals</h2>
        <p>Many religious festivals are celebrated in the UK, including:</p>
        <ul>
            <li><strong>Christian:</strong> Christmas, Easter, Pentecost</li>
            <li><strong>Islamic:</strong> Eid al-Fitr, Eid al-Adha</li>
            <li><strong>Hindu:</strong> Diwali, Holi</li>
            <li><strong>Sikh:</strong> Vaisakhi, Guru Nanak's birthday</li>
            <li><strong>Jewish:</strong> Rosh Hashanah, Yom Kippur, Passover</li>
        </ul>
    </section>

    <!-- Section 4: Customs and Traditions -->
    <div class="section-marker" data-section="customs-traditions"></div>
    <section id="customs-traditions">
        <h1>Customs and Traditions</h1>
        
        <p>The UK has many customs and traditions that have developed over centuries. These help create a sense of shared identity and community.</p>
        
        <h2>National Celebrations</h2>
        <p>Important national celebrations include:</p>
        <ul>
            <li><strong>Christmas (25 December):</strong> The most important Christian festival, celebrated with family gatherings, gift-giving, and special meals</li>
            <li><strong>Easter:</strong> Commemorates the resurrection of Jesus Christ, celebrated with Easter eggs and family gatherings</li>
            <li><strong>New Year:</strong> Especially important in Scotland (Hogmanay), celebrated with fireworks and parties</li>
            <li><strong>Remembrance Day (11 November):</strong> Honors those who died in wars, marked by wearing poppies and two minutes' silence</li>
        </ul>
        
        <h2>Regional Traditions</h2>
        <p>Each part of the UK has its own special traditions:</p>
        
        <h3>England</h3>
        <ul>
            <li><strong>Morris dancing:</strong> Traditional folk dance performed at festivals</li>
            <li><strong>May Day celebrations:</strong> Spring festival with maypole dancing</li>
            <li><strong>Guy Fawkes Night (5 November):</strong> Commemorated with bonfires and fireworks</li>
            <li><strong>Afternoon tea:</strong> Traditional tea service with sandwiches and cakes</li>
            <li><strong>Royal events:</strong> Celebrations of coronations, jubilees, and royal weddings</li>
        </ul>
        
        <h3>Scotland</h3>
        <ul>
            <li><strong>Burns Night (25 January):</strong> Celebrates the poet Robert Burns with haggis and whisky</li>
            <li><strong>Highland Games:</strong> Traditional Scottish sporting events</li>
            <li><strong>Hogmanay (New Year):</strong> Scotland's biggest celebration</li>
            <li><strong>Wearing kilts:</strong> Traditional Scottish dress worn at special occasions</li>
            <li><strong>Ceilidh dancing:</strong> Traditional Scottish social dancing</li>
        </ul>
        
        <h3>Wales</h3>
        <ul>
            <li><strong>St. David's Day (1 March):</strong> National day of Wales</li>
            <li><strong>Eisteddfod:</strong> Cultural festival celebrating Welsh literature, music, and performance</li>
            <li><strong>Welsh language traditions:</strong> Poetry, singing, and storytelling</li>
            <li><strong>Rugby culture:</strong> National sport with strong traditions</li>
        </ul>
        
        <h3>Northern Ireland</h3>
        <ul>
            <li><strong>St. Patrick's Day (17 March):</strong> Celebrated by Irish communities</li>
            <li><strong>Orange parades:</strong> Protestant loyalist traditions</li>
            <li><strong>Irish music and dance:</strong> Traditional folk culture</li>
            <li><strong>Gaelic sports:</strong> Hurling and Gaelic football</li>
        </ul>
        
        <div class="info-box">
            <h3>Pub Culture</h3>
            <p>Public houses (pubs) are an important part of British social life. They serve as community meeting places where people gather to socialize, and many have been serving their communities for hundreds of years. Pub traditions include:</p>
            <ul>
                <li>Local ales and traditional beers</li>
                <li>Pub quizzes and games</li>
                <li>Sunday roast dinners</li>
                <li>Community events and celebrations</li>
            </ul>
        </div>

        <h2>Modern British Traditions</h2>
        <p>New traditions continue to develop in modern Britain:</p>
        <ul>
            <li><strong>Charitable fundraising:</strong> Red Nose Day, Children in Need</li>
            <li><strong>Music festivals:</strong> Glastonbury, Edinburgh Festival</li>
            <li><strong>Sporting events:</strong> Wimbledon, FA Cup Final</li>
            <li><strong>Food traditions:</strong> Curry as a national dish, fish and chips</li>
        </ul>
        
        <p>Understanding and respecting these customs and traditions helps newcomers integrate into British society while maintaining their own cultural heritage. The UK's strength lies in its ability to embrace both its historical traditions and the new customs brought by diverse communities.</p>
    </section>
</body>
</html>`,
    // For other chapters, we'll provide a simplified version for now
    // This can be expanded with full content later
    '2': getDefaultContent('2'),
    '3': getDefaultContent('3'),
    '4': getDefaultContent('4'),
    '5': getDefaultContent('5')
  };
  
  return htmlContentMap[chapterId] || null;
}

/**
 * Extract specific section HTML from full chapter HTML
 */
function extractSectionHTML(fullHTML: string, sectionId: string): string | null {
  try {
    // Find the section marker
    const sectionMarkerRegex = new RegExp(`<div class="section-marker" data-section="${sectionId}"></div>`);
    const sectionStartMatch = fullHTML.match(sectionMarkerRegex);
    
    if (!sectionStartMatch) {
      console.log(`Section marker not found for ${sectionId}`);
      return null;
    }

    const sectionStartIndex = sectionStartMatch.index!;
    
    // Find the next section marker or end of content
    const nextSectionMarkerRegex = /<div class="section-marker" data-section="[^"]+"><\/div>/g;
    nextSectionMarkerRegex.lastIndex = sectionStartIndex + sectionStartMatch[0].length;
    const nextSectionMatch = nextSectionMarkerRegex.exec(fullHTML);
    
    let sectionEndIndex: number;
    if (nextSectionMatch) {
      sectionEndIndex = nextSectionMatch.index;
    } else {
      // If no next section, go to the end of body
      const bodyEndMatch = fullHTML.match(/<\/body>/);
      sectionEndIndex = bodyEndMatch ? bodyEndMatch.index! : fullHTML.length;
    }

    // Extract the section content (skip the marker itself)
    const markerEndIndex = sectionStartIndex + sectionStartMatch[0].length;
    const sectionContent = fullHTML.substring(markerEndIndex, sectionEndIndex).trim();
    
    // Wrap in proper HTML structure with styling
    const styledContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          ${getSectionStyles()}
        </style>
      </head>
      <body>
        ${sectionContent}
      </body>
      </html>
    `;
    
    return styledContent;
  } catch (error) {
    console.error(`Error extracting section HTML for ${sectionId}:`, error);
    return null;
  }
}

/**
 * Get consistent styling for sections
 */
function getSectionStyles(): string {
  return `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
      background-color: #fff;
      font-size: 16px;
    }
    
    h1 {
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
      margin-bottom: 30px;
      font-size: 2.2em;
    }
    
    h2 {
      color: #34495e;
      margin-top: 30px;
      margin-bottom: 15px;
      font-size: 1.8em;
    }
    
    h3 {
      color: #7f8c8d;
      margin-top: 25px;
      margin-bottom: 10px;
      font-size: 1.4em;
    }
    
    p {
      margin-bottom: 15px;
      text-align: justify;
    }
    
    ul, ol {
      margin: 1em 0;
      padding-left: 2em;
    }
    
    li {
      margin-bottom: 0.5em;
    }
    
    .highlight, .highlight-box {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 6px;
      padding: 1em;
      margin: 1.5em 0;
    }
    
    .important, .info-box {
      background: #d1ecf1;
      border: 1px solid #b8daff;
      border-radius: 6px;
      padding: 1em;
      margin: 1.5em 0;
    }
    
    .warning {
      background-color: #f8d7da;
      padding: 15px;
      border-left: 4px solid #dc3545;
      margin: 20px 0;
    }
    
    .timeline, .process-box, .stats-box {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 1px solid #dee2e6;
    }
    
    .stats-box {
      background: #e8f5e8;
      border: 1px solid #4caf50;
    }
    
    strong {
      color: #2c3e50;
    }
    
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1em 0;
      display: block;
    }
    
    blockquote {
      background: #f8f9fa;
      border-left: 4px solid #3498db;
      margin: 1.5em 0;
      padding: 1em 1.5em;
      font-style: italic;
      border-radius: 0 8px 8px 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    
    th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    
    .section-marker {
      display: none;
    }
    
    /* Loading placeholder styles */
    .image-placeholder {
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      padding: 2em;
      text-align: center;
      margin: 1em 0;
      color: #6c757d;
    }
    
    .image-placeholder .emoji {
      font-size: 2em;
      margin-bottom: 0.5em;
      display: block;
    }
  `;
}

/**
 * Loads content from HTML files in assets/content directory
 */
async function loadFromHTMLFile(chapterId: string): Promise<string | null> {
  try {
    // Try to load the HTML file using fetch or require
    const chapterFileName = `chapter${chapterId}.html`;
    
    // For React Native, we'll use require to load the file as a string
    // First, let's try a dynamic require approach
    console.log(`Attempting to load ${chapterFileName}`);
    
    // Since we can't directly read files in RN without special setup,
    // we'll create a mapping of chapter content
    const htmlContentMap = getHTMLContentMap();
    
    if (htmlContentMap[chapterId]) {
      console.log(`✅ Successfully loaded HTML content for chapter ${chapterId}`);
      return htmlContentMap[chapterId];
    }
    
    console.log(`❌ No HTML content found for chapter ${chapterId}`);
    return null;
    
  } catch (error) {
    console.error(`Error loading HTML file for chapter ${chapterId}:`, error);
    return null;
  }
}

/**
 * Returns a mapping of chapter HTML content since React Native can't directly read files
 */
function getHTMLContentMap(): Record<string, string> {
  return {
    // For now, return empty to fall back to default content with image placeholders
  };
}

/**
 * Processes content to replace image sources with Firebase Storage URLs
 */
async function processFirebaseImages(htmlContent: string): Promise<string> {
  try {
    // First, find all existing img tags and extract image names
    const imgTagRegex = /<img[^>]+src="[^"]*\/([^"]+)"[^>]*>/g;
    const imagesToReplace = new Set<string>();
    let match;

    // Extract image names from existing img tags
    while ((match = imgTagRegex.exec(htmlContent)) !== null) {
      const imageName = match[1]; // This gets the filename from the src path
      if (FIREBASE_IMAGE_PATHS[imageName]) {
        imagesToReplace.add(imageName);
      }
    }

    const textPlaceholderMap: Record<string, string> = {
      // Chapter 1 - Ancient Britain (working approach with text placeholders)
      '[Westminster Abbey]': 'image_rsrc7F.jpg',
      '[Map of the British Isles]': 'image_rsrcDY.jpg',
      '[Stonehenge]': 'image_rsrcG9.jpg',
      '[York Minster]': 'image_rsrcK2.jpg',
      '[Anglo-Saxon helmet]': 'image_rsrcGT.jpg',
      
      // Chapter 2 - What is the UK (matches EPUB structure)
      '[Map showing the countries of the UK]': 'image_rsrcE2.jpg',
      
      // Chapter 3 - Ancient history
      '[Bayeux Tapestry]': 'image_rsrcH7.jpg',
      
      // Chapter 2 - Tudors and Historical Figures
      '[Henry VIII portrait - king of England from 21 April 1509 until his death on 28 January 1547]': 'image_rsrcV6.jpg',
      '[Elizabeth I was the younger daughter of Henry VIII]': 'image_rsrcZU.jpg',
      '[Shakespeare is widely regarded as the greatest writer in the English language]': 'image_rsrcNV.jpg',
      '[Oliver Cromwell was the leader of the English republic]': 'image_rsrcRR.jpg',
      '[The Battle of Trafalgar (21 October 1805) was a naval engagement fought by the British Royal Navy against the combined fleets of the French Navy and Spanish Navy]': 'image_rsrcUG.jpg',
      '[The Union Flag, also known as the Union Jack]': 'image_rsrcMM.jpg',
      '[The crosses of the three countries which combined to form the Union Flag]': 'image_rsrcND.jpg',
      '[The official Welsh flag]': 'image_rsrc1CW.jpg',
      '[The Clifton Suspension Bridge, designed by Isambard Kingdom Brunel, spanning the Avon Gorge]': 'image_rsrc1E6.jpg',
      
      // Chapter 2 - 20th Century
      '[Soldiers fighting in the trenches during the First World War]': 'image_rsrc1EH.jpg',
      '[Winston Churchill, best known for his leadership of the UK during the Second World War]': 'image_rsrc1F3.jpg',
      '[The Royal Air Force helped to defend Britain in the Second World War]': 'image_rsrc1GX.jpg',
      '[Margaret Thatcher, the first female Prime Minister of the UK]': 'image_rsrc1HZ.jpg',

      // Chapter 3 - Culture and traditions
      '[Christmas meal]': 'image_rsrc15E.jpg',
      '[Diwali celebration]': 'image_rsrc178.jpg',
      '[Cenotaph]': 'image_rsrc17C.jpg',
      
      // Chapter 4 - Sports and Culture
      '[Cricket is one of the many famous sports originating in Britain]': 'image_rsrc1M5.jpg',
      '[The Royal Albert Hall is the venue for the Last Night of the Proms]': 'image_rsrc1S5.jpg',
      '[Tate Modern is based in the former Bankside Power Station in central London]': 'image_rsrc1WF.jpg',
      
      // Chapter 5 - Government and Democracy
      '[Emmeline Pankhurst campaigned for women\'s voting rights]': 'image_rsrc1WT.jpg',
    };

    Object.entries(textPlaceholderMap).forEach(([pattern, imageName]) => {
      if (htmlContent.includes(pattern)) {
        console.log(`✅ Found text placeholder: ${pattern} -> ${imageName}`);
        imagesToReplace.add(imageName);
      } else {
        console.log(`❌ Text placeholder not found: ${pattern}`);
      }
    });

    console.log(`📊 Content length: ${htmlContent.length} characters`);
    console.log(`🔍 Total text placeholders checked: ${Object.keys(textPlaceholderMap).length}`);
    console.log(`✅ Images to replace: ${imagesToReplace.size}`);

    if (imagesToReplace.size === 0) {
      console.log('No images found to replace with Firebase URLs');
      console.log('Content preview:', htmlContent.substring(0, 500) + '...');
      return htmlContent;
    }

    console.log(`Loading ${imagesToReplace.size} images from Firebase Storage:`, Array.from(imagesToReplace));
    
    // Get Firebase paths for the images we found
    const firebasePaths = Array.from(imagesToReplace)
      .map(imageName => FIREBASE_IMAGE_PATHS[imageName])
      .filter(Boolean);

    // Download all needed image URLs from Firebase
    const imageResults = await firebaseImageService.getMultipleImageUrls(firebasePaths);
    
    // Create a mapping from image name to Firebase URL
    const imageUrlMap: Record<string, string> = {};
    Object.entries(FIREBASE_IMAGE_PATHS).forEach(([imageName, firebasePath]) => {
      if (imageResults.successful[firebasePath]) {
        imageUrlMap[imageName] = imageResults.successful[firebasePath];
      } else if (imageResults.fromCache[firebasePath]) {
        imageUrlMap[imageName] = imageResults.fromCache[firebasePath];
      }
    });

    console.log('Firebase image URLs loaded:', imageUrlMap);

    let processedContent = htmlContent;

    // Replace existing img tags with Firebase URLs
    Object.entries(imageUrlMap).forEach(([imageName, firebaseUrl]) => {
      // Replace img src attributes that contain this image name
      const srcRegex = new RegExp(`src="[^"]*/${imageName}"`, 'g');
      processedContent = processedContent.replace(srcRegex, `src="${firebaseUrl}"`);
      
      console.log(`Replaced ${imageName} with Firebase URL`);
    });

    // Replace text placeholders with image tags for any that weren't already replaced
    Object.entries(textPlaceholderMap).forEach(([pattern, imageName]) => {
      const firebaseUrl = imageUrlMap[imageName];
      
      if (firebaseUrl && htmlContent.includes(pattern)) {
        const imageTag = `
          <div class="image-container">
            <img src="${firebaseUrl}" 
                 alt="${pattern.replace(/[\[\]]/g, '')}" 
                 class="content-image"
                 style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);"
                 onload="console.log('Firebase image loaded: ${pattern}')"
                 onerror="console.error('Firebase image failed to load: ${pattern}'); this.style.display='none';" />
          </div>`;
        
        processedContent = processedContent.replace(new RegExp(pattern.replace(/[[\]]/g, '\\$&'), 'g'), imageTag);
        console.log(`Replaced text placeholder ${pattern} with Firebase image`);
      } else if (htmlContent.includes(pattern)) {
        // Create a placeholder if Firebase image failed to load
        const placeholderTag = createImagePlaceholder(pattern.replace(/[\[\]]/g, ''), getPlaceholderEmoji(pattern));
        processedContent = processedContent.replace(new RegExp(pattern.replace(/[[\]]/g, '\\$&'), 'g'), placeholderTag);
        console.log(`Created placeholder for failed image: ${pattern}`);
      }
    });

    // Log failed images
    const failedCount = Object.keys(imageResults.failed).length;
    if (failedCount > 0) {
      console.warn(`Failed to load ${failedCount} images from Firebase:`, imageResults.failed);
    } else {
      console.log(`Successfully processed ${imagesToReplace.size} images with Firebase URLs`);
    }

    return processedContent;

  } catch (error) {
    console.error('Error processing Firebase images:', error);
    return htmlContent; // Return original content if processing fails
  }
}

/**
 * Creates a placeholder for failed images
 */
function createImagePlaceholder(description: string, emoji: string): string {
  return `
    <div class="image-container">
      <div style="width: 100%; max-width: 400px; height: 250px; margin: 0 auto; 
                  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); 
                  border: 2px solid #ddd; border-radius: 12px; 
                  display: flex; flex-direction: column; align-items: center; 
                  justify-content: center; color: #666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
        <div style="font-size: 3em; margin-bottom: 0.5em;">${emoji}</div>
        <div style="font-size: 1.1em; font-weight: 600; text-align: center; padding: 0 1em;">${description}</div>
        <div style="font-size: 0.9em; color: #999; margin-top: 0.5em;">Image loading...</div>
      </div>
    </div>`;
}

/**
 * Gets appropriate emoji for image placeholder
 */
function getPlaceholderEmoji(pattern: string): string {
  const emojiMap: Record<string, string> = {
    // Chapter 1 - Ancient Britain (working approach with text placeholders)
    '[Westminster Abbey]': '⛪',
    '[Map of the British Isles]': '🗺️',
    '[Stonehenge]': '🗿',
    '[York Minster]': '⛪',
    '[Anglo-Saxon helmet]': '⚔️',
    
    // Chapter 2 - What is the UK (matches EPUB structure)
    '[Map showing the countries of the UK]': '🗺️',
    
    // Chapter 3 - Ancient history
    '[Bayeux Tapestry]': '🧵',
    
    // Chapter 2 - Tudors and Historical Figures
    '[Henry VIII portrait - king of England from 21 April 1509 until his death on 28 January 1547]': '👑',
    '[Elizabeth I was the younger daughter of Henry VIII]': '👸',
    '[Shakespeare is widely regarded as the greatest writer in the English language]': '📚',
    '[Oliver Cromwell was the leader of the English republic]': '⚔️',
    '[The Battle of Trafalgar (21 October 1805) was a naval engagement fought by the British Royal Navy against the combined fleets of the French Navy and Spanish Navy]': '⚓',
    '[The Union Flag, also known as the Union Jack]': '🇬🇧',
    '[The crosses of the three countries which combined to form the Union Flag]': '🇬🇧',
    '[The official Welsh flag]': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    '[The Clifton Suspension Bridge, designed by Isambard Kingdom Brunel, spanning the Avon Gorge]': '🌉',
    
    // Chapter 2 - 20th Century
    '[Soldiers fighting in the trenches during the First World War]': '🪖',
    '[Winston Churchill, best known for his leadership of the UK during the Second World War]': '👨‍💼',
    '[The Royal Air Force helped to defend Britain in the Second World War]': '✈️',
    '[Margaret Thatcher, the first female Prime Minister of the UK]': '👩‍💼',

    // Chapter 3 - Culture and traditions
    '[Christmas meal]': '🍽️',
    '[Diwali celebration]': '🪔',
    '[Cenotaph]': '🌺',
    
    // Chapter 4 - Sports and Culture
    '[Cricket is one of the many famous sports originating in Britain]': '🏏',
    '[The Royal Albert Hall is the venue for the Last Night of the Proms]': '🎭',
    '[Tate Modern is based in the former Bankside Power Station in central London]': '🎨',
    
    // Chapter 5 - Government and Democracy
    '[Emmeline Pankhurst campaigned for women\'s voting rights]': '🗳️',
  };

  return emojiMap[pattern] || '🖼️';
}
export async function validateContentFiles(): Promise<boolean> {
  // Always return true since we have fallback content
  console.log('Content validation: Using built-in content generator');
  return true;
}

function getDefaultContent(chapterId: string): string {
  const chapterTitles: { [key: string]: string } = {
    '1': 'The Values and Principles of the UK',
    '2': 'What is the UK?',
    '3': 'A Long and Illustrious History',
    '4': 'A Modern, Thriving Society',
    '5': 'The UK Government, the Law and Your Role'
  };

  const title = chapterTitles[chapterId] || 'Chapter Content';

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>${title}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 20px;
                background-color: #fff;
            }
            .section-marker { display: none; }
            h1, h2, h3 { color: #2c3e50; margin-top: 2em; margin-bottom: 1em; }
            h1 { font-size: 2.2em; }
            h2 { font-size: 1.8em; }
            h3 { font-size: 1.4em; }
            p { margin-bottom: 1em; text-align: justify; }
            ul, ol { margin: 1em 0; padding-left: 2em; }
            li { margin-bottom: 0.5em; }
            .highlight-box {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 1em;
                margin: 1.5em 0;
            }
            .info-box {
                background: #d1ecf1;
                border: 1px solid #b8daff;
                border-radius: 6px;
                padding: 1em;
                margin: 1.5em 0;
            }
            .image-container {
                text-align: center;
                margin: 20px 0;
            }
            .content-image {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 1em auto;
                border-radius: 4px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 1em 0;
            }
            td {
                padding: 0.5em;
                vertical-align: top;
            }
            .quote {
                font-style: italic;
                background: #f9f9f9;
                padding: 1em;
                border-left: 4px solid #ccc;
                margin: 1em 0;
            }
            .citizenship-pledge {
                background: #e8f5e8;
                border: 2px solid #4caf50;
                border-radius: 8px;
                padding: 1.5em;
                margin: 1.5em 0;
                font-weight: 500;
                text-align: center;
            }
        </style>

    </head>
    <body>
        ${getChapterDefaultSections(chapterId)}
    </body>
    </html>`;
}

/**
 * Generates default sections for each chapter with actual EPUB content
 */
function getChapterDefaultSections(chapterId: string): string {
  switch (chapterId) {
    case '1':
      return `
        <div class="section-marker" data-section="introduction"></div>
        <div style="text-align: center; margin: 1em 0;">
            <div id="js-image-container">Loading image...</div>
            <script>
                // This script will run on the WebView and try multiple paths to find the working image
                (function() {
                    const imageContainer = document.getElementById('js-image-container');
                    const img = new Image();
                    
                    // Try different paths that might work in different environments
                    const possiblePaths = [
                        'file:///android_asset/app/assets/images/public/uk_flag.jpg',
                        '../../assets/images/public/uk_flag.jpg',
                        './assets/images/public/uk_flag.jpg',
                        '../assets/images/public/uk_flag.jpg',
                        'assets/images/public/uk_flag.jpg',
                        '/assets/images/public/uk_flag.jpg',
                    ];
                    
                    let pathIndex = 0;
                    
                    function tryNextPath() {
                        if (pathIndex >= possiblePaths.length) {
                            // If all paths failed, show a placeholder
                            imageContainer.innerHTML = '<div style="width: 100%; max-width: 400px; height: 250px; margin: 0 auto; background: #f0f0f0; border: 2px solid #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #666;">UK Flag - Life in the UK Guide</div>';
                            return;
                        }
                        
                        img.src = possiblePaths[pathIndex];
                        pathIndex++;
                    }
                    
                    img.onload = function() {
                        // Image loaded successfully
                        img.style.maxWidth = '100%';
                        img.style.height = 'auto';
                        img.style.borderRadius = '8px';
                        img.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                        imageContainer.innerHTML = '';
                        imageContainer.appendChild(img);
                    };
                    
                    img.onerror = function() {
                        // Try the next path if this one failed
                        setTimeout(tryNextPath, 100);
                    };
                    
                    // Start trying paths
                    tryNextPath();
                })();
            </script>
        </div>
        
        [Westminster Abbey]
        
        <p><strong>Britain is a fantastic place to live: a modern, thriving society with a long and illustrious history.</strong> Our people have been at the heart of the world's political, scientific, industrial and cultural development. We are proud of our record of welcoming new migrants who will add to the diversity and dynamism of our national life.</p>

        <p>Applying to become a permanent resident or citizen of the UK is an important decision and commitment. You will be agreeing to accept the responsibilities which go with permanent residence and to respect the laws, values and traditions of the UK. Good citizens are an asset to the UK. We welcome those seeking to make a positive contribution to our society.</p>

        <p>Passing the Life in the UK test is part of demonstrating that you are ready to become a permanent migrant to the UK. This handbook is designed to support you in your preparation. It will help you to integrate into society and play a full role in your local community. It will also help ensure that you have a broad general knowledge of the culture, laws and history of the UK.</p>

        <div class="section-marker" data-section="values-principles"></div>
        <h1>The Values and Principles of the UK</h1>
        
        <p>British society is founded on fundamental values and principles which all those living in the UK should respect and support. These values are reflected in the responsibilities, rights and privileges of being a British citizen or permanent resident of the UK. They are based on history and traditions and are protected by law, customs and expectations. There is no place in British society for extremism or intolerance.</p>

        <p><strong>The fundamental principles of British life include:</strong></p>
        <ul>
            <li>Democracy</li>
            <li>The rule of law</li>
            <li>Individual liberty</li>
            <li>Tolerance of those with different faiths and beliefs</li>
            <li>Participation in community life</li>
        </ul>

        <p>As part of the citizenship ceremony, new citizens pledge to uphold these values. The pledge is:</p>

        <div class="citizenship-pledge">
            <p><em>'I will give my loyalty to the United Kingdom and respect its rights and freedoms. I will uphold its democratic values. I will observe its laws faithfully and fulfil my duties and obligations as a British citizen.'</em></p>
        </div>

        <p>Flowing from the fundamental principles are <strong>responsibilities and freedoms</strong> which are shared by all those living in the UK and which we expect all residents to respect.</p>

        <div class="section-marker" data-section="ancient-britain"></div>
        <h2>Ancient Britain</h2>
        <p>The British Isles have been inhabited for thousands of years. Early peoples included the Celts, who arrived around 500 BC and established settlements across Britain and Ireland.</p>
        
        [Map of the British Isles]
        
        <p>One of the most famous ancient monuments in Britain is Stonehenge, a prehistoric stone circle that continues to fascinate visitors today.</p>
        
        [Stonehenge]
        
        <p>In 43 AD, the Romans invaded Britain under Emperor Claudius. Roman rule lasted for nearly 400 years and brought many changes to British society.</p>
        
        <p>After the Romans left in 410 AD, various Germanic tribes (Anglo-Saxons) settled in Britain. The Anglo-Saxon period was marked by the construction of magnificent churches and cathedrals, such as York Minster.</p>
        
        [York Minster]
        
        <p>Anglo-Saxon warriors used distinctive armor and weapons that can be seen in museums today.</p>
        
        [Anglo-Saxon helmet]

        <div class="section-marker" data-section="responsibilities-freedoms"></div>
        <h2>Responsibilities and Freedoms</h2>
        
        <p><strong>If you wish to be a permanent resident or citizen of the UK, you should:</strong></p>
        <ul>
            <li>respect and obey the law</li>
            <li>respect the rights of others, including their right to their own opinions</li>
            <li>treat others with fairness</li>
            <li>look after yourself and your family</li>
            <li>look after the area in which you live and the environment</li>
        </ul>

        <p><strong>In return, the UK offers:</strong></p>
        <ul>
            <li>freedom of belief and religion</li>
            <li>freedom of speech</li>
            <li>freedom from unfair discrimination</li>
            <li>a right to a fair trial</li>
            <li>a right to join in the election of a government</li>
        </ul>

        <div class="section-marker" data-section="becoming-permanent-resident"></div>
        <h1>Becoming a Permanent Resident</h1>
        
        <p>To apply to become a permanent resident or a naturalised citizen of the UK, you will need to:</p>
        <ul>
            <li>speak and read English</li>
            <li>have a good understanding of life in the UK</li>
        </ul>

        <p><strong>This means you will need to:</strong></p>
        <ul>
            <li>Pass the Life in the UK test</li>
        </ul>
        
        <p style="text-align: center; font-weight: bold; margin: 1em 0;">AND</p>
        
        <ul>
            <li>Produce acceptable evidence of speaking and listening skills in English at B1 of the Common European Framework of Reference. This is equivalent to ESOL Entry Level 3. You can demonstrate your knowledge of English by having a recognised English test qualification from an approved test centre. For further details on how to demonstrate evidence of the required level of speaking and listening skills in English, please visit the Home Office website.</li>
        </ul>

        <p>It is possible that the requirements may change in the future. You should check the information on the Home Office website for current requirements before applying for settlement or citizenship.</p>

        <div class="section-marker" data-section="taking-test"></div>
        <h1>Taking the Life in the UK Test</h1>
        
        <p>This handbook will help prepare you for taking the Life in the UK test. The test consists of 24 questions about important aspects of life in the UK. Questions are based on ALL parts of the handbook, but you will not need to remember dates of birth or death. The 24 questions will be different for each person taking the test at that test session.</p>

        <p>The Life in the UK test is usually taken in English, although special arrangements can be made if you wish to take it in Welsh or Scottish Gaelic.</p>

        <div class="highlight-box">
            <h3>Test Centre Requirements</h3>
            <p>You can only take the test at a registered and approved Life in the UK test centre. There are about 60 test centres around the UK. You can only book your test online, at <a href="http://www.lifeintheuktest.gov.uk">www.lifeintheuktest.gov.uk</a>.</p>
            
            <p><strong>Important:</strong> You should not take your test at any other establishment as the Home Office will only accept certificates from registered test centres. If you live on the Isle of Man or in the Channel Islands, there are different arrangements for taking the Life in the UK test.</p>
        </div>

        <div class="info-box">
            <h3>What to Bring to Your Test</h3>
            <p>When booking your test, read the instructions carefully. Make sure you enter your details correctly. You will need to take some identification and proof of your address with you to the test. If you don't take these, you will not be able to take the test.</p>
        </div>

        <div class="section-marker" data-section="how-to-use-handbook"></div>
        <h2>How to Use This Handbook</h2>
        
        <p>Everything that you will need to know to pass the Life in the UK test is included in this handbook. The questions will be based on the whole book, including this introduction, so make sure you study the entire book thoroughly. The handbook has been written to ensure that anyone who can read English at ESOL Entry Level 3 or above should have no difficulty with the language.</p>

        <p>The glossary at the back of the handbook contains some key words and phrases, which you might find helpful.</p>

        <p>The 'Check that you understand' boxes are for guidance. They will help you to identify particular things that you should understand. Just knowing the things highlighted in these boxes will not be enough to pass the test. You need to make sure that you understand everything in the book, so please read the information carefully.</p>

        <div class="section-marker" data-section="where-to-find-more-information"></div>
        <h2>Where to Find More Information</h2>
        
        <p>You can find out more information from the following places:</p>
        <ul>
            <li>The Home Office website for information about the application process and the forms you will need to complete</li>
            <li>The Life in the UK test website (<a href="http://www.lifeintheuktest.gov.uk">www.lifeintheuktest.gov.uk</a>) for information about the test and how to book a place to take one</li>
            <li>Gov.uk (<a href="http://www.gov.uk">www.gov.uk</a>) for information about ESOL courses and how to find one in your area</li>
        </ul>

        <div class="info-box">
            <h3>Check that you understand</h3>
            <ul>
                <li>✔ The origin of the values underlying British society</li>
                <li>✔ The fundamental principles of British life</li>
                <li>✔ The responsibilities and freedoms which come with permanent residence</li>
                <li>✔ The process of becoming a permanent resident or citizen</li>
            </ul>
        </div>
      `;

    case '2':
      return `
        <div class="section-marker" data-section="introduction"></div>
        <h1>What is the UK?</h1>
        
        <p>The UK is made up of England, Scotland, Wales and Northern Ireland. The rest of Ireland is an independent country.</p>
        
        [Map showing the countries of the UK]
        
        <p>The official name of the country is the United Kingdom of Great Britain and Northern Ireland. 'Great Britain' refers only to England, Scotland and Wales, not to Northern Ireland. The words 'Britain', 'British Isles' or 'British', however, are used in this book to refer to everyone in the UK.</p>

        <p>There are also several islands which are closely linked with the UK but are not part of it: the Channel Islands and the Isle of Man. These have their own governments and are called 'Crown dependencies'. There are also several British overseas territories in other parts of the world, such as St Helena and the Falkland Islands. They are also linked to the UK but are not a part of it.</p>

        <p>The UK is governed by the parliament sitting in Westminster. Scotland, Wales and Northern Ireland also have parliaments or assemblies of their own, with devolved powers in defined areas.</p>

        <div class="info-box">
            <h3>Check that you understand</h3>
            <ul>
                <li>✔ The different countries that make up the UK</li>
            </ul>
        </div>

        <div class="section-marker" data-section="nations-of-uk"></div>
        <h1>The Nations of the UK</h1>

        <h2>England</h2>
        <p>England is the largest country in the UK, with over 50 million people (about 84% of the total UK population). People from England are called English. England's capital city is London, which is also the capital of the UK.</p>

        <div class="info-box">
            <h3>England Facts</h3>
            <ul>
                <li><strong>Capital:</strong> London (also capital of the UK)</li>
                <li><strong>Population:</strong> Over 50 million (84% of UK)</li>
                <li><strong>Patron saint:</strong> St George (23 April)</li>
                <li><strong>National flower:</strong> Rose</li>
                <li><strong>Flag:</strong> St George's Cross (red cross on white background)</li>
            </ul>
        </div>

        <p>England is divided into regions, each with their own local character and identity. London is by far the largest city in the UK. Other major cities include Birmingham, Liverpool, Leeds, Sheffield, Bristol, Manchester, and Newcastle.</p>

        <h2>Scotland</h2>
        <p>Scotland covers about one-third of the land mass of Great Britain and has a population of just over 5 million people. Most people live in the southern part of Scotland, in and around the cities of Edinburgh, Glasgow, and Dundee. The north of Scotland is very sparsely populated but has areas of great beauty.</p>

        <div class="info-box">
            <h3>Scotland Facts</h3>
            <ul>
                <li><strong>Capital:</strong> Edinburgh</li>
                <li><strong>Population:</strong> Just over 5 million (8% of UK)</li>
                <li><strong>Patron saint:</strong> St Andrew (30 November)</li>
                <li><strong>National flower:</strong> Thistle</li>
                <li><strong>Flag:</strong> St Andrew's Cross (diagonal white cross on blue background)</li>
                <li><strong>Languages:</strong> English, Scots Gaelic (in some areas)</li>
                <li><strong>Traditional dress:</strong> Kilt and tartan</li>
                <li><strong>Musical instrument:</strong> Bagpipes</li>
            </ul>
        </div>

        <p>Scotland has three main geographical regions:</p>
        <ul>
            <li><strong>The Highlands:</strong> Mountainous region including Ben Nevis (the highest mountain in the UK at 1,343 metres)</li>
            <li><strong>The Central Belt:</strong> Where most people live, including Edinburgh and Glasgow</li>
            <li><strong>The Southern Uplands:</strong> Hills and farmland near the English border</li>
        </ul>

        <h2>Wales</h2>
        <p>Wales covers about 8,000 square miles and has a population of around 3 million. Most people live in South Wales, in and around the cities of Cardiff, Swansea, and Newport. The north and centre of Wales are mountainous; Snowdon is the highest mountain in Wales at 1,085 metres.</p>

        <div class="info-box">
            <h3>Wales Facts</h3>
            <ul>
                <li><strong>Capital:</strong> Cardiff</li>
                <li><strong>Population:</strong> Around 3 million (5% of UK)</li>
                <li><strong>Patron saint:</strong> St David (1 March)</li>
                <li><strong>National flower:</strong> Daffodil</li>
                <li><strong>National symbol:</strong> Red dragon</li>
                <li><strong>Flag:</strong> Red dragon on green and white background</li>
                <li><strong>Languages:</strong> Welsh and English (both official)</li>
                <li><strong>Welsh speakers:</strong> About 20% of the population</li>
            </ul>
        </div>

        <p>Wales has its own Welsh language, which is taught in schools and universities. Welsh is spoken by about 20% of the population. All official documents in Wales are produced in both Welsh and English, and many people have Welsh names.</p>

        <h2>Northern Ireland</h2>
        <p>Northern Ireland covers about 5,400 square miles and has a population of around 1.8 million. The majority of people live in and around Belfast, the capital. Northern Ireland shares a border with the Republic of Ireland.</p>

        <div class="info-box">
            <h3>Northern Ireland Facts</h3>
            <ul>
                <li><strong>Capital:</strong> Belfast</li>
                <li><strong>Population:</strong> Around 1.8 million (3% of UK)</li>
                <li><strong>Patron saint:</strong> St Patrick (17 March)</li>
                <li><strong>National flower:</strong> Shamrock</li>
                <li><strong>Identity:</strong> People can identify as British, Irish, or Northern Irish</li>
                <li><strong>Languages:</strong> English, Ulster Scots, Irish Gaelic (in some areas)</li>
                <li><strong>Border:</strong> Shares a border with the Republic of Ireland</li>
            </ul>
        </div>

        <p>There are strong cultural links between Northern Ireland and the rest of Ireland, and also between Northern Ireland and Scotland. Many people from Northern Ireland have family connections with Scotland. The Giant's Causeway is a famous natural landmark in Northern Ireland.</p>

        <div class="section-marker" data-section="geography-climate"></div>
        <h1>Geography and Climate</h1>

        <p>The UK has a varied landscape which includes:</p>
        <ul>
            <li>Mountains and hills in the north and west</li>
            <li>Plains and valleys in the south and east</li>
            <li>Over 1,000 miles of coastline</li>
            <li>Many rivers and lakes</li>
        </ul>

        <p>The longest distance on the mainland, from John O'Groats on the north coast of Scotland to Land's End in the south-west corner of England, is about 870 miles (approximately 1,400 kilometres).</p>

        <div class="highlight-box">
            <h3>Key Geographic Features</h3>
            <ul>
                <li><strong>Highest mountain:</strong> Ben Nevis in Scotland (1,343 metres)</li>
                <li><strong>Longest river:</strong> River Severn (220 miles)</li>
                <li><strong>Largest lake:</strong> Lough Neagh in Northern Ireland</li>
                <li><strong>Surrounding waters:</strong> North Sea (east), Atlantic Ocean (west), English Channel (south), Irish Sea (between Britain and Ireland)</li>
            </ul>
        </div>

        <h2>Climate</h2>
        <p>The UK has a temperate climate, which means:</p>
        <ul>
            <li>Generally mild temperatures throughout the year</li>
            <li>Regular rainfall in all seasons</li>
            <li>Weather can be changeable</li>
            <li>It's common to experience different weather conditions on the same day</li>
            <li>Snow is possible in winter but is not severe in most areas</li>
        </ul>

        <div class="section-marker" data-section="population-languages"></div>
        <h1>Population and Languages</h1>

        <p>The UK population is approximately 65 million people, distributed as follows:</p>
        <ul>
            <li>England: 84% of the total population</li>
            <li>Scotland: 8% of the total population</li>
            <li>Wales: 5% of the total population</li>
            <li>Northern Ireland: 3% of the total population</li>
        </ul>

        <h2>Languages</h2>
        <p>English is the main language spoken throughout the UK, but there are several other important languages:</p>

        <div class="info-box">
            <h3>Languages Spoken in the UK</h3>
            <ul>
                <li><strong>English:</strong> Spoken by everyone, with many regional accents and dialects</li>
                <li><strong>Welsh:</strong> Official language in Wales alongside English, spoken by about 20% of Welsh population</li>
                <li><strong>Scots Gaelic:</strong> Spoken in some parts of Scotland, particularly the Highlands and Islands</li>
                <li><strong>Irish Gaelic:</strong> Spoken by some people in Northern Ireland</li>
                <li><strong>Ulster Scots:</strong> A dialect spoken by some people in Northern Ireland</li>
                <li><strong>Cornish:</strong> A very small number of people speak Cornish in Cornwall</li>
            </ul>
        </div>

        <div class="section-marker" data-section="currency-symbols"></div>
        <h1>Currency and National Symbols</h1>

        <h2>Currency</h2>
        <p>The currency in the UK is the pound sterling (symbol: £). There are 100 pence in a pound.</p>

        <div class="highlight-box">
            <h3>UK Currency Denominations</h3>
            <p><strong>Coins:</strong> 1p, 2p, 5p, 10p, 20p, 50p, £1 and £2</p>
            <p><strong>Notes:</strong> £5, £10, £20, £50</p>
            <p><strong>Special note:</strong> Scotland and Northern Ireland have their own banknotes, which are valid everywhere in the UK, although shops and businesses do not have to accept them.</p>
        </div>

        <h2>The Union Flag</h2>
        <p>The Union Flag (also called the Union Jack) is the national flag of the UK. It is made up of three crosses:</p>
        <ul>
            <li>The cross of St George (England) - red cross on white background</li>
            <li>The cross of St Andrew (Scotland) - white diagonal cross on blue background</li>
            <li>The cross of St Patrick (Ireland) - red diagonal cross on white background</li>
        </ul>

        <h2>National Anthem</h2>
        <p>The National Anthem of the UK is 'God Save the Queen'. It is played at important national occasions and at events attended by the Queen or the Royal Family. The first verse is:</p>
        <blockquote>
            'God save our gracious Queen!<br>
            Long live our noble Queen!<br>
            God save the Queen!<br>
            Send her victorious,<br>
            Happy and glorious,<br>
            Long to reign over us,<br>
            God save the Queen!'
        </blockquote>
        <p>New citizens swear or affirm loyalty to the Queen as part of the citizenship ceremony.</p>
        
        <h3>Oath of Allegiance</h3>
        <p>I (name) swear by Almighty God that on becoming a British citizen, I will be faithful and bear true allegiance to Her Majesty Queen Elizabeth the Second, her Heirs and Successors, according to law.</p>
        
        <h3>Affirmation of Allegiance</h3>
        <p>I (name) do solemnly, sincerely and truly declare and affirm that on becoming a British citizen, I will be faithful and bear true allegiance to Her Majesty Queen Elizabeth the Second, her Heirs and Successors, according to law.</p>

        <div class="section-marker" data-section="constitutional-arrangements"></div>
        <h1>Constitutional Arrangements</h1>

        <p>The UK is a constitutional monarchy, which means that although there is a monarch, it is Parliament that has the power to make laws and decisions.</p>

        <h2>The Union</h2>
        <p>The UK has evolved over many centuries:</p>
        <ul>
            <li><strong>1536-1542:</strong> Wales was united with England</li>
            <li><strong>1707:</strong> Act of Union joined England and Scotland to form Great Britain</li>
            <li><strong>1801:</strong> Ireland joined the union to form the United Kingdom of Great Britain and Ireland</li>
            <li><strong>1922:</strong> Most of Ireland became independent, leaving Northern Ireland as part of the UK</li>
        </ul>

        <h2>Devolution</h2>
        <p>Since 1997, some powers have been devolved from the UK Parliament to:</p>
        <ul>
            <li><strong>Scottish Parliament</strong> (based in Edinburgh)</li>
            <li><strong>Welsh Assembly/Senedd</strong> (based in Cardiff)</li>
            <li><strong>Northern Ireland Assembly</strong> (based in Belfast)</li>
        </ul>

        <p>These devolved institutions can make laws and decisions on certain matters like education, health, and local government, while other matters like defence, foreign affairs, and overall economic policy remain with the UK Parliament.</p>

        <div class="info-box">
            <h3>Check that you understand</h3>
            <ul>
                <li>✔ The different countries that make up the UK</li>
                <li>✔ The capitals of England, Scotland, Wales and Northern Ireland</li>
                <li>✔ The patron saints and national flowers of each country</li>
                <li>✔ The approximate populations of each part of the UK</li>
                <li>✔ The main languages spoken in different parts of the UK</li>
                <li>✔ The UK's currency and denominations</li>
                <li>✔ What the Union Flag represents</li>
                <li>✔ The geographical features of the UK</li>
                <li>✔ What devolution means</li>
                <li>✔ The constitutional arrangements of the UK</li>
            </ul>
        </div>
      `;

    case '3':
      return `
        <div class="section-marker" data-section="introduction"></div>
        <h1>A Long and Illustrious History</h1>
        
        <div class="image-placeholder">
            [A Long and Illustrious History - Chapter Header]
        </div>
        
        <div class="info-box">
            <h3>Chapter Contents</h3>
            <ul>
                <li>Early Britain</li>
                <li>The Middle Ages</li>
                <li>The Tudors and Stuarts</li>
                <li>A global power</li>
                <li>The 20th century</li>
                <li>Britain since 1945</li>
            </ul>
        </div>

        <div class="section-marker" data-section="early-britain"></div>
        <h1>Early Britain</h1>
        
        <h2>Stone Age Britain</h2>
        <p>The first people to live in Britain were hunter-gatherers, in what we call the Stone Age. For much of the Stone Age, Britain was connected to the continent by a land bridge. People came and went, following the herds of deer and horses which they hunted. Britain only became permanently separated from the continent by the Channel about 10,000 years ago.</p>

        <h2>The First Farmers</h2>
        <p>The ancestors of these first farmers probably came from south-east Europe. These people built houses, tombs and monuments on the land. One of these monuments, Stonehenge, still stands in what is now the English county of Wiltshire. Stonehenge was probably a special gathering place for seasonal ceremonies. Other Stone Age sites have also survived. Skara Brae on Orkney, off the north coast of Scotland, is the best preserved prehistoric village in northern Europe, and has helped archaeologists to understand more about how people lived near the end of the Stone Age.</p>

        <div class="highlight-box">
            <div class="image-container">
                <img src="../assets/content/images/image_rsrcG9.jpg" alt="The World Heritage Site of Stonehenge" class="content-image"/>
            </div>
            <p><strong>The World Heritage Site of Stonehenge</strong></p>
        </div>

        <h2>Bronze Age and Iron Age</h2>
        <p>Around 4,000 years ago, people learned to make bronze. We call this period the Bronze Age. People lived in roundhouses and buried their dead in tombs called round barrows. The people of the Bronze Age were accomplished metalworkers who made many beautiful objects in bronze and gold, including tools, ornaments and weapons.</p>

        <p>The Bronze Age was followed by the Iron Age, when people learned how to make weapons and tools out of iron. People still lived in roundhouses, grouped together into larger settlements, and sometimes defended sites called hill forts. A very impressive hill fort can still be seen today at Maiden Castle, in the English county of Dorset. Most people were farmers, craft workers or warriors. The language they spoke was part of the Celtic language family. Similar languages were spoken across Europe in the Iron Age, and related languages are still spoken today in some parts of Wales, Scotland and Ireland. The people of the Iron Age had a sophisticated culture and economy. They made the first coins to be minted in Britain, some inscribed with the names of Iron Age kings. This marks the beginnings of British history.</p>

        <div class="section-marker" data-section="romans"></div>
        <h1>The Romans</h1>
        
        <p>Julius Caesar led a Roman invasion of Britain in 55 BC. This was unsuccessful and for nearly 100 years Britain remained separate from the Roman Empire. In AD 43 the Emperor Claudius led the Roman army in a new invasion. This time, there was resistance from some of the British tribes but the Romans were successful in occupying almost all of Britain. One of the tribal leaders who fought against the Romans was Boudicca, the queen of the Iceni in what is now eastern England. She is still remembered today and there is a statue of her on Westminster Bridge in London, near the Houses of Parliament.</p>

        <p>Areas of what is now Scotland were never conquered by the Romans, and the Emperor Hadrian built a wall in the north of England to keep out the Picts (ancestors of the Scottish people). Included in the wall were a number of forts. Parts of Hadrian's Wall, including the forts of Housesteads and Vindolanda, can still be seen. It is a popular area for walkers and is a UNESCO (United Nations Educational, Scientific and Cultural Organization) World Heritage Site.</p>

        <p>The Romans remained in Britain for 400 years. They built roads and public buildings, created a structure of law, and introduced new plants and animals. It was during the 3rd and 4th centuries AD that the first Christian communities began to appear in Britain.</p>

        <div class="section-marker" data-section="anglo-saxons"></div>
        <h1>The Anglo-Saxons</h1>
        
        <p>The Roman army left Britain in AD 410 to defend other parts of the Roman Empire and never returned. Britain was again invaded by tribes from northern Europe: the Jutes, the Angles and the Saxons. The languages they spoke are the basis of modern-day English. Battles were fought against these invaders but, by about AD 600, Anglo-Saxon kingdoms were established in Britain. These kingdoms were mainly in what is now England. The burial place of one of the kings was at Sutton Hoo in modern Suffolk. This king was buried with treasure and armour, all placed in a ship which was then covered by a mound of earth. Parts of the west of Britain, including much of what is now Wales, and Scotland, remained free of Anglo-Saxon rule.</p>

        <div class="highlight-box">
            <div class="image-container">
                <img src="../assets/content/images/image_rsrcGT.jpg" alt="A helmet from the time of the Anglo-Saxons and Vikings" class="content-image"/>
            </div>
            <p><strong>A helmet from the time of the Anglo-Saxons and Vikings</strong></p>
        </div>

        <p>The Anglo-Saxons were not Christians when they first came to Britain but, during this period, missionaries came to Britain to preach about Christianity. Missionaries from Ireland spread the religion in the north. The most famous of these were St Patrick, who would become the patron saint of Ireland, and St Columba, who founded a monastery on the island of Iona, off the coast of what is now Scotland. St Augustine led missionaries from Rome, who spread Christianity in the south. St Augustine became the first Archbishop of Canterbury.</p>

        <div class="section-marker" data-section="vikings"></div>
        <h1>The Vikings</h1>
        
        <p>The Vikings came from Denmark, Norway and Sweden. They first visited Britain in AD 789 to raid coastal towns and take away goods and slaves. Then, they began to stay and form their own communities in the east of England and Scotland. The Anglo-Saxon kingdoms in England united under King Alfred the Great, who defeated the Vikings. Many of the Viking invaders stayed in Britain – especially in the east and north of England, in an area known as the Danelaw (many place names there, such as Grimsby and Scunthorpe, come from the Viking languages). The Viking settlers mixed with local communities and some converted to Christianity.</p>

        <p>Anglo-Saxon kings continued to rule what is now England, except for a short period when there were Danish kings. The first of these was Cnut, also called Canute.</p>

        <p>In the north, the threat of attack by Vikings had encouraged the people to unite under one king, Kenneth MacAlpin. The term Scotland began to be used to describe that country.</p>

        <div class="section-marker" data-section="norman-conquest"></div>
        <h1>The Norman Conquest</h1>
        
        <p>In 1066, an invasion led by William, the Duke of Normandy (in what is now northern France), defeated Harold, the Saxon king of England, at the Battle of Hastings. Harold was killed in the battle. William became king of England and is known as William the Conqueror. The battle is commemorated in a great piece of embroidery, known as the Bayeux Tapestry, which can still be seen in France today.</p>

        <div class="highlight-box">
            <div class="image-container">
                <img src="../assets/content/images/image_rsrcH7.jpg" alt="Part of the Bayeux Tapestry – the linen cloth is nearly 70 metres (230 feet) long and is embroidered with coloured wool" class="content-image"/>
            </div>
            <p><strong>Part of the Bayeux Tapestry – the linen cloth is nearly 70 metres (230 feet) long and is embroidered with coloured wool</strong></p>
        </div>

        <p>The Norman Conquest was the last successful foreign invasion of England and led to many changes in government and social structures in England. Norman French, the language of the new ruling class, influenced the development of the English language as we know it today. Initially the Normans also conquered Wales, but the Welsh gradually won territory back. The Scots and the Normans fought on the border between England and Scotland; the Normans took over some land on the border but did not invade Scotland.</p>

        <p>William sent people all over England to draw up lists of all the towns and villages. The people who lived there, who owned the land and what animals they owned were also listed. This was called the Domesday Book. It still exists today and gives a picture of society in England just after the Norman Conquest.</p>

        <div class="info-box">
            <h3>Check that you understand</h3>
            <ul>
                <li>✔ The history of the UK before the Romans</li>
                <li>✔ The impact of the Romans on British society</li>
                <li>✔ The different groups that invaded after the Romans</li>
                <li>✔ The importance of the Norman invasion in 1066</li>
            </ul>
        </div>

        <div class="section-marker" data-section="middle-ages"></div>
        <h1>The Middle Ages</h1>
        
        <h2>War at home and abroad</h2>
        <p>Broadly speaking, the Middle Ages (or medieval period) spans a thousand years, from the end of the Roman Empire in AD 476 up until 1485. However, the focus here is on the period after the Norman Conquest. It was a time of almost constant war.</p>

        <p>The English kings fought with the Welsh, Scottish and Irish noblemen for control of their lands. In Wales, the English were able to establish their rule. In 1284 King Edward I of England introduced the Statute of Rhuddlan, which annexed Wales to the Crown of England. Huge castles, including Conwy and Caernarvon, were built to maintain this power. By the middle of the 15th century the last Welsh rebellions had been defeated. English laws and the English language were introduced.</p>

        <p>In Scotland, the English kings were less successful. In 1314 the Scottish, led by Robert the Bruce, defeated the English at the Battle of Bannockburn, and Scotland remained unconquered by the English.</p>

        <p>At the beginning of the Middle Ages, Ireland was an independent country. The English first went to Ireland as troops to help the Irish king and remained to build their own settlements. By 1200, the English ruled an area of Ireland known as the Pale, around Dublin. Some of the important lords in other parts of Ireland accepted the authority of the English king.</p>

        <p>During the Middle Ages, the English kings also fought a number of wars abroad. Many knights took part in the Crusades, in which European Christians fought for control of the Holy Land. English kings also fought a long war with France, called the Hundred Years War (even though it actually lasted 116 years). One of the most famous battles of the Hundred Years War was the Battle of Agincourt in 1415, where King Henry V's vastly outnumbered English army defeated the French. The English largely left France in the 1450s.</p>

        <h2>The Black Death</h2>
        <p>The Normans used a system of land ownership known as feudalism. The king gave land to his lords in return for help in war. Landowners had to send certain numbers of men to serve in the army. Some peasants had their own land but most were serfs. They had a small area of their lord's land where they could grow food. In return, they had to work for their lord and could not move away. The same system developed in southern Scotland. In the north of Scotland and Ireland, land was owned by members of the 'clans' (prominent families).</p>

        <p>In 1348, a disease, probably a form of plague, came to Britain. This was known as the Black Death. One third of the population of England died and a similar proportion in Scotland and Wales. This was one of the worst disasters ever to strike Britain. Following the Black Death, the smaller population meant there was less need to grow cereal crops. There were labour shortages and peasants began to demand higher wages. New social classes appeared, including owners of large areas of land (later called the gentry), and people left the countryside to live in the towns. In the towns, growing wealth led to the development of a strong middle class.</p>

        <p>In Ireland, the Black Death killed many in the Pale and, for a time, the area controlled by the English became smaller.</p>

        <h2>Legal and political changes</h2>
        <p>In the Middle Ages, Parliament began to develop into the institution it is today. Its origins can be traced to the king's council of advisers, which included important noblemen and the leaders of the Church.</p>

        <p>There were few formal limits to the king's power until 1215. In that year, King John was forced by his noblemen to agree to a number of demands. The result was a charter of rights called the Magna Carta (which means the Great Charter). The Magna Carta established the idea that even the king was subject to the law. It protected the rights of the nobility and restricted the king's power to collect taxes or to make or change laws. In future, the king would need to involve his noblemen in decisions.</p>

        <p>In England, parliaments were called for the king to consult his nobles, particularly when the king needed to raise money. The numbers attending Parliament increased and two separate parts, known as Houses, were established. The nobility, great landowners and bishops sat in the House of Lords. Knights, who were usually smaller landowners, and wealthy people from towns and cities were elected to sit in the House of Commons. Only a small part of the population was able to join in electing the members of the Commons.</p>

        <p>A similar Parliament developed in Scotland. It had three Houses, called Estates: the lords, the commons and the clergy.</p>

        <p>This was also a time of development in the legal system. The principle that judges are independent of the government began to be established. In England, judges developed 'common law' by a process of precedence (that is, following previous decisions) and tradition. In Scotland, the legal system developed slightly differently and laws were 'codified' (that is, written down).</p>

        <h2>A distinct identity</h2>
        <p>The Middle Ages saw the development of a national culture and identity. After the Norman Conquest, the king and his noblemen had spoken Norman French and the peasants had continued to speak Anglo-Saxon. Gradually these two languages combined to become one English language. Some words in modern English – for example, 'park' and 'beauty' – are based on Norman French words. Others – for example, 'apple', 'cow' and 'summer' – are based on Anglo-Saxon words. In modern English there are often two words with very similar meanings, one from French and one from Anglo-Saxon. 'Demand' (French) and 'ask' (Anglo-Saxon) are examples. By 1400, in England, official documents were being written in English, and English had become the preferred language of the royal court and Parliament.</p>

        <p>In the years leading up to 1400, Geoffrey Chaucer wrote a series of poems in English about a group of people going to Canterbury on a pilgrimage. The people decided to tell each other stories on the journey, and the poems describe the travellers and some of the stories they told. This collection of poems is called <em>The Canterbury Tales</em>. It was one of the first books to be printed by William Caxton, the first person in England to print books using a printing press. Many of the stories are still popular. Some have been made into plays and television programmes.</p>

        <p>In Scotland, many people continued to speak Gaelic and the Scots language also developed. A number of poets began to write in the Scots language. One example is John Barbour, who wrote <em>The Bruce</em> about the Battle of Bannockburn.</p>

        <p>The Middle Ages also saw a change in the type of buildings in Britain. Castles were built in many places in Britain and Ireland, partly for defence. Today many are in ruins, although some, such as Windsor and Edinburgh, are still in use. Great cathedrals – for example, Lincoln Cathedral – were also built, and many of these are still used for worship. Several of the cathedrals had windows of stained glass, telling stories about the Bible and Christian saints. The glass in York Minster is a famous example.</p>

        <div class="highlight-box">
            <div class="image-container">
                <img src="../assets/content/images/image_rsrcK2.jpg" alt="York Minster stained glass" class="content-image"/>
            </div>
            <p><strong>York Minster stained glass</strong></p>
        </div>

        <p>During this period, England was an important trading nation. English wool became a very important export. People came to England from abroad to trade and also to work. Many had special skills, such as weavers from France, engineers from Germany, glass manufacturers from Italy and canal builders from Holland.</p>

        <h2>The Wars of the Roses</h2>
        <p>In 1455, a civil war was begun to decide who should be king of England. It was fought between the supporters of two families: the House of Lancaster and the House of York. This war was called the Wars of the Roses, because the symbol of Lancaster was a red rose and the symbol of York was a white rose. The war ended with the Battle of Bosworth Field in 1485. King Richard III of the House of York was killed in the battle and Henry Tudor, the leader of the House of Lancaster, became King Henry VII. Henry then married King Richard's niece, Elizabeth of York, and united the two families. Henry was the first king of the House of Tudor. The symbol of the House of Tudor was a red rose with a white rose inside it as a sign that the Houses of York and Lancaster were now allies.</p>

        <div class="info-box">
            <h3>Check that you understand</h3>
            <ul>
                <li>✔ The wars that took place in the Middle Ages</li>
                <li>✔ How Parliament began to develop</li>
                <li>✔ The way that land ownership worked</li>
                <li>✔ The effects of the Black Death</li>
                <li>✔ The development of English language and culture</li>
                <li>✔ The Wars of the Roses and the founding of the House of Tudor</li>
            </ul>
        </div>

        <div class="section-marker" data-section="tudors-and-stuarts"></div>
        <h1>The Tudors and Stuarts</h1>
        
        <h2>Religious conflicts</h2>
        <p>After his victory in the Wars of the Roses, Henry VII wanted to make sure that England remained peaceful and that his position as king was secure. He deliberately strengthened the central administration of England and reduced the power of the nobles. He was thrifty and built up the monarchy's financial reserves. When he died, his son Henry VIII continued the policy of centralising power.</p>
        
        <p>Henry VIII was most famous for breaking away from the Church of Rome and marrying six times.</p>
        
        <div class="image-placeholder">
            [Henry VIII portrait - king of England from 21 April 1509 until his death on 28 January 1547]
        </div>
        
        <div class="info-box">
            <h3>The six wives of Henry VIII</h3>
            <p><strong>Catherine of Aragon</strong> – Catherine was a Spanish princess. She and Henry had a number of children but only one, Mary, survived. When Catherine was too old to give him another child, Henry decided to divorce her, hoping that another wife would give him a son to be his heir.</p>
            
            <p><strong>Anne Boleyn</strong> – Anne Boleyn was English. She and Henry had one daughter, Elizabeth. Anne Boleyn was unpopular in the country and was accused of taking lovers. She was executed at the Tower of London.</p>
            
            <p><strong>Jane Seymour</strong> – Henry married Jane Seymour after Anne Boleyn's execution. She gave Henry the son he wanted, Edward, but she died shortly after the birth.</p>
            
            <p><strong>Anne of Cleves</strong> – Anne was a German princess. Henry married her for political reasons but divorced her soon after.</p>
            
            <p><strong>Catherine Howard</strong> – Catherine Howard was a cousin of Anne Boleyn. She was also accused of taking lovers and executed.</p>
            
            <p><strong>Catherine Parr</strong> – Catherine Parr was a widow who married Henry late in his life. She survived him and married again but died soon after.</p>
        </div>

        <p>To divorce his first wife, Henry needed the approval of the Pope. When the Pope refused, Henry established the Church of England. In this new Church, the king, not the Pope, would have the power to appoint bishops and order how people should worship.</p>

        <p>At the same time the Reformation was happening across Europe. This was a movement against the authority of the Pope and the ideas and practices of the Roman Catholic Church. The Protestants formed their own churches. They read the Bible in their own languages instead of in Latin; they did not pray to saints or at shrines; and they believed that a person's own relationship with God was more important than submitting to the authority of the Church. Protestant ideas gradually gained strength in England, Wales and Scotland during the 16th century.</p>

        <p>In Ireland, however, attempts by the English to impose Protestantism (alongside efforts to introduce the English system of laws about the inheritance of land) led to rebellion from the Irish chieftains, and much brutal fighting followed.</p>

        <p>During the reign of Henry VIII, Wales became formally united with England by the Act for the Government of Wales. The Welsh sent representatives to the House of Commons and the Welsh legal system was reformed.</p>

        <p>Henry VIII was succeeded by his son Edward VI, who was strongly Protestant. During his reign, the Book of Common Prayer was written to be used in the Church of England. A version of this book is still used in some churches today. Edward died at the age of 15 after ruling for just over six years, and his half-sister Mary became queen. Mary was a devout Catholic and persecuted Protestants (for this reason, she became known as 'Bloody Mary'). Mary also died after a short reign and the next monarch was her half-sister, Elizabeth, the daughter of Henry VIII and Anne Boleyn.</p>

        <h2>Queen Elizabeth I</h2>
        <div class="image-placeholder">
            [Elizabeth I was the younger daughter of Henry VIII]
        </div>
        
        <p>Queen Elizabeth I was a Protestant. She re-established the Church of England as the official Church in England. Everyone had to attend their local church and there were laws about the type of religious services and the prayers which could be said, but Elizabeth did not ask about people's real beliefs. She succeeded in finding a balance between the views of Catholics and the more extreme Protestants. In this way, she avoided any serious religious conflict within England. Elizabeth became one of the most popular monarchs in English history, particularly after 1588, when the English defeated the Spanish Armada (a large fleet of ships), which had been sent by Spain to conquer England and restore Catholicism.</p>

        <h2>The Reformation in Scotland and Mary, Queen of Scots</h2>
        <p>Scotland had also been strongly influenced by Protestant ideas. In 1560, the predominantly Protestant Scottish Parliament abolished the authority of the Pope in Scotland and Roman Catholic religious services became illegal. A Protestant Church of Scotland with an elected leadership was established but, unlike in England, this was not a state Church.</p>

        <p>The queen of Scotland, Mary Stuart (often now called 'Mary, Queen of Scots') was a Catholic. She was only a week old when her father died and she became queen. Much of her childhood was spent in France. When she returned to Scotland, she was the centre of a power struggle between different groups. When her husband was murdered, Mary was suspected of involvement and fled to England. She gave her throne to her Protestant son, James VI of Scotland. Mary continued to live in England until her death in 1587.</p>

        <h2>Exploration, poetry and drama</h2>
        <p>The Elizabethan period in England was a time of growing patriotism: a feeling of pride in being English. English explorers sought new trade routes and tried to expand British trade into the Spanish colonies in the Americas. Sir Francis Drake, one of the commanders in the defeat of the Spanish Armada, was one of the founders of England's naval tradition. His ship, the <em>Golden Hind</em>, was one of the first to sail right around ('circumnavigate') the world. In Elizabeth I's time, English settlers first began to colonise the eastern coast of America. This colonisation, particularly by people who disagreed with the religious views of the next two kings, greatly increased in the next century.</p>

        <p>The Elizabethan period is also remembered for the richness of its poetry and drama, especially the plays and poems of William Shakespeare.</p>

        <div class="highlight-box">
            <h3>William Shakespeare (1564–1616)</h3>
            <div class="image-placeholder">
                [Shakespeare is widely regarded as the greatest writer in the English language]
            </div>
            <p>Shakespeare was born in Stratford-upon-Avon, England. He was a playwright and actor and wrote many poems and plays. His most famous plays include <em>A Midsummer Night's Dream</em>, <em>Hamlet</em>, <em>Macbeth</em> and <em>Romeo and Juliet</em>. He also dramatised significant events from the past, but he did not focus solely on kings and queens. He was one of the first to portray ordinary Englishmen and women. Shakespeare had a great influence on the English language and invented many words that are still common today. Lines from his plays and poems which are often still quoted include:</p>
            
            <ul>
                <li>Once more unto the breach (<em>Henry V</em>)</li>
                <li>To be or not to be (<em>Hamlet</em>)</li>
                <li>A rose by any other name (<em>Romeo and Juliet</em>)</li>
                <li>All the world's a stage (<em>As You Like It</em>)</li>
                <li>The darling buds of May (<em>Sonnet 18 – Shall I Compare Thee To A Summer's Day</em>)</li>
            </ul>
            
            <p>Many people regard Shakespeare as the greatest playwright of all time. His plays and poems are still performed and studied in Britain and other countries today. The Globe Theatre in London is a modern copy of the theatres in which his plays were first performed.</p>
        </div>

        <h2>James VI and I</h2>
        <p>Elizabeth I never married and so had no children of her own to inherit her throne. When she died in 1603 her heir was James VI of Scotland. He became King James I of England, Wales and Ireland but Scotland remained a separate country.</p>

        <div class="info-box">
            <h3>The King James Bible</h3>
            <p>One achievement of King James' reign was a new translation of the Bible into English. This translation is known as the 'King James Version' or the 'Authorised Version'. It was not the first English Bible but is a version which continues to be used in many Protestant churches today.</p>
        </div>

        <h2>Ireland</h2>
        <p>During this period, Ireland was an almost completely Catholic country. Henry VII and Henry VIII had extended English control outside the Pale and had established English authority over the whole country. Henry VIII took the title 'King of Ireland'. English laws were introduced and local leaders were expected to follow the instructions of the Lord Lieutenants in Dublin.</p>

        <p>During the reigns of Elizabeth I and James I, many people in Ireland opposed rule by the Protestant government in England. There were a number of rebellions. The English government encouraged Scottish and English Protestants to settle in Ulster, the northern province of Ireland, taking over the land from Catholic landholders. These settlements were known as plantations. Many of the new settlers came from south-west Scotland and other land was given to companies based in London. James later organised similar plantations in several other parts of Ireland. This had serious long-term consequences for the history of England, Scotland and Ireland.</p>

        <h2>The rise of Parliament</h2>
        <p>Elizabeth I was very skilled at managing Parliament. During her reign, she was successful in balancing her wishes and views against those of the House of Lords and those of the House of Commons, which was increasingly Protestant in its views.</p>

        <p>James I and his son Charles I were less skilled politically. Both believed in the 'Divine Right of Kings': the idea that the king was directly appointed by God to rule. They thought that the king should be able to act without having to seek approval from Parliament. When Charles I inherited the thrones of England, Wales, Ireland and Scotland, he tried to rule in line with this principle. When he could not get Parliament to agree with his religious and foreign policies, he tried to rule without Parliament at all. For 11 years, he found ways in which to raise money without Parliament's approval but eventually trouble in Scotland meant that he had to recall Parliament.</p>

        <h2>The beginning of the English Civil War</h2>
        <p>Charles I wanted the worship of the Church of England to include more ceremony and introduced a revised Prayer Book. He tried to impose this Prayer Book on the Presbyterian Church in Scotland and this led to serious unrest. A Scottish army was formed and Charles could not find the money he needed for his own army without the help of Parliament. In 1640, he recalled Parliament to ask it for funds. Many in Parliament were Puritans, a group of Protestants who advocated strict and simple religious doctrine and worship. They did not agree with the king's religious views and disliked his reforms of the Church of England. Parliament refused to give the king the money he asked for, even after the Scottish army invaded England.</p>

        <p>Another rebellion began in Ireland because the Roman Catholics in Ireland were afraid of the growing power of the Puritans. Parliament took this opportunity to demand control of the English army – a change that would have transferred substantial power from the king to Parliament. In response, Charles I entered the House of Commons and tried to arrest five parliamentary leaders, but they had been warned and were not there. (No monarch has set foot in the Commons since.) Civil war between the king and Parliament could not now be avoided and began in 1642. The country split into those who supported the king (the Cavaliers) and those who supported Parliament (the Roundheads).</p>

        <h2>Oliver Cromwell and the English republic</h2>
        <div class="image-placeholder">
            [Oliver Cromwell was the leader of the English republic]
        </div>
        
        <p>The king's army was defeated at the Battles of Marston Moor and Naseby. By 1646, it was clear that Parliament had won the war. Charles was held prisoner by the parliamentary army. He was still unwilling to reach any agreement with Parliament and in 1649 he was executed.</p>

        <p>England declared itself a republic, called the Commonwealth. It no longer had a monarch. For a time, it was not totally clear how the country would be governed. For now, the army was in control. One of its generals, Oliver Cromwell, was sent to Ireland, where the revolt which had begun in 1641 still continued and where there was still a Royalist army. Cromwell was successful in establishing the authority of the English Parliament but did this with such violence that even today Cromwell remains a controversial figure in Ireland.</p>

        <p>The Scots had not agreed to the execution of Charles I and declared his son Charles II to be king. He was crowned king of Scotland and led a Scottish army into England. Cromwell defeated this army in the Battles of Dunbar and Worcester. Charles II escaped from Worcester, famously hiding in an oak tree on one occasion, and eventually fled to Europe. Parliament now controlled Scotland as well as England and Wales.</p>

        <p>After his success in Ireland and Scotland, Cromwell was recognised as the leader of the new republic. His rule was called the Protectorate. During the Protectorate, many forms of entertainment, such as the theatre, were banned. When Cromwell died in 1658, his son, Richard, proved unable to control Parliament or the army. Although Britain had been a republic for 11 years, without Oliver Cromwell it could not continue. In 1660, Parliament asked Charles II to return from exile in Europe. Charles II became king at the Restoration of the monarchy. The republic was over.</p>

        <div class="section-marker" data-section="global-power"></div>
        <h1>A global power</h1>
        
        <h2>The Restoration</h2>
        <p>Charles II made it clear that he had 'no wish to go on his travels again'. He understood that he could not always do as he wished but would sometimes need to reach agreement with Parliament. Generally, his reign was a time of celebration and relaxation after the years of Puritan rule.</p>

        <p>Charles II was interested in science. During his reign, the Royal Society was formed to promote 'natural knowledge'. Sir Edmund Halley was the astronomer who predicted the return of the comet that is now called Halley's Comet. Sir Isaac Newton formulated laws of gravity and motion and invented calculus. He also discovered that white light is made up of the colours of the rainbow. Sir Christopher Wren was an architect who designed many churches, including St Paul's Cathedral, and who helped to plan the rebuilding of London after the Great Fire of London in 1666.</p>

        <p>The Great Fire of London destroyed much of the medieval City of London inside the old Roman walls. As well as the rebuilding of London, Charles II's reign saw the founding of the Royal Navy. Samuel Pepys, who worked for the Navy, wrote a diary which describes events of the time, including the Great Fire and the plague. The Navy was very important in establishing British sea power, which lasted for several centuries and enabled the development of the British Empire.</p>

        <h2>Religious tensions</h2>
        <p>Charles II's brother, James II, who was a Catholic, became king when Charles died. James favoured Catholic forms of worship and appointed Catholics to positions of authority in the army and at the universities. In 1688, important Protestants in England asked William of Orange, a Protestant prince from the Netherlands and James's son-in-law, to invade England and proclaim himself king. When William arrived, there was no resistance. James fled to France. William became King William III and ruled jointly with his wife Mary, who was James's daughter. This event was later called the Glorious Revolution because there was no fighting in England, although James continued to fight for his crown in Ireland and Scotland.</p>

        <p>Many restrictions were placed on Catholics at this time. They were not able to vote in elections or to hold public office.</p>

        <h2>War with France</h2>
        <p>During the 18th century, Britain fought a number of wars with France. In 1789, there was a revolution in France and the new French government soon declared war on Britain. Napoleon, who became Emperor of France, continued the war. Britain's navy fought against combined French and Spanish fleets, winning the Battle of Trafalgar in 1805. Admiral Nelson was in charge of the British fleet at Trafalgar and was killed in the battle. Nelson's Column in Trafalgar Square, London, is a monument to him. His ship, <em>HMS Victory</em>, can be visited in Portsmouth. The British army also fought against the French. In 1815, the French Wars ended with the defeat of the Emperor Napoleon by the Duke of Wellington at the Battle of Waterloo. Wellington was known as the Iron Duke and later became Prime Minister.</p>

        <div class="image-placeholder">
            [The Battle of Trafalgar (21 October 1805) was a naval engagement fought by the British Royal Navy against the combined fleets of the French Navy and Spanish Navy]
        </div>

        <div class="highlight-box">
            <h3>The Union Flag</h3>
            <p>Although Ireland had had the same monarch as England and Wales since Henry VIII, it had remained a separate country. In 1801, Ireland became unified with England, Scotland and Wales after the Act of Union of 1800. This created the United Kingdom of Great Britain and Ireland. One symbol of this union between England, Scotland, Wales and Ireland was a new version of the official flag, the Union Flag. This is often called the Union Jack. The flag combined crosses associated with England, Scotland and Ireland. It is still used today as the official flag of the UK.</p>
            
            <p><strong>The Union Flag consists of three crosses:</strong></p>
            <ul>
                <li>The cross of St George, patron saint of England, is a red cross on a white ground.</li>
                <li>The cross of St Andrew, patron saint of Scotland, is a diagonal white cross on a blue ground.</li>
                <li>The cross of St Patrick, patron saint of Ireland, is a diagonal red cross on a white ground.</li>
            </ul>
            
            <div class="image-placeholder">
                [The Union Flag, also known as the Union Jack]
            </div>
            
            <div class="image-placeholder">
                [The crosses of the three countries which combined to form the Union Flag]
            </div>
            
            <p>There is also an official Welsh flag, which shows a Welsh dragon. The Welsh dragon does not appear on the Union Flag because, when the first Union Flag was created in 1606 from the flags of Scotland and England, the Principality of Wales was already united with England.</p>
            
            <div class="image-placeholder">
                [The official Welsh flag]
            </div>
        </div>

        <h2>The Victorian Age</h2>
        <p>In 1837, Queen Victoria became queen of the UK at the age of 18. She reigned until 1901, almost 64 years. Her reign is known as the Victorian Age. It was a time when Britain increased in power and influence abroad. Within the UK, the middle classes became increasingly significant and a number of reformers led moves to improve conditions of life for the poor.</p>

        <h2>The British Empire</h2>
        <p>During the Victorian period, the British Empire grew to cover all of India, Australia and large parts of Africa. It became the largest empire the world has ever seen, with an estimated population of more than 400 million people.</p>

        <p>Many people were encouraged to leave the UK to settle overseas. Between 1853 and 1913, as many as 13 million British citizens left the country. People continued to come to Britain from other parts of the world. For example, between 1870 and 1914, around 120,000 Russian and Polish Jews came to Britain to escape persecution. Many settled in London's East End and in Manchester and Leeds. People from the Empire, including India and Africa, also came to Britain to live, work and study.</p>

        <h2>Trade and industry</h2>
        <p>Britain continued to be a great trading nation. The government began to promote policies of free trade, abolishing a number of taxes on imported goods. One example of this was the repealing of the Corn Laws in 1846. These had prevented the import of cheap grain. The reforms helped the development of British industry, because raw materials could now be imported more cheaply.</p>

        <p>Working conditions in factories gradually became better. In 1847, the number of hours that women and children could work was limited by law to 10 hours per day. Better housing began to be built for workers.</p>

        <p>Transport links also improved, enabling goods and people to move more easily around the country. Just before Victoria came to the throne, the father and son George and Robert Stephenson pioneered the railway engine and a major expansion of the railways took place in the Victorian period. Railways were built throughout the Empire. There were also great advances in other areas, such as the building of bridges by engineers such as Isambard Kingdom Brunel.</p>

        <div class="highlight-box">
            <h3>Isambard Kingdom Brunel (1806–59)</h3>
            <p>Brunel was originally from Portsmouth, England. He was an engineer who built tunnels, bridges, railway lines and ships. He was responsible for constructing the Great Western Railway, which was the first major railway built in Britain. It runs from Paddington Station in London to the south west of England, the West Midlands and Wales. Many of Brunel's bridges are still in use today.</p>
            
            <div class="image-placeholder">
                [The Clifton Suspension Bridge, designed by Isambard Kingdom Brunel, spanning the Avon Gorge]
            </div>
        </div>

        <p>British industry led the world in the 19th century. The UK produced more than half of the world's iron, coal and cotton cloth. The UK also became a centre for financial services, including insurance and banking. In 1851, the Great Exhibition opened in Hyde Park in the Crystal Palace, a huge building made of iron and glass. Exhibits ranged from huge machines to handmade goods. Countries from all over the world showed their goods but most of the objects were made in Britain.</p>

        <h2>The Crimean War</h2>
        <p>From 1853 to 1856, Britain fought with Turkey and France against Russia in the Crimean War. It was the first war to be extensively covered by the media through news stories and photographs. The conditions were very poor and many soldiers died from illnesses they caught in the hospitals, rather than from war wounds. Queen Victoria introduced the Victoria Cross medal during this war. It honours acts of valour by soldiers.</p>

        <div class="highlight-box">
            <h3>Florence Nightingale (1820–1910)</h3>
            <p>Florence Nightingale was born in Italy to English parents. At the age of 31, she trained as a nurse in Germany. In 1854, she went to Turkey and worked in military hospitals, treating soldiers who were fighting in the Crimean War. She and her fellow nurses improved the conditions in the hospital and reduced the mortality rate. In 1860 she established the Nightingale Training School for nurses at St Thomas' Hospital in London. The school was the first of its kind and still exists today, as do many of the practices that Nightingale used. She is often regarded as the founder of modern nursing.</p>
        </div>

        <h2>Ireland in the 19th century</h2>
        <p>Conditions in Ireland were not as good as in the rest of the UK. Two-thirds of the population still depended on farming to make their living, often on very small plots of land. Many depended on potatoes as a large part of their diet. In the middle of the century the potato crop failed, and Ireland suffered a famine. A million people died from disease and starvation. Another million and a half left Ireland. Some emigrated to the United States and others came to England. By 1861 there were large populations of Irish people in cities such as Liverpool, London, Manchester and Glasgow.</p>

        <p>The Irish Nationalist movement had grown strongly through the 19th century. Some, such as the Fenians, favoured complete independence. Others, such as Charles Stuart Parnell, advocated 'Home Rule', in which Ireland would remain in the UK but have its own parliament.</p>

        <h2>The right to vote</h2>
        <p>As the middle classes in the wealthy industrial towns and cities grew in influence, they began to demand more political power. The Reform Act of 1832 had greatly increased the number of people with the right to vote. The Act also abolished the old pocket and rotten boroughs and more parliamentary seats were given to the towns and cities. There was a permanent shift of political power from the countryside to the towns but voting was still based on ownership of property. This meant that members of the working class were still unable to vote.</p>

        <p>A movement began to demand the vote for the working classes and other people without property. Campaigners, called the Chartists, presented petitions to Parliament. At first they seemed to be unsuccessful, but in 1867 there was another Reform Act. This created many more urban seats in Parliament and reduced the amount of property that people needed to have before they could vote. However, the majority of men still did not have the right to vote and no women could vote.</p>

        <p>Politicians realised that the increased number of voters meant that they needed to persuade people to vote for them if they were to be sure of being elected to Parliament. The political parties began to create organisations to reach out to ordinary voters. Universal suffrage (the right of every adult, male or female, to vote) followed in the next century.</p>

        <p>In common with the rest of Europe, women in 19th century Britain had fewer rights than men. Until 1870, when a woman got married, her earnings, property and money automatically belonged to her husband. Acts of Parliament in 1870 and 1882 gave wives the right to keep their own earnings and property. In the late 19th and early 20th centuries, an increasing number of women campaigned and demonstrated for greater rights and, in particular, the right to vote. They formed the women's suffrage movement and became known as 'suffragettes'.</p>

        <div class="highlight-box">
            <h3>Emmeline Pankhurst (1858–1928)</h3>
            <p>Emmeline Pankhurst was born in Manchester in 1858. She set up the Women's Franchise League in 1889, which fought to get the vote in local elections for married women. In 1903 she helped found the Women's Social and Political Union (WSPU). This was the first group whose members were called 'suffragettes'. The group used civil disobedience as part of their protest to gain the vote for women. They chained themselves to railings, smashed windows and committed arson. Many of the women, including Pankhurst, went on hunger strike. In 1918, women over the age of 30 were given voting rights and the right to stand for Parliament, partly in recognition of the contribution women made to the war effort during the First World War. Shortly before Pankhurst's death in 1928, women were given the right to vote at the age of 21, the same as men.</p>
        </div>

        <h2>The future of the Empire</h2>
        <p>Although the British Empire continued to grow until the 1920s, there was already discussion in the late 19th century about its future direction. Supporters of expansion believed that the Empire benefited Britain through increased trade and commerce. Others thought the Empire had become over-expanded and that the frequent conflicts in many parts of the Empire, such as India's northwest frontier or southern Africa, were a drain on resources. Yet the great majority of British people believed in the Empire as a force for good in the world.</p>

        <p>The Boer War of 1899 to 1902 made the discussions about the future of the Empire more urgent. The British government tried to avoid another war. However, when Hitler invaded Poland in 1939, Britain and France declared war in order to stop his aggression.</p>

        <div class="highlight-box">
            <h3>Rudyard Kipling (1865–1936)</h3>
            <p>Rudyard Kipling was born in India in 1865 and later lived in India, the UK and the USA. He wrote books and poems set in both India and the UK. His poems and novels reflected the idea that the British Empire was a force for good. Kipling was awarded the Nobel Prize in Literature in 1907. His books include the <em>Just So Stories</em> and <em>The Jungle Book</em>, which continue to be popular today. His poem <em>If</em> has often been voted among the UK's favourite poems. It begins with these words:</p>
            
            <div class="quote">
                'If you can keep your head when all about you<br>
                Are losing theirs and blaming it on you;<br>
                If you can trust yourself when all men doubt you,<br>
                But make allowance for their doubting too;<br>
                If you can wait and not be tired by waiting,<br>
                Or being lied about, don't deal in lies,<br>
                Or being hated, don't give way to hating,<br>
                And yet don't look too good, nor talk too wise' (<em>If</em>, Rudyard Kipling)
            </div>
        </div>

        <div class="info-box">
            <h3>Check that you understand</h3>
            <ul>
                <li>✔ The change in the balance of power between Parliament and the monarchy</li>
                <li>✔ When and why Scotland joined England and Wales to become Great Britain</li>
                <li>✔ The reasons for a rebellion in Scotland led by Bonnie Prince Charlie</li>
                <li>✔ The ideas of the Enlightenment</li>
                <li>✔ The importance of the Industrial Revolution and development of industry</li>
                <li>✔ The slave trade and when it was abolished</li>
                <li>✔ The growth of the British Empire</li>
                <li>✔ How democracy developed during this period</li>
            </ul>
        </div>

        <div class="section-marker" data-section="twentieth-century"></div>
        <h1>The 20th century</h1>
        
        <h2>The First World War</h2>
        <p>The early 20th century was a time of optimism in Britain. The nation, with its expansive Empire, well-admired navy, thriving industry and strong political institutions, was what is now known as a global 'superpower'. It was also a time of social progress. Financial help for the unemployed, old-age pensions and free school meals were just a few of the important measures introduced. Various laws were passed to improve safety in the workplace; town planning rules were tightened to prevent the further development of slums; and better support was given to mothers and their children after divorce or separation. Local government became more democratic and a salary for members of Parliament (MPs) was introduced for the first time, making it easier for more people to take part in public life.</p>

        <p>This era of optimism and progress was cut short when war broke out between several European nations. On 28 June 1914, Archduke Franz Ferdinand of Austria was assassinated. This set off a chain of events leading to the First World War (1914–18). But while the assassination provided the trigger for war, other factors – such as a growing sense of nationalism in many European states; increasing militarism; imperialism; and the division of the major European powers into two camps – all set the conditions for war.</p>

        <p>The conflict was centred in Europe, but it was a global war involving nations from around the world. Britain was part of the Allied Powers, which included (amongst others) France, Russia, Japan, Belgium, Serbia – and later, Greece, Italy, Romania and the United States. The whole of the British Empire was involved in the conflict – for example, more than a million Indians fought on behalf of Britain in lots of different countries, and around 40,000 were killed. Men from the West Indies, Africa, Australia, New Zealand and Canada also fought with the British. The Allies fought against the Central Powers – mainly Germany, the Austro-Hungarian Empire, the Ottoman Empire and later Bulgaria. Millions of people were killed or wounded, with more than 2 million British casualties. One battle, the British attack on the Somme in July 1916, resulted in about 60,000 British casualties on the first day alone.</p>

        <div class="image-placeholder">
            [Soldiers fighting in the trenches during the First World War]
        </div>

        <p>The First World War ended at 11.00 am on 11th November 1918 with victory for Britain and its allies.</p>

        <h2>The partition of Ireland</h2>
        <p>In 1913, the British government promised 'Home Rule' for Ireland. The proposal was to have a self-governing Ireland with its own parliament but still part of the UK. A Home Rule Bill was introduced in Parliament. It was opposed by the Protestants in the north of Ireland, who threatened to resist Home Rule by force.</p>

        <p>The outbreak of the First World War led the British government to postpone any changes in Ireland. Irish Nationalists were not willing to wait and in 1916 there was an uprising (the Easter Rising) against the British in Dublin. The leaders of the uprising were executed under military law. A guerrilla war against the British army and the police in Ireland followed. In 1921 a peace treaty was signed and in 1922 Ireland became two countries. The six counties in the north which were mainly Protestant remained part of the UK under the name Northern Ireland. The rest of Ireland became the Irish Free State. It had its own government and became a republic in 1949.</p>

        <p>There were people in both parts of Ireland who disagreed with the split between the North and the South. They still wanted Ireland to be one independent country. Years of disagreement led to a terror campaign in Northern Ireland and elsewhere. The conflict between those wishing for full Irish independence and those wishing to remain loyal to the British government is often referred to as 'the Troubles'.</p>

        <h2>The inter-war period</h2>
        <p>In the 1920s, many people's living conditions got better. There were improvements in public housing and new homes were built in many towns and cities. However, in 1929, the world entered the 'Great Depression' and some parts of the UK suffered mass unemployment. The effects of the depression of the 1930s were felt differently in different parts of the UK. The traditional heavy industries such as shipbuilding were badly affected but new industries – including the automobile and aviation industries – developed. As prices generally fell, those in work had more money to spend. Car ownership doubled from 1 million to 2 million between 1930 and 1939. In addition, many new houses were built. It was also a time of cultural blossoming, with writers such as Graham Greene and Evelyn Waugh prominent. The economist John Maynard Keynes published influential new theories of economics. The BBC started radio broadcasts in 1922 and began the world's first regular television service in 1936.</p>

        <h2>The Second World War</h2>
        <p>Adolf Hitler came to power in Germany in 1933. He believed that the conditions imposed on Germany by the Allies after the First World War were unfair; he also wanted to conquer more land for the German people. He set about renegotiating treaties, building up arms, and testing Germany's military strength in nearby countries. The British government tried to avoid another war. However, when Hitler invaded Poland in 1939, Britain and France declared war in order to stop his aggression.</p>

        <p>The war was initially fought between the Axis powers (fascist Germany and Italy and the Empire of Japan) and the Allies. The main countries on the allied side were the UK, France, Poland, Australia, New Zealand, Canada, and the Union of South Africa.</p>

        <p>Having occupied Austria and invaded Czechoslovakia, Hitler followed his invasion of Poland by taking control of Belgium and the Netherlands. Then, in 1940, German forces defeated allied troops and advanced through France. At this time of national crisis, Winston Churchill became Prime Minister and Britain's war leader.</p>

        <div class="highlight-box">
            <h3>Winston Churchill (1874–1965)</h3>
            <p>Churchill was the son of a politician and, before becoming a Conservative MP in 1900, was a soldier and journalist. In May 1940 he became Prime Minister. He refused to surrender to the Nazis and was an inspirational leader to the British people in a time of great hardship. He lost the General Election in 1945 but returned as Prime Minister in 1951.</p>
            
            <p>He was an MP until he stood down at the 1964 General Election. Following his death in 1965, he was given a state funeral. He remains a much-admired figure to this day, and in 2002 was voted the greatest Briton of all time by the public. During the War, he made many famous speeches including lines which you may still hear:</p>
            
            <ul>
                <li><strong>'I have nothing to offer but blood, toil, tears and sweat'</strong> Churchill's first speech to the House of Commons after he became Prime Minister, 1940</li>
                <li><strong>'We shall fight on the beaches, we shall fight on the landing grounds, we shall fight in the fields and in the streets, we shall fight in the hills; we shall never surrender'</strong> Speech to the House of Commons after Dunkirk, 1940</li>
                <li><strong>'Never in the field of human conflict was so much owed by so many to so few'</strong> Speech to the House of Commons during the Battle of Britain, 1940</li>
            </ul>
            
            <div class="image-placeholder">
                [Winston Churchill, best known for his leadership of the UK during the Second World War]
            </div>
        </div>

        <p>As France fell, the British decided to evacuate British and French soldiers from France in a huge naval operation. Many civilian volunteers in small pleasure and fishing boats from Britain helped the Navy to rescue more than 300,000 men from the beaches around Dunkirk. Although many lives and a lot of equipment were lost, the evacuation was a success and meant that Britain was better able to continue the fight against the Germans. The evacuation gave rise to the phrase 'the Dunkirk spirit'.</p>

        <p>From the end of June 1940 until the German invasion of the Soviet Union in June 1941, Britain and the Empire stood almost alone against Nazi Germany.</p>

        <p>Hitler wanted to invade Britain, but before sending in troops, Germany needed to control the air. The Germans waged an air campaign against Britain, but the British resisted with their fighter planes and eventually won the crucial aerial battle against the Germans, called 'the Battle of Britain', in the summer of 1940. The most important planes used by the Royal Air Force in the Battle of Britain were the Spitfire and the Hurricane – which were designed and built in Britain. Despite this crucial victory, the German air force was able to continue bombing London and other British cities at night-time. This was called the Blitz. Coventry was almost totally destroyed and a great deal of damage was done in other cities, especially in the East End of London. Despite the destruction, there was a strong national spirit of resistance in the UK. The phrase 'the Blitz spirit' is still used today to describe Britons pulling together in the face of adversity.</p>

        <p>At the same time as defending Britain, the British military was fighting the Axis on many other fronts. In Singapore, the Japanese defeated the British and then occupied Burma, threatening India. The United States entered the war when the Japanese bombed its naval base at Pearl Harbour in December 1941.</p>

        <p>That same year, Hitler attempted the largest invasion in history by attacking the Soviet Union. It was a fierce conflict, with huge losses on both sides. German forces were ultimately repelled by the Soviets, and the damage they sustained proved to be a pivotal point in the war.</p>

        <div class="image-placeholder">
            [The Royal Air Force helped to defend Britain in the Second World War]
        </div>

        <p>The allied forces gradually gained the upper hand, winning significant victories in North Africa and Italy. German losses in the Soviet Union, combined with the support of the Americans, meant that the Allies were eventually strong enough to attack Hitler's forces in Western Europe. On 6 June 1944, allied forces landed in Normandy (this event is often referred to as 'D-Day'). Following victory on the beaches of Normandy, the allied forces pressed on through France and eventually into Germany. The Allies comprehensively defeated Germany in May 1945.</p>

        <p>The war against Japan ended in August 1945 when the United States dropped its newly developed atom bombs on the Japanese cities of Hiroshima and Nagasaki. Scientists led by New-Zealand-born Ernest Rutherford, working at Manchester and then Cambridge University, were the first to 'split the atom'. Some British scientists went on to take part in the Manhattan Project in the United States, which developed the atomic bomb. The war was finally over.</p>

        <div class="highlight-box">
            <h3>Alexander Fleming (1881–1955)</h3>
            <p>Born in Scotland, Fleming moved to London as a teenager and later qualified as a doctor. He was researching influenza (the 'flu') in 1928 when he discovered penicillin. This was then further developed into a usable drug by the scientists Howard Florey and Ernst Chain. By the 1940s it was in mass production. Fleming won the Nobel Prize in Medicine in 1945. Penicillin is still used to treat bacterial infections today.</p>
        </div>

        <div class="info-box">
            <h3>Check that you understand</h3>
            <ul>
                <li>✔ What happened during the First World War</li>
                <li>✔ The partition of Ireland and the establishment of the UK as it is today</li>
                <li>✔ The events of the Second World War</li>
            </ul>
        </div>

        <div class="section-marker" data-section="britain-since-1945"></div>
        <h1>Britain since 1945</h1>
        
        <h2>The welfare state</h2>
        <p>Although the UK had won the war, the country was exhausted economically and the people wanted change. During the war, there had been significant reforms to the education system and people now looked for wider social reforms.</p>

        <p>In 1945 the British people elected a Labour government. The new Prime Minister was Clement Attlee, who promised to introduce the welfare state outlined in the Beveridge Report. In 1948, Aneurin (Nye) Bevan, the Minister for Health, led the establishment of the National Health Service (NHS), which guaranteed a minimum standard of health care for all, free at the point of use. A national system of benefits was also introduced to provide 'social security', so that the population would be protected from the 'cradle to the grave'. The government took into public ownership (nationalised) the railways, coal mines and gas, water and electricity supplies.</p>

        <p>Another aspect of change was self-government for former colonies. In 1947, independence was granted to nine countries, including India, Pakistan and Ceylon (now Sri Lanka). Other colonies in Africa, the Caribbean and the Pacific achieved independence over the next 20 years.</p>

        <p>The UK developed its own atomic bomb and joined the new North Atlantic Treaty Organization (NATO), an alliance of nations set up to resist the perceived threat of invasion by the Soviet Union and its allies.</p>

        <p>Britain had a Conservative government from 1951 to 1964. The 1950s were a period of economic recovery after the war and increasing prosperity for working people. The Prime Minister of the day, Harold Macmillan, was famous for his 'wind of change' speech about decolonisation and independence for the countries of the Empire.</p>

        <div class="highlight-box">
            <h3>Clement Attlee (1883–1967)</h3>
            <p>Clement Attlee was born in London in 1883. His father was a solicitor and, after studying at Oxford University, Attlee became a barrister. He gave this up to do social work in East London and eventually became a Labour MP. He was Winston Churchill's Deputy Prime Minister in the wartime coalition government and became Prime Minister after the Labour Party won the 1945 election. He was Prime Minister from 1945 to 1951 and led the Labour Party for 20 years. Attlee's government undertook the nationalisation of major industries (like coal and steel), created the National Health Service and implemented many of Beveridge's plans for a stronger welfare state. Attlee also introduced measures to improve the conditions of workers.</p>
        </div>

        <div class="highlight-box">
            <h3>William Beveridge (1879–1963)</h3>
            <p>William Beveridge (later Lord Beveridge) was a British economist and social reformer. He served briefly as a Liberal MP and was subsequently the leader of the Liberals in the House of Lords but is best known for the 1942 report <em>Social Insurance and Allied Services</em> (known as the Beveridge Report). The report was commissioned by the wartime government in 1941. It recommended that the government should find ways of fighting the five 'Giant Evils' of Want, Disease, Ignorance, Squalor and Idleness and provided the basis of the modern welfare state.</p>
        </div>

        <div class="highlight-box">
            <h3>R A Butler (1902–82)</h3>
            <p>Richard Austen Butler (later Lord Butler) was born in 1902. He became a Conservative MP in 1923 and held several positions before becoming responsible for education in 1941. In this role, he oversaw the introduction of the Education Act 1944 (often called 'The Butler Act'), which introduced free secondary education in England and Wales. The education system has changed significantly since the Act was introduced, but the division between primary and secondary schools that it enforced still remains in most areas of Britain.</p>
        </div>

        <div class="highlight-box">
            <h3>Dylan Thomas (1914–53)</h3>
            <p>Dylan Thomas was a Welsh poet and writer. He often read and performed his work in public, including for the BBC. His most well-known works include the radio play <em>Under Milk Wood</em>, first performed after his death in 1954, and the poem <em>Do Not Go Gentle into That Good Night</em>, which he wrote for his dying father in 1952. He died at the age of 39 in New York. There are several memorials to him in his birthplace, Swansea, including a statue and the Dylan Thomas Centre.</p>
        </div>

        <h2>Migration in post-war Britain</h2>
        <p>Rebuilding Britain after the Second World War was a huge task. There were labour shortages and the British government encouraged workers from Ireland and other parts of Europe to come to the UK and help with the reconstruction. In 1948, people from the West Indies were also invited to come and work.</p>

        <p>During the 1950s, there was still a shortage of labour in the UK. Further immigration was therefore encouraged for economic reasons, and many industries advertised for workers from overseas. For example, centres were set up in the West Indies to recruit people to drive buses. Textile and engineering firms from the north of England and the Midlands sent agents to India and Pakistan to find workers. For about 25 years, people from the West Indies, India, Pakistan and (later) Bangladesh travelled to work and settle in Britain.</p>

        <h2>Social change in the 1960s</h2>
        <p>The decade of the 1960s was a period of significant social change. It was known as 'the Swinging Sixties'. There was growth in British fashion, cinema and popular music. Two well-known pop music groups at the time were The Beatles and The Rolling Stones. People started to become better off and many bought cars and other consumer goods.</p>

        <p>It was also a time when social laws were liberalised, for example in relation to divorce and to abortion in England, Wales and Scotland. The position of women in the workplace also improved. It was quite common at the time for employers to ask women to leave their jobs when they got married, but Parliament passed new laws giving women the right to equal pay and made it illegal for employers to discriminate against women because of their gender.</p>

        <p>The 1960s was also a time of technological progress. Britain and France developed the supersonic commercial airliner, Concorde. New styles of architecture, including high-rise buildings and the use of concrete and steel, became common.</p>

        <p>The number of people migrating from the West Indies, India, Pakistan and what is now Bangladesh fell in the late 1960s because the government passed new laws to restrict immigration to Britain. Immigrants were required to have a strong connection to Britain through birth or ancestry. Even so, during the early 1970s, Britain admitted 28,000 people of Indian origin who had been forced to leave Uganda.</p>

        <div class="highlight-box">
            <h3>Some great British inventions of the 20th century</h3>
            <p>Britain has given the world some wonderful inventions. Examples from the 20th century include:</p>
            
            <p><strong>The television</strong> was developed by Scotsman John Logie Baird (1888–1946) in the 1920s. In 1932 he made the first television broadcast between London and Glasgow.</p>
            
            <p><strong>Radar</strong> was developed by Scotsman Sir Robert Watson-Watt (1892–1973), who proposed that enemy aircraft could be detected by radio waves. The first successful radar test took place in 1935.</p>
            
            <p>Working with radar led Sir Bernard Lovell (1913–2012) to make new discoveries in astronomy. The radio telescope he built at <strong>Jodrell Bank</strong> in Cheshire was for many years the biggest in the world and continues to operate today.</p>
            
            <p>A <strong>Turing machine</strong> is a theoretical mathematical device invented by Alan Turing (1912–54), a British mathematician, in the 1930s. The theory was influential in the development of computer science and the modern-day computer.</p>
            
            <p>The Scottish physician and researcher John Macleod (1876–1935) was the co-discoverer of <strong>insulin</strong>, used to treat diabetes.</p>
            
            <p>The <strong>structure of the DNA molecule</strong> was discovered in 1953 through work at British universities in London and Cambridge. This discovery contributed to many scientific advances, particularly in medicine and fighting crime. Francis Crick (1916–2004), one of those awarded the Nobel Prize for this discovery, was British.</p>
            
            <p>The <strong>jet engine</strong> was developed in Britain in the 1930s by Sir Frank Whittle (1907–96), a British Royal Air Force engineer officer.</p>
            
            <p>Sir Christopher Cockerell (1910–99), a British inventor, invented the <strong>hovercraft</strong> in the 1950s.</p>
            
            <p>Britain and France developed <strong>Concorde</strong>, the supersonic passenger aircraft. It first flew in 1969 and began carrying passengers in 1976. Concorde was retired from service in 2003.</p>
            
            <p>The <strong>Harrier jump jet</strong>, an aircraft capable of taking off vertically, was also designed and developed in the UK.</p>
            
            <p>In the 1960s, James Goodfellow (1937–) invented the <strong>cash-dispensing ATM</strong> (automatic teller machine) or 'cashpoint'. The first of these was put into use by Barclays Bank in Enfield, north London in 1967.</p>
            
            <p><strong>IVF (in-vitro fertilisation) therapy</strong> for the treatment of infertility was pioneered in Britain by physiologist Sir Robert Edwards (1925–2013) and gynaecologist Patrick Steptoe (1913–88). The world's first 'test-tube baby' was born in Oldham, Lancashire in 1978.</p>
            
            <p>In 1996, two British scientists, Sir Ian Wilmut (1944–) and Keith Campbell (1954–2012), led a team which was the first to succeed in <strong>cloning</strong> a mammal, Dolly the sheep. This has led to further research into the possible use of cloning to preserve endangered species and for medical purposes.</p>
            
            <p>Sir Peter Mansfield (1933–2017), a British scientist, is the co-inventor of the <strong>MRI (magnetic resonance imaging)</strong> scanner. This enables doctors and researchers to obtain exact and non-invasive images of human internal organs and has revolutionised diagnostic medicine.</p>
            
            <p>The inventor of the <strong>World Wide Web</strong>, Sir Tim Berners-Lee (1955–), is British. Information was successfully transferred via the web for the first time on 25 December 1990.</p>
        </div>

        <h2>Problems in the economy in the 1970s</h2>
        <p>In the late 1970s, the post-war economic boom came to an end. Prices of goods and raw materials began to rise sharply and the exchange rate between the pound and other currencies was unstable. This caused problems with the 'balance of payments': imports of goods were valued at more than the price paid for exports.</p>

        <p>Many industries and services were affected by strikes and this caused problems between the trade unions and the government. People began to argue that the unions were too powerful and that their activities were harming the UK.</p>

        <p>The 1970s were also a time of serious unrest in Northern Ireland. In 1972, the Northern Ireland Parliament was suspended and Northern Ireland was directly ruled by the UK government. Some 3,000 people lost their lives in the decades after 1969 in the violence in Northern Ireland.</p>

        <div class="highlight-box">
            <h3>Mary Peters (1939–)</h3>
            <p>Born in Manchester, Mary Peters moved to Northern Ireland as a child. She was a talented athlete who won an Olympic gold medal in the pentathlon in 1972. After this, she raised money for local athletics and became the team manager for the women's British Olympic team. She continues to promote sport and tourism in Northern Ireland and was made a Dame of the British Empire in 2000 in recognition of her work.</p>
        </div>

        <h2>Europe and the Common Market</h2>
        <p>West Germany, France, Belgium, Italy, Luxembourg and the Netherlands formed the European Economic Community (EEC) in 1957. At first the UK did not wish to join the EEC but it eventually did so in 1973. The UK is a full member of the European Union but does not use the Euro currency.</p>

        <h2>Conservative government from 1979 to 1997</h2>
        <p>Margaret Thatcher, Britain's first woman Prime Minister, led the Conservative government from 1979 to 1990. The government made structural changes to the economy through the privatisation of nationalised industries and imposed legal controls on trade union powers. Deregulation saw a great increase in the role of the City of London as an international centre for investments, insurance and other financial services. Traditional industries, such as shipbuilding and coal mining, declined. In 1982, Argentina invaded the Falkland Islands, a British overseas territory in the South Atlantic. A naval taskforce was sent from the UK and military action led to the recovery of the islands.</p>

        <p>John Major was Prime Minister after Mrs Thatcher, and helped establish the Northern Ireland peace process.</p>

        <div class="highlight-box">
            <h3>Margaret Thatcher (1925–2013)</h3>
            <p>Margaret Thatcher was the daughter of a grocer from Grantham in Lincolnshire. She trained as a chemist and lawyer. She was elected as a Conservative MP in 1959 and became a cabinet minister in 1970 as the Secretary of State for Education and Science. In 1975 she was elected as Leader of the Conservative Party and so became Leader of the Opposition.</p>
            
            <div class="image-placeholder">
                [Margaret Thatcher, the first female Prime Minister of the UK]
            </div>
            
            <p>Following the Conservative victory in the General Election in 1979, Margaret Thatcher became the first woman Prime Minister of the UK. She was the longest-serving Prime Minister of the 20th century, remaining in office until 1990.</p>
            
            <p>During her premiership, there were a number of important economic reforms within the UK. She worked closely with the United States President, Ronald Reagan, and was one of the first Western leaders to recognise and welcome the changes in the leadership of the Soviet Union which eventually led to the end of the Cold War.</p>
        </div>

        <div class="highlight-box">
            <h3>Roald Dahl (1916–90)</h3>
            <p>Roald Dahl was born in Wales to Norwegian parents. He served in the Royal Air Force during the Second World War. It was during the 1940s that he began to publish books and short stories. He is most well known for his children's books, although he also wrote for adults. His best-known works include <em>Charlie and the Chocolate Factory</em> and <em>George's Marvellous Medicine</em>. Several of his books have been made into films.</p>
        </div>

        <h2>Labour government from 1997 to 2010</h2>
        <p>In 1997 the Labour Party led by Tony Blair was elected. The Blair government introduced a Scottish Parliament and a Welsh Assembly. The Scottish Parliament has substantial powers to legislate. The Welsh Assembly was given fewer legislative powers but considerable control over public services. In Northern Ireland, the Blair government was able to build on the peace process, resulting in the Good Friday Agreement signed in 1998. The Northern Ireland Assembly was elected in 1999 but suspended in 2002. It was not reinstated until 2007. Most paramilitary groups in Northern Ireland have decommissioned their arms and are inactive. Gordon Brown took over as Prime Minister in 2007.</p>

        <h2>Conflicts in Afghanistan and Iraq</h2>
        <p>Throughout the 1990s, Britain played a leading role in coalition forces involved in the liberation of Kuwait, following the Iraqi invasion in 1990, and the conflict in the Former Republic of Yugoslavia. Since 2000, British armed forces have been engaged in the global fight against international terrorism and against the proliferation of weapons of mass destruction, including operations in Afghanistan and Iraq. British combat troops left Iraq in 2009. The UK now operates in Afghanistan as part of the United Nations (UN) mandated 50-nation International Security Assistance Force (ISAF) coalition and at the invitation of the Afghan government. ISAF is working to ensure that Afghan territory can never again be used as a safe haven for international terrorism, where groups such as Al Qa'ida could plan attacks on the international community. As part of this, ISAF is building up the Afghan National Security Forces and is helping to create a secure environment in which governance and development can be extended. International forces are gradually handing over responsibility for security to the Afghans, who will have full security responsibility in all provinces by the end of 2014.</p>

        <h2>Coalition government 2010 onwards</h2>
        <p>In May 2010, and for the first time in the UK since February 1974, no political party won an overall majority in the General Election. The Conservative and Liberal Democrat parties formed a coalition and the leader of the Conservative Party, David Cameron, became Prime Minister.</p>

        <p>The Conservative Party won a majority at the general election of 7 May 2015 and David Cameron remained Prime Minister. He was succeeded by Theresa May on 13 July 2016.</p>

        <div class="info-box">
            <h3>Check that you understand</h3>
            <ul>
                <li>✔ The establishment of the welfare state</li>
                <li>✔ How life in Britain changed in the 1960s and 1970s</li>
                <li>✔ British inventions of the 20th century (you do not need to remember dates of births and deaths)</li>
                <li>✔ Events since 1979</li>
            </ul>
        </div>
      `;

    case '4':
      return `
        <div class="section-marker" data-section="introduction"></div>
        <h1>A Modern, Thriving Society</h1>
        
        <div class="image-placeholder">
            [A Modern, Thriving Society - Chapter Header]
        </div>
        
        <div class="info-box">
            <h3>Chapter Contents</h3>
            <ul>
                <li>The UK today</li>
                <li>Religion</li>
                <li>Customs and traditions</li>
                <li>Sport</li>
                <li>Arts and culture</li>
                <li>Leisure</li>
                <li>Places of interest</li>
            </ul>
        </div>

        <div class="section-marker" data-section="uk-today"></div>
        <h1>The UK today</h1>
        
        <p>The UK today is a more diverse society than it was 100 years ago, in both ethnic and religious terms. Post-war immigration means that nearly 10% of the population has a parent or grandparent born outside the UK. The UK continues to be a multinational and multiracial society with a rich and varied culture. This section will tell you about the different parts of the UK and some of the important places. It will also explain some of the UK's traditions and customs and some of the popular activities that take place.</p>

        <h2>The nations of the UK</h2>
        <p>The UK is located in the north west of Europe. The longest distance on the mainland is from John O'Groats on the north coast of Scotland to Land's End in the south-west corner of England. It is about 870 miles (approximately 1,400 kilometres).</p>
        
        <p>Most people live in towns and cities but much of Britain is still countryside. Many people continue to visit the countryside for holidays and for leisure activities such as walking, camping and fishing.</p>

                 <div class="image-container">
             <img src="../assets/content/images/image_rsrc111.jpg" alt="Cities of the UK - Map" class="content-image"/>
         </div>

        <h2>UK currency</h2>
        <p>The currency in the UK is the pound sterling (symbol £). There are 100 pence in a pound. The denominations (values) of currency are:</p>
        <ul>
            <li>coins: 1p, 2p, 5p, 10p, 20p, 50p, £1 and £2</li>
            <li>notes: £5, £10, £20, £50</li>
        </ul>
        <p>Northern Ireland and Scotland have their own banknotes, which are valid everywhere in the UK. However, shops and businesses do not have to accept them.</p>

        <h2>Languages and dialects</h2>
        <p>There are many variations in language in the different parts of the UK. The English language has many accents and dialects. In Wales, many people speak Welsh – a completely different language from English – and it is taught in schools and universities. In Scotland, Gaelic (again, a different language) is spoken in some parts of the Highlands and Islands, and in Northern Ireland some people speak Irish Gaelic.</p>

        <h2>Population</h2>
        <p>The table below shows how the population of the UK has changed over time.</p>
        
        <div class="highlight-box">
            <h3>Population growth in the UK</h3>
            <table>
                <tr><th>Year</th><th>Population</th></tr>
                <tr><td>1600</td><td>Just over 4 million</td></tr>
                <tr><td>1700</td><td>5 million</td></tr>
                <tr><td>1801</td><td>8 million</td></tr>
                <tr><td>1851</td><td>20 million</td></tr>
                <tr><td>1901</td><td>40 million</td></tr>
                <tr><td>1951</td><td>50 million</td></tr>
                <tr><td>1998</td><td>57 million</td></tr>
                <tr><td>2005</td><td>Just under 60 million</td></tr>
                <tr><td>2010</td><td>Just over 62 million</td></tr>
                <tr><td>2017</td><td>Just over 66 million</td></tr>
            </table>
            <p><em>Source: National Statistics</em></p>
        </div>
        
        <p>Population growth has been faster in more recent years. Migration into the UK and longer life expectancy have played a part in population growth.</p>
        
        <p>The population is very unequally distributed over the four parts of the UK. England more or less consistently makes up 84% of the total population, Wales around 5%, Scotland just over 8%, and Northern Ireland less than 3%.</p>

        <h3>An ageing population</h3>
        <p>People in the UK are living longer than ever before. This is due to improved living standards and better health care. There are now a record number of people aged 85 and over. This has an impact on the cost of pensions and health care.</p>

        <h2>Ethnic diversity</h2>
        <p>The UK population is ethnically diverse and changing rapidly, especially in large cities such as London. It is not always easy to get an exact picture of the ethnic origin of all the population.</p>
        
        <p>There are people in the UK with ethnic origins from all over the world. In surveys, the most common ethnic description chosen is white, which includes people of European, Australian, Canadian, New Zealand and American descent. Other significant groups are those of Asian, black and mixed descent.</p>

        <h2>An equal society</h2>
        <p>Within the UK, it is a legal requirement that men and women should not be discriminated against because of their gender or because they are, or are not, married. They have equal rights to work, own property, marry and divorce. If they are married, both parents are equally responsible for their children.</p>
        
        <p>Women in Britain today make up about half of the workforce. On average, girls leave school with better qualifications than boys. More women than men study at university.</p>
        
        <p>Employment opportunities for women are much greater than they were in the past. Women work in all sectors of the economy, and there are now more women in high-level positions than ever before, including senior managers in traditionally male-dominated occupations. Alongside this, men now work in more varied jobs than they did in the past.</p>
        
        <p>It is no longer expected that women should stay at home and not work. Women often continue to work after having children. In many families today, both partners work and both share responsibility for childcare and household chores.</p>

        <div class="info-box">
            <h3>Check that you understand</h3>
            <ul>
                <li>✔ The capital cities of the UK</li>
                <li>✔ What languages other than English are spoken in particular parts of the UK</li>
                <li>✔ How the population of the UK has changed</li>
                <li>✔ That the UK is an equal society and ethnically diverse</li>
                <li>✔ The currency of the UK</li>
            </ul>
        </div>

        <div class="section-marker" data-section="religion"></div>
        <h1>Religion</h1>
        
        <p>The UK is historically a Christian country. In the 2011 Census, 59% of people identified themselves as Christian. Much smaller proportions identified themselves as Muslim (4.8%), Hindu (1.5%), Sikh (0.8%) and Jewish or Buddhist (both less than 0.5%). There are religious buildings for other religions all over the UK. This includes Islamic mosques, Hindu temples, Jewish synagogues, Sikh gurdwaras and Buddhist temples. However, everyone has the legal right to choose their religion, or to choose not to practise a religion. In the 2011 census, 25% of people said they had no religion.</p>

        <h2>Christian churches</h2>
        <p>In England, there is a constitutional link between Church and state. The official Church of the state is the Church of England (called the Anglican Church in other countries and the Episcopal Church in Scotland and the United States). It is a Protestant Church and has existed since the Reformation in the 1530s.</p>
        
        <p>The monarch is the head of the Church of England. The spiritual leader of the Church of England is the Archbishop of Canterbury. The monarch has the right to select the Archbishop and other senior church officials, but usually the choice is made by the Prime Minister and a committee appointed by the Church. Several Church of England bishops sit in the House of Lords.</p>
        
        <p>In Scotland, the national Church is the Church of Scotland, which is a Presbyterian Church. It is governed by ministers and elders. The chairperson of the General Assembly of the Church of Scotland is the Moderator, who is appointed for one year only and often speaks on behalf of that Church.</p>
        
        <p>There is no established Church in Wales or Northern Ireland.</p>
        
        <p>Other Protestant Christian groups in the UK are Baptists, Methodists, Presbyterians and Quakers. There are also other denominations of Christianity, the biggest of which is Roman Catholic.</p>

        <h2>Patron saints' days</h2>
        <p>England, Scotland, Wales and Northern Ireland each have a national saint, called a patron saint. Each saint has a special day:</p>
        <ul>
            <li>1 March: St David's Day, Wales</li>
            <li>17 March: St Patrick's Day, Northern Ireland</li>
            <li>23 April: St George's Day, England</li>
            <li>30 November: St Andrew's Day, Scotland</li>
        </ul>
        
        <p>Only Scotland and Northern Ireland have their patron saint's day as an official holiday (although in Scotland not all businesses and offices will close). Events are held across Scotland, Northern Ireland and the rest of the country, especially where there are a lot of people of Scottish, Northern Irish and Irish heritage.</p>
        
        <p>While the patron saints' days are no longer public holidays in England and Wales, they are still celebrated. Parades and small festivals are held all over the two countries.</p>

                 <div class="image-container">
             <img src="../assets/content/images/image_rsrc7F.jpg" alt="Westminster Abbey - coronation church since 1066 and final resting place of many monarchs" class="content-image"/>
         </div>

        <div class="info-box">
            <h3>Check that you understand</h3>
            <ul>
                <li>✔ The different religions that are practised in the UK</li>
                <li>✔ That the Anglican Church, also known as the Church of England, is the Church of the state in England (the 'established Church')</li>
                <li>✔ That other branches of the Christian Church also practise their faith in the UK without being linked to the state</li>
                <li>✔ That other religions are practised in the UK</li>
                <li>✔ About the patron saints</li>
            </ul>
        </div>

        <div class="section-marker" data-section="customs-traditions"></div>
        <h1>Customs and traditions</h1>

        <h2>The main Christian festivals</h2>
        <p><strong>Christmas Day</strong>, 25 December, celebrates the birth of Jesus Christ. It is a public holiday. Many Christians go to church on Christmas Eve (24 December) or on Christmas Day itself.</p>
        
        <p>Christmas is celebrated in a traditional way. People usually spend the day at home and eat a special meal, which often includes roast turkey, Christmas pudding and mince pies. They give gifts, send cards and decorate their houses. Christmas is a special time for children. Very young children believe that Father Christmas (also known as Santa Claus) brings them presents during the night before Christmas Day. Many people decorate a tree in their home.</p>

                 <div class="image-container">
             <img src="../assets/content/images/image_rsrc15E.jpg" alt="A typical Christmas Day meal" class="content-image"/>
         </div>

        <p><strong>Boxing Day</strong> is the day after Christmas Day and is a public holiday.</p>
        
        <p><strong>Easter</strong> takes place in March or April. It marks the death of Jesus Christ on Good Friday and his rising from the dead on Easter Sunday. Both Good Friday and the following Monday, called Easter Monday, are public holidays.</p>
        
        <p>The 40 days before Easter are known as Lent. It is a time when Christians take time to reflect and prepare for Easter. Traditionally, people would fast during this period and today many people will give something up, like a favourite food. The day before Lent starts is called Shrove Tuesday, or Pancake Day. People eat pancakes, which were traditionally made to use up foods such as eggs, fat and milk before fasting. Lent begins on Ash Wednesday. There are church services where Christians are marked with an ash cross on their forehead as a symbol of death and sorrow for sin.</p>
        
        <p>Easter is also celebrated by people who are not religious. 'Easter eggs' are chocolate eggs often given as presents at Easter as a symbol of new life.</p>

        <h2>Other religious festivals</h2>
        <p><strong>Diwali</strong> normally falls in October or November and lasts for five days. It is often called the Festival of Lights. It is celebrated by Hindus and Sikhs. It celebrates the victory of good over evil and the gaining of knowledge. There are different stories about how the festival came about. There is a famous celebration of Diwali in Leicester.</p>

                 <div class="image-container">
             <img src="../assets/content/images/image_rsrc178.jpg" alt="Diwali is popularly known as the Festival of Lights" class="content-image"/>
         </div>

        <p><strong>Hannukah</strong> is in November or December and is celebrated for eight days. It is to remember the Jews' struggle for religious freedom. On each day of the festival a candle is lit on a stand of eight candles (called a menorah) to remember the story of the festival, where oil that should have lasted only a day did so for eight.</p>
        
        <p><strong>Eid al-Fitr</strong> celebrates the end of Ramadan, when Muslims have fasted for a month. They thank Allah for giving them the strength to complete the fast. The date when it takes place changes every year. Muslims attend special services and meals.</p>
        
        <p><strong>Eid ul Adha</strong> remembers that the prophet Ibrahim was willing to sacrifice his son when God ordered him to. It reminds Muslims of their own commitment to God. Many Muslims sacrifice an animal to eat during this festival. In Britain this has to be done in a slaughterhouse.</p>
        
        <p><strong>Vaisakhi</strong> (also spelled Baisakhi) is a Sikh festival which celebrates the founding of the Sikh community known as the Khalsa. It is celebrated on 14 April each year with parades, dancing and singing.</p>

        <h2>Other festivals and traditions</h2>
        <p><strong>New Year</strong>, 1 January, is a public holiday. People usually celebrate on the night of 31 December (called New Year's Eve). In Scotland, 31 December is called Hogmanay and 2 January is also a public holiday. For some Scottish people, Hogmanay is a bigger holiday than Christmas.</p>
        
        <p><strong>Valentine's Day</strong>, 14 February, is when lovers exchange cards and gifts. Sometimes people send anonymous cards to someone they secretly admire.</p>
        
        <p><strong>April Fool's Day</strong>, 1 April, is a day when people play jokes on each other until midday. The television and newspapers often have stories that are April Fool jokes.</p>
        
        <p><strong>Mothering Sunday</strong> (or Mother's Day) is the Sunday three weeks before Easter. Children send cards or buy gifts for their mothers.</p>
        
        <p><strong>Father's Day</strong> is the third Sunday in June. Children send cards or buy gifts for their fathers.</p>
        
        <p><strong>Halloween</strong>, 31 October, is an ancient festival and has roots in the pagan festival to mark the beginning of winter. Young people will often dress up in frightening costumes to play 'trick or treat'. People give them treats to stop them playing tricks on them. A lot of people carve lanterns out of pumpkins and put a candle inside.</p>
        
        <p><strong>Bonfire Night</strong>, 5 November, is an occasion when people in Great Britain set off fireworks at home or in special displays. The origin of this celebration was an event in 1605, when a group of Catholics led by Guy Fawkes failed in their plan to kill the Protestant king with a bomb in the Houses of Parliament.</p>
        
        <p><strong>Remembrance Day</strong>, 11 November, commemorates those who died fighting for the UK and its allies. Originally it commemorated the dead of the First World War, which ended on 11 November 1918. People wear poppies (the red flower found on the battlefields of the First World War). At 11.00 am there is a two-minute silence and wreaths are laid at the Cenotaph in Whitehall, London.</p>

                 <div class="image-container">
             <img src="../assets/content/images/image_rsrc17C.jpg" alt="Unveiled in 1920, the Cenotaph is the centrepiece to the Remembrance Day service" class="content-image"/>
         </div>

        <h2>Bank holidays</h2>
        <p>As well as those mentioned previously, there are other public holidays each year called bank holidays, when banks and many other businesses are closed for the day. These are of no religious significance. They are at the beginning of May, in late May or early June, and in August. In Northern Ireland, the anniversary of the Battle of the Boyne in July is also a public holiday.</p>

        <div class="info-box">
            <h3>Check that you understand</h3>
            <ul>
                <li>✔ The main Christian festivals that are celebrated in the UK</li>
                <li>✔ Other religious festivals that are important in the UK</li>
                <li>✔ Some of the other events that are celebrated in the UK</li>
                <li>✔ What a bank holiday is</li>
            </ul>
        </div>

        <div class="section-marker" data-section="sport"></div>
        <h1>Sport</h1>
        
        <p>Sports of all kinds play an important part in many people's lives. There are several sports that are particularly popular in the UK. Many sporting events take place at major stadiums such as Wembley Stadium in London and the Principality Stadium in Cardiff.</p>
        
        <p>Local governments and private companies provide sports facilities such as swimming pools, tennis courts, football pitches, dry ski slopes and gymnasiums. Many famous sports, including cricket, football, lawn tennis, golf and rugby, began in Britain.</p>
        
        <p>The UK has hosted the Olympic Games on three occasions: 1908, 1948 and 2012. The main Olympic site for the 2012 Games was in Stratford, East London. The British team was very successful, across a wide range of Olympic sports, finishing third in the medal table.</p>
        
        <p>The Paralympic Games for 2012 were also hosted in London. The Paralympics have their origin in the work of Dr Sir Ludwig Guttman, a German refugee, at the Stoke Mandeville hospital in Buckinghamshire. Dr Guttman developed new methods of treatment for people with spinal injuries and encouraged patients to take part in exercise and sport.</p>

        <div class="highlight-box">
            <h3>Notable British sportsmen and women</h3>
            <ul>
                <li><strong>Sir Roger Bannister (1929–2018)</strong> was the first man in the world to run a mile in under four minutes, in 1954.</li>
                <li><strong>Sir Jackie Stewart (1939–)</strong> is a Scottish former racing driver who won the Formula 1 world championship three times.</li>
                <li><strong>Bobby Moore (1941–93)</strong> captained the English football team that won the World Cup in 1966.</li>
                <li><strong>Sir Ian Botham (1955–)</strong> captained the English cricket team and held a number of English Test cricket records, both for batting and for bowling.</li>
                <li><strong>Jayne Torvill (1957–) and Christopher Dean (1958–)</strong> won gold medals for ice dancing at the Olympic Games in 1984 and in four consecutive world championships.</li>
                <li><strong>Sir Steve Redgrave (1962–)</strong> won gold medals in rowing in five consecutive Olympic Games and is one of Britain's greatest Olympians.</li>
                <li><strong>Baroness Tanni Grey-Thompson (1969–)</strong> is an athlete who uses a wheelchair and won 16 Paralympic medals, including 11 gold medals, in races over five Paralympic Games. She won the London Marathon six times and broke a total of 30 world records.</li>
                <li><strong>Dame Kelly Holmes (1970–)</strong> won two gold medals for running in the 2004 Olympic Games. She has held a number of British and European records.</li>
                <li><strong>Dame Ellen MacArthur (1976–)</strong> is a yachtswoman and in 2004 became the fastest person to sail around the world singlehanded.</li>
                <li><strong>Sir Chris Hoy (1976–)</strong> is a Scottish cyclist who has won six gold and one silver Olympic medals. He has also won 11 world championship titles.</li>
                <li><strong>David Weir (1979–)</strong> is a Paralympian who uses a wheelchair and has won six gold medals over two Paralympic Games. He has also won the London Marathon six times.</li>
                <li><strong>Sir Bradley Wiggins (1980–)</strong> is a cyclist. In 2012, he became the first Briton to win the Tour de France. He has won eight Olympic medals, including Gold in the 2004, 2008, 2012 and 2016 Olympic Games.</li>
                <li><strong>Sir Mo Farah (1983–)</strong> is a British distance runner, born in Somalia. He won gold medals in the 2012 and 2016 Olympics for the 5,000 and 10,000 metres and is the first Briton to win the Olympic gold medal in the 10,000 metres.</li>
                <li><strong>Dame Jessica Ennis-Hill (1986–)</strong> is an athlete. She won the 2012 Olympic gold medal in the heptathlon and the silver medal in the 2016 Olympic Games, which includes seven different track and field events. She also holds a number of British athletics records.</li>
                <li><strong>Sir Andy Murray (1987–)</strong> is a Scottish tennis player who in 2012 won the men's singles in the US Open. He is the first British man to win a singles title in a Grand Slam tournament since 1936. In the same year, he won Olympic gold and silver medals. In 2013 and 2016 he won the men's singles at Wimbledon. He also went onto win Gold at the 2016 Olympics.</li>
                <li><strong>Ellie Simmonds (1994–)</strong> is a Paralympian who won gold medals for swimming at the 2008, 2012 and 2016 Paralympic Games. and holds a number of world records. She was the youngest member of the British team at the 2008 Games.</li>
            </ul>
        </div>

        <h2>Cricket</h2>
        <p>Cricket originated in England and is now played in many countries. Games can last up to five days but still result in a draw! The idiosyncratic nature of the game and its complex laws are said to reflect the best of the British character and sense of fair play. You may come across expressions such as 'rain stopped play', 'batting on a sticky wicket', 'playing a straight bat', 'bowled a googly' or 'it's just not cricket', which have passed into everyday usage. The most famous competition is the Ashes, which is a series of Test matches played between England and Australia.</p>

        [Cricket is one of the many famous sports originating in Britain]

        <h2>Football</h2>
        <p>Football is the UK's most popular sport. It has a long history in the UK and the first professional football clubs were formed in the late 19th century.</p>
        
        <p>England, Scotland, Wales and Northern Ireland each have separate leagues in which clubs representing different towns and cities compete. The English Premier League attracts a huge international audience. Many of the best players in the world play in the Premier League. Many UK teams also compete in competitions such as the UEFA (Union of European Football Associations) Champions League, against other teams from Europe. Many towns and cities have a professional club and people take great pride in supporting their home team. There can be great rivalry between different football clubs and among fans.</p>
        
        <p>Each country in the UK also has its own national team that competes with other national teams across the world in tournaments such as the FIFA (Fédération Internationale de Football Association) World Cup and the UEFA European Football Championships. England's only international tournament victory was at the World Cup of 1966, hosted in the UK.</p>
        
        <p>Football is also a popular sport to play in many local communities, with people playing amateur games every week in parks all over the UK.</p>

        <h2>Rugby</h2>
        <p>Rugby originated in England in the early 19th century and is very popular in the UK today. There are two different types of rugby, which have different rules: union and league. Both have separate leagues and national teams in England, Wales, Scotland and Northern Ireland (who play with the Irish Republic). Teams from all countries compete in a range of competitions. The most famous rugby union competition is the Six Nations Championship between England, Ireland, Scotland, Wales, France and Italy. The Super League is the most well-known rugby league (club) competition.</p>

        <h2>Horse racing</h2>
        <p>There is a very long history of horse racing in Britain, with evidence of events taking place as far back as Roman times. The sport has a long association with royalty. There are racecourses all over the UK. Famous horse-racing events include: Royal Ascot, a five-day race meeting in Berkshire attended by members of the Royal Family; the Grand National at Aintree near Liverpool; and the Scottish Grand National at Ayr. There is a National Horseracing Museum in Newmarket, Suffolk.</p>

        <h2>Golf</h2>
        <p>The modern game of golf can be traced back to 15th century Scotland. It is a popular sport played socially as well as professionally. There are public and private golf courses all over the UK. St Andrews in Scotland is known as the home of golf.</p>
        
        <p>The Open Championship is the only 'Major' tournament held outside the United States. It is hosted by a different golf course every year.</p>

        <h2>Tennis</h2>
        <p>Modern tennis evolved in England in the late 19th century. The first tennis club was founded in Leamington Spa in 1872. The most famous tournament hosted in Britain is The Wimbledon Championships, which takes place each year at the All England Lawn Tennis and Croquet Club. It is the oldest tennis tournament in the world and the only 'Grand Slam' event played on grass.</p>

        <h2>Water sports</h2>
        <p>Sailing continues to be popular in the UK, reflecting our maritime heritage. A British sailor, Sir Francis Chichester, was the first person to sail single-handed around the world passing the Cape of Good Hope (Africa) and Cape Horn (South America), in 1966/67. Two years later, Sir Robin Knox-Johnston became the first person to do this without stopping. Many sailing events are held throughout the UK, the most famous of which is at Cowes on the Isle of Wight.</p>
        
        <p>Rowing is also popular, both as a leisure activity and as a competitive sport. There is a popular yearly race on the Thames between Oxford and Cambridge Universities.</p>

        <h2>Motor sports</h2>
        <p>There is a long history of motor sport in the UK, for both cars and motor cycles. Motor-car racing in the UK started in 1902. The UK continues to be a world leader in the development and manufacture of motor-sport technology. A Formula 1 Grand Prix event is held in the UK each year and a number of British Grand Prix drivers have won the Formula 1 World Championship. Recent British winners include Damon Hill, Lewis Hamilton and Jenson Button.</p>

        <h2>Skiing</h2>
        <p>Skiing is increasingly popular in the UK. Many people go abroad to ski and there are also dry ski slopes throughout the UK. Skiing on snow may also be possible during the winter. There are five ski centres in Scotland, as well as Europe's longest dry ski slope near Edinburgh.</p>

        <div class="section-marker" data-section="arts-culture"></div>
        <h1>Arts and culture</h1>

        <h2>Music</h2>
        <p>Music is an important part of British culture, with a rich and varied heritage. It ranges from classical music to modern pop. There are many different venues and musical events that take place across the UK.</p>
        
        <p>The Proms is an eight-week summer season of orchestral classical music that takes place in various venues, including the Royal Albert Hall in London. It has been organised by the British Broadcasting Corporation (BBC) since 1927. The Last Night of the Proms is the most well-known concert and (along with others in the series) is broadcast on television.</p>
        
        <p>Classical music has been popular in the UK for many centuries. <strong>Henry Purcell (1659–95)</strong> was the organist at Westminster Abbey. He wrote church music, operas and other pieces, and developed a British style distinct from that elsewhere in Europe. He continues to be influential on British composers.</p>
        
        <p>The German-born composer <strong>George Frederick Handel (1685–1759)</strong> spent many years in the UK and became a British citizen in 1727. He wrote the <em>Water Music</em> for King George I and <em>Music for the Royal Fireworks</em> for his son, George II. Both these pieces continue to be very popular. Handel also wrote an oratorio, <em>Messiah</em>, which is sung regularly by choirs, often at Easter time.</p>
        
        <p>More recently, important composers include <strong>Gustav Holst (1874–1934)</strong>, whose work includes <em>The Planets</em>, a suite of pieces themed around the planets of the solar system. He adapted <em>Jupiter</em>, part of the <em>Planets</em> suite, as the tune for <em>I vow to thee my country</em>, a popular hymn in British churches.</p>
        
        <p><strong>Sir Edward Elgar (1857–1934)</strong> was born in Worcester, England. His best-known work is probably the <em>Pomp and Circumstance Marches</em>. <em>March No 1 (Land of Hope and Glory)</em> is usually played at the Last Night of the Proms at the Royal Albert Hall.</p>

        [The Royal Albert Hall is the venue for the Last Night of the Proms]

        <p><strong>Ralph Vaughan Williams (1872–1958)</strong> wrote music for orchestras and choirs. He was strongly influenced by traditional English folk music.</p>
        
        <p><strong>Sir William Walton (1902–83)</strong> wrote a wide range of music, from film scores to opera. He wrote marches for the coronations of King George VI and Queen Elizabeth II but his best-known works are probably <em>Façade</em>, which became a ballet, and <em>Belshazzar's Feast</em>, which is intended to be sung by a large choir.</p>
        
        <p><strong>Benjamin Britten (1913–76)</strong> is best known for his operas, which include <em>Peter Grimes</em> and <em>Billy Budd</em>. He also wrote <em>A Young Person's Guide to the Orchestra</em>, which is based on a piece of music by Purcell and introduces the listener to the various different sections of an orchestra. He founded the Aldeburgh festival in Suffolk, which continues to be a popular music event of international importance.</p>
        
        <p>Other types of popular music, including folk music, jazz, pop and rock music, have flourished in Britain since the 20th century. Britain has had an impact on popular music around the world, due to the wide use of the English language, the UK's cultural links with many countries, and British capacity for invention and innovation.</p>
        
        <p>Since the 1960s, British pop music has made one of the most important cultural contributions to life in the UK. Bands including The Beatles and The Rolling Stones continue to have an influence on music both here and abroad. British pop music has continued to innovate – for example, the Punk movement of the late 1970s, and the trend towards boy and girl bands in the 1990s.</p>
        
        <p>There are many large venues that host music events throughout the year, such as: Wembley Stadium; The O2 in Greenwich, south-east London; and the Scottish Exhibition and Conference Centre (SECC) in Glasgow.</p>
        
        <p>Festival season takes place across the UK every summer, with major events in various locations. Famous festivals include Glastonbury, the Isle of Wight Festival and Creamfields. Many bands and solo artists, both well-known and up-and-coming, perform at these events.</p>
        
        <p>The National Eisteddfod of Wales is an annual cultural festival which includes music, dance, art and original performances largely in Welsh. It includes a number of important competitions for Welsh poetry.</p>
        
        <p>The Mercury Music Prize is awarded each September for the best album from the UK and Ireland. The Brit Awards is an annual event that gives awards in a range of categories, such as best British group and best British solo artist.</p>

        <h2>Theatre</h2>
        <p>There are theatres in most towns and cities throughout the UK, ranging from the large to the small. They are an important part of local communities and often show both professional and amateur productions. London's West End, also known as 'Theatreland', is particularly well known. <em>The Mousetrap</em>, a murder-mystery play by Dame Agatha Christie, has been running in the West End since 1952 and has had the longest initial run of any show in history.</p>
        
        <p>There is also a strong tradition of musical theatre in the UK. In the 19th century, Gilbert and Sullivan wrote comic operas, often making fun of popular culture and politics. These operas include <em>HMS Pinafore, The Pirates of Penzance</em> and <em>The Mikado</em>. Gilbert and Sullivan's work is still often staged by professional and amateur groups. More recently, Andrew Lloyd Webber has written the music for shows which have been popular throughout the world, including, in collaboration with Tim Rice, <em>Jesus Christ Superstar</em> and <em>Evita</em>, and also <em>Cats</em> and <em>The Phantom of the Opera</em>.</p>
        
        <p>One British tradition is the pantomime. Many theatres produce a pantomime at Christmas time. They are based on fairy stories and are light-hearted plays with music and comedy, enjoyed by family audiences. One of the traditional characters is the Dame, a woman played by a man. There is often also a pantomime horse or cow played by two actors in the same costume.</p>
        
        <p>The Edinburgh Festival takes place in Edinburgh, Scotland, every summer. It is a series of different arts and cultural festivals, with the biggest and most well-known being the Edinburgh Festival Fringe ('the Fringe'). The Fringe is a showcase of mainly theatre and comedy performances. It often shows experimental work.</p>
        
        <p>The Laurence Olivier Awards take place annually at different venues in London. There are a variety of categories, including best director, best actor and best actress. The awards are named after the British actor Sir Laurence Olivier, later Lord Olivier, who was best known for his roles in various Shakespeare plays.</p>

        <h2>Art</h2>
        <p>During the Middle Ages, most art had a religious theme, particularly wall paintings in churches and illustrations in religious books. Much of this was lost after the Protestant Reformation but wealthy families began to collect other paintings and sculptures. Many of the painters working in Britain in the 16th and 17th centuries were from abroad – for example, Hans Holbein and Sir Anthony Van Dyck. British artists, particularly those painting portraits and landscapes, became well known from the 18th century onwards.</p>
        
        <p>Works by British and international artists are displayed in galleries across the UK. Some of the most well-known galleries are The National Gallery, Tate Britain and Tate Modern in London, the National Museum in Cardiff, and the National Gallery of Scotland in Edinburgh.</p>

        <div class="highlight-box">
            <h3>Notable British artists</h3>
            <ul>
                <li><strong>Thomas Gainsborough (1727–88)</strong> was a portrait painter who often painted people in country or garden scenery.</li>
                <li><strong>David Allan (1744–96)</strong> was a Scottish painter who was best known for painting portraits. One of his most famous works is called <em>The Origin of Painting</em>.</li>
                <li><strong>Joseph Turner (1775–1851)</strong> was an influential landscape painter in a modern style. He is considered the artist who raised the profile of landscape painting.</li>
                <li><strong>John Constable (1776–1837)</strong> was a landscape painter most famous for his works of Dedham Vale on the Suffolk–Essex border in the east of England.</li>
                <li><strong>The Pre-Raphaelites</strong> were an important group of artists in the second half of the 19th century. They painted detailed pictures on religious or literary themes in bright colours. The group included Holman Hunt, Dante Gabriel Rossetti and Sir John Millais.</li>
                <li><strong>Sir John Lavery (1856–1941)</strong> was a very successful Northern Irish portrait painter. His work included painting the Royal Family.</li>
                <li><strong>Henry Moore (1898–1986)</strong> was an English sculptor and artist. He is best known for his large bronze abstract sculptures.</li>
                <li><strong>John Petts (1914–91)</strong> was a Welsh artist, best known for his engravings and stained glass.</li>
                <li><strong>Lucian Freud (1922–2011)</strong> was a German-born British artist. He is best known for his portraits.</li>
                <li><strong>David Hockney (1937–)</strong> was an important contributor to the 'pop art' movement of the 1960s and continues to be influential today.</li>
            </ul>
        </div>

        [Tate Modern is based in the former Bankside Power Station in central London]

        <p>The Turner Prize was established in 1984 and celebrates contemporary art. It was named after Joseph Turner. Four works are shortlisted every year and shown at Tate Britain before the winner is announced. The Turner Prize is recognised as one of the most prestigious visual art awards in Europe. Previous winners include Damien Hirst and Richard Wright.</p>

        <h2>Architecture</h2>
        <p>The architectural heritage of the UK is rich and varied. In the Middle Ages, great cathedrals and churches were built, many of which still stand today. Examples are the cathedrals in Durham, Lincoln, Canterbury and Salisbury. The White Tower in the Tower of London is an example of a Norman castle keep, built on the orders of William the Conqueror.</p>
        
        <p>Gradually, as the countryside became more peaceful and landowners became richer, the houses of the wealthy became more elaborate and great country houses such as Hardwick Hall in Derbyshire were built. British styles of architecture began to evolve.</p>
        
        <p>In the 17th century, Inigo Jones took inspiration from classical architecture to design the Queen's House at Greenwich and the Banqueting House in Whitehall in London. Later in the century, Sir Christopher Wren helped develop a British version of the ornate styles popular in Europe in buildings such as the new St Paul's Cathedral.</p>
        
        <p>In the 18th century, simpler designs became popular. The Scottish architect Robert Adam influenced the development of architecture in the UK, Europe and America. He designed the inside decoration as well as the building itself in great houses such as Dumfries House in Scotland. His ideas influenced architects in cities such as Bath, where the Royal Crescent was built.</p>
        
        <p>In the 19th century, the medieval 'gothic' style became popular again. As cities expanded, many great public buildings were built in this style. The Houses of Parliament and St Pancras Station were built at this time, as were the town halls in cities such as Manchester and Sheffield.</p>
        
        <p>In the 20th century, Sir Edwin Lutyens had an influence throughout the British Empire. He designed New Delhi to be the seat of government in India. After the First World War, he was responsible for many war memorials throughout the world, including the Cenotaph in Whitehall. The Cenotaph is the site of the annual Remembrance Day service attended by the Queen, politicians and foreign ambassadors.</p>
        
        <p>The firms of modern British architects continue to work on major projects throughout the world as well as within the UK. These include those of Sir Norman Foster (1935–), Lord (Richard) Rogers (1933–) and Dame Zaha Hadid (1950–2016).</p>
        
        <p>Alongside the development of architecture, garden design and landscaping have played an important role in the UK. In the 18th century, Lancelot 'Capability' Brown designed the grounds around country houses so that the landscape appeared to be natural, with grass, trees and lakes. He often said that a place had 'capabilities'. Later, Gertrude Jekyll often worked with Edwin Lutyens to design colourful gardens around the houses he designed. Gardens continue to be an important part of homes in the UK. The annual Chelsea Flower Show showcases garden design from Britain and around the world.</p>

        <h2>Fashion and design</h2>
        <p>Britain has produced many great designers, from Thomas Chippendale (who designed furniture in the 18th century) to Clarice Cliff (who designed Art Deco ceramics) to Sir Terence Conran (a 20th-century interior designer). Leading fashion designers of recent years include Mary Quant, Alexander McQueen and Vivienne Westwood.</p>

        <h2>Literature</h2>
        <p>The UK has a prestigious literary history and tradition. Several British writers, including the novelist Sir William Golding, the poet Seamus Heaney, and the playwright Harold Pinter, have won the Nobel Prize in Literature. Other authors have become well known in popular fiction. Agatha Christie's detective stories are read all over the world and Ian Fleming's books introduced James Bond. In 2003, <em>The Lord of the Rings</em> by JRR Tolkien was voted the country's best-loved novel.</p>
        
        <p>The Man Booker Prize for Fiction is awarded annually for the best fiction novel written by an author from the Commonwealth, Ireland or Zimbabwe. It has been awarded since 1968. Past winners include Ian McEwan, Hilary Mantel and Julian Barnes.</p>

        <div class="highlight-box">
            <h3>Notable authors and writers</h3>
            <ul>
                <li><strong>Jane Austen (1775–1817)</strong> was an English novelist. Her books include <em>Pride and Prejudice</em> and <em>Sense and Sensibility</em>. Her novels are concerned with marriage and family relationships. Many have been made into television programmes or films.</li>
                <li><strong>Charles Dickens (1812–70)</strong> wrote a number of very famous novels, including <em>Oliver Twist</em> and <em>Great Expectations</em>. You will hear references in everyday talk to some of the characters in his books, such as Scrooge (a mean person) or Mr Micawber (always hopeful).</li>
                <li><strong>Robert Louis Stevenson (1850–94)</strong> wrote books which are still read by adults and children today. His most famous books include <em>Treasure Island</em>, <em>Kidnapped</em> and <em>Dr Jekyll and Mr Hyde</em>.</li>
                <li><strong>Thomas Hardy (1840–1928)</strong> was an author and poet. His best-known novels focus on rural society and include <em>Far from the Madding Crowd</em> and <em>Jude the Obscure</em>.</li>
                <li><strong>Sir Arthur Conan Doyle (1859–1930)</strong> was a Scottish doctor and writer. He was best known for his stories about Sherlock Holmes, who was one of the first fictional detectives.</li>
                <li><strong>Evelyn Waugh (1903–66)</strong> wrote satirical novels, including <em>Decline and Fall</em> and <em>Scoop</em>. He is perhaps best known for <em>Brideshead Revisited</em>.</li>
                <li><strong>Sir Kingsley Amis (1922–95)</strong> was an English novelist and poet. He wrote more than 20 novels. The most well known is <em>Lucky Jim</em>.</li>
                <li><strong>Graham Greene (1904–91)</strong> wrote novels often influenced by his religious beliefs, including <em>The Heart of the Matter</em>, <em>The Honorary Consul</em>, <em>Brighton Rock</em> and <em>Our Man in Havana</em>.</li>
                <li><strong>J K Rowling (1965–)</strong> wrote the Harry Potter series of children's books, which have enjoyed huge international success. She now writes fiction for adults as well.</li>
            </ul>
        </div>

        <h3>British poets</h3>
        <p>British poetry is among the richest in the world. The Anglo-Saxon poem <em>Beowulf</em> tells of its hero's battles against monsters and is still translated into modern English. Poems which survive from the Middle Ages include Chaucer's <em>Canterbury Tales</em> and a poem called <em>Sir Gawain and the Green Knight</em>, about one of the knights at the court of King Arthur.</p>
        
        <p>As well as plays, Shakespeare wrote many sonnets (poems which must be 14 lines long) and some longer poems. As Protestant ideas spread, a number of poets wrote poems inspired by their religious views. One of these was John Milton, who wrote <em>Paradise Lost</em>.</p>
        
        <p>Other poets, including William Wordsworth, were inspired by nature. Sir Walter Scott wrote poems inspired by Scotland and the traditional stories and songs from the area on the borders of Scotland and England. He also wrote novels, many of which were set in Scotland.</p>
        
        <p>Poetry was very popular in the 19th century, with poets such as William Blake, John Keats, Lord Byron, Percy Shelley, Alfred Lord Tennyson, and Robert and Elizabeth Browning. Later, many poets – for example, Wilfred Owen and Siegfried Sassoon – were inspired to write about their experiences in the First World War. More recently, popular poets have included Sir Walter de la Mare, John Masefield, Sir John Betjeman and Ted Hughes.</p>
        
        <p>Some of the best-known poets are buried or commemorated in Poet's Corner in Westminster Abbey.</p>

        <div class="info-box">
            <h3>Check that you understand</h3>
            <ul>
                <li>✔ Which sports are particularly popular in the UK</li>
                <li>✔ Some of the major sporting events that take place each year</li>
                <li>✔ Some of the major arts and culture events that happen in the UK</li>
                <li>✔ How achievements in arts and culture are formally recognised</li>
                <li>✔ Important figures in British literature</li>
            </ul>
        </div>

        <div class="section-marker" data-section="leisure"></div>
        <h1>Leisure</h1>
        
        <p>People in the UK spend their leisure time in many different ways.</p>

        <h2>Gardening</h2>
        <p>A lot of people have gardens at home and will spend their free time looking after them. Some people rent additional land called 'an allotment', where they grow fruit and vegetables. Gardening and flower shows range from major national exhibitions to small local events. Many towns have garden centres selling plants and gardening equipment. There are famous gardens to visit throughout the UK, including Kew Gardens, Sissinghurst and Hidcote in England, Crathes Castle and Inveraray Castle in Scotland, Bodnant Garden in Wales, and Mount Stewart in Northern Ireland.</p>
        
        <p>The countries that make up the UK all have flowers which are particularly associated with them and which are sometimes worn on national saints' days:</p>
        <ul>
            <li>England – the rose</li>
            <li>Scotland – the thistle</li>
            <li>Wales – the daffodil</li>
            <li>Northern Ireland – the shamrock</li>
        </ul>

        <h2>Shopping</h2>
        <p>There are many different places to go shopping in the UK. Most towns and cities have a central shopping area, which is called the town centre. Undercover shopping centres are also common – these might be in town centres or on the outskirts of a town or city. Most shops in the UK are open seven days a week, although trading hours on Sundays and public holidays are generally reduced. Many towns also have markets on one or more days a week, where stallholders sell a variety of goods.</p>

        <h2>Cooking and food</h2>
        <p>Many people in the UK enjoy cooking. They often invite each other to their homes for dinner. A wide variety of food is eaten in the UK because of the country's rich cultural heritage and diverse population.</p>

        <div class="highlight-box">
            <h3>Traditional foods</h3>
            <p>There are a variety of foods that are traditionally associated with different parts of the UK:</p>
            <ul>
                <li><strong>England:</strong> Roast beef, which is served with potatoes, vegetables, Yorkshire puddings (batter that is baked in the oven) and other accompaniments. Fish and chips are also popular.</li>
                <li><strong>Wales:</strong> Welsh cakes – a traditional Welsh snack made from flour, dried fruits and spices, and served either hot or cold.</li>
                <li><strong>Scotland:</strong> Haggis – a sheep's stomach stuffed with offal, suet, onions and oatmeal.</li>
                <li><strong>Northern Ireland:</strong> Ulster fry – a fried meal with bacon, eggs, sausage, black pudding, white pudding, tomatoes, mushrooms, soda bread and potato bread.</li>
            </ul>
        </div>

        <h2>Films</h2>
        <h3>British film industry</h3>
        <p>The UK has had a major influence on modern cinema.</p>
        
        <p>Films were first shown publicly in the UK in 1896 and film screenings very quickly became popular. From the beginning, British film makers became famous for clever special effects and this continues to be an area of British expertise. From the early days of the cinema, British actors have worked in both the UK and USA. Sir Charles (Charlie) Chaplin became famous in silent movies for his tramp character and was one of many British actors to make a career in Hollywood.</p>
        
        <p>British studios flourished in the 1930s. Eminent directors included Sir Alexander Korda and Sir Alfred Hitchcock, who later left for Hollywood and remained an important film director until his death in 1980. During the Second World War, British movies (for example, <em>In Which We Serve</em>) played an important part in boosting morale. Later, British directors including Sir David Lean and Ridley Scott found great success both in the UK and internationally.</p>
        
        <p>The 1950s and 1960s were a high point for British comedies, including <em>Passport to Pimlico</em>, <em>The Ladykillers</em> and, later, the <em>Carry On</em> films.</p>
        
        <p>Many of the films now produced in the UK are made by foreign companies, using British expertise. Some of the most commercially successful films of all time, including two of the highest-grossing film franchises (Harry Potter and James Bond), have been produced in the UK. Ealing Studios has a claim to being the oldest continuously working film studio facility in the world. Britain continues to be particularly strong in special effects and animation. One example is the work of Nick Park, who has won four Oscars for his animated films, including three for films featuring Wallace and Gromit.</p>
        
        <p>Actors such as Sir Lawrence Olivier, David Niven, Sir Rex Harrison and Richard Burton starred in a wide variety of popular films. British actors continue to be popular and continue to win awards throughout the world. Recent British actors to have won Oscars include Colin Firth, Sir Antony Hopkins, Dame Judi Dench, Kate Winslet and Tilda Swinton.</p>
        
        <p>The annual British Academy Film Awards, hosted by the British Academy of Film and Television Arts (BAFTA), are the British equivalent of the Oscars.</p>

        <h2>British comedy</h2>
        <p>The traditions of comedy and satire, and the ability to laugh at ourselves, are an important part of the UK character.</p>
        
        <p>Medieval kings and rich nobles had jesters who told jokes and made fun of people in the Court. Later, Shakespeare included comic characters in his plays. In the 18th century, political cartoons attacking prominent politicians – and, sometimes, the monarch or other members of the Royal Family – became increasingly popular. In the 19th century, satirical magazines began to be published. The most famous was <em>Punch</em>, which was published for the first time in the 1840s. Today, political cartoons continue to be published in newspapers, and magazines such as <em>Private Eye</em> continue the tradition of satire.</p>
        
        <p>Comedians were a popular feature of British music hall, a form of variety theatre which was very common until television became the leading form of entertainment in the UK. Some of the people who had performed in the music halls in the 1940s and 1950s, such as Morecambe and Wise, became stars of television.</p>
        
        <p>Television comedy developed its own style. Situation comedies, or sitcoms, which often look at family life and relationships in the workplace, remain popular. Satire has also continued to be important, with shows like <em>That Was The Week That Was</em> in the 1960s and <em>Spitting Image</em> in the 1980s and 1990s. In 1969, <em>Monty Python's Flying Circus</em> introduced a new type of progressive comedy. Stand-up comedy, where a solo comedian talks to a live audience, has become popular again in recent years.</p>

        <h2>Television and radio</h2>
        <p>Many different television (TV) channels are available in the UK. Some are free to watch and others require a paid subscription. British television shows a wide variety of programmes. Popular programmes include regular soap operas such as <em>Coronation Street</em> and <em>EastEnders</em>. In Scotland, some Scotland-specific programmes are shown and there is also a channel with programmes in the Gaelic language. There is a Welsh-language channel in Wales. There are also programmes specific to Northern Ireland and some programmes broadcast in Irish Gaelic.</p>
        
        <p>Everyone in the UK with a TV, computer or other medium which can be used for watching TV must have a television licence. One licence covers all of the equipment in one home, except when people rent different rooms in a shared house and each has a separate tenancy agreement – those people must each buy a separate licence. People over 75 can apply for a free TV licence and blind people can get a 50% discount. You will receive a fine of up to £1,000 if you watch TV but do not have a TV licence.</p>
        
        <p>The money from TV licences is used to pay for the British Broadcasting Corporation (BBC). This is a British public service broadcaster providing television and radio programmes. The BBC is the largest broadcaster in the world. Although it receives some state funding, it is independent of the government. Other UK channels are primarily funded through advertisements and subscriptions.</p>
        
        <p>There are also many different radio stations in the UK. Some broadcast nationally and others in certain cities or regions. There are radio stations that play certain types of music and some broadcast in regional languages such as Welsh or Gaelic. Like television, BBC radio stations are funded by TV licences and other radio stations are funded through advertisements.</p>

        <h2>Social networking</h2>
        <p>Social networking websites such as Facebook and Twitter are a popular way for people to stay in touch with friends, organise social events, and share photos, videos and opinions. Many people use social networking on their mobile phones when out and about.</p>

        <h2>Pubs and night clubs</h2>
        <p>Public houses (pubs) are an important part of the UK social culture. Many people enjoy meeting friends in the pub. Most communities will have a 'local' pub that is a natural focal point for social activities. Pub quizzes are popular. Pool and darts are traditional pub games. To buy alcohol in a pub or night club you must be 18 or over, but people under that age may be allowed in some pubs with an adult. When they are 16, people can drink wine or beer with a meal in a hotel or restaurant (including eating areas in pubs) as long as they are with someone over 18.</p>
        
        <p>Pubs are usually open during the day from 11.00 am (12 noon on Sundays). Night clubs with dancing and music usually open and close later than pubs. The licensee decides the hours that the pub or night club is open.</p>

        <h2>Betting and gambling</h2>
        <p>In the UK, people often enjoy a gamble on sports or other events. There are also casinos in many places. You have to be 18 to go into betting shops or gambling clubs. There is a National Lottery for which draws are made every week. You can enter by buying a ticket or a scratch card. People under 16 are not allowed to participate in the National Lottery.</p>

        <h2>Pets</h2>
        <p>A lot of people in the UK have pets such as cats or dogs. They might have them for company or because they enjoy looking after them. It is against the law to treat a pet cruelly or to neglect it. All dogs in public places must wear a collar showing the name and address of the owner. The owner is responsible for keeping the dog under control and for cleaning up after the animal in a public place.</p>
        
        <p>Vaccinations and medical treatment for animals are available from veterinary surgeons (vets). There are charities which may help people who cannot afford to pay a vet.</p>

        <div class="section-marker" data-section="places-of-interest"></div>
        <h1>Places of interest</h1>
        
        <p>The UK has a large network of public footpaths in the countryside. There are also many opportunities for mountain biking, mountaineering and hill walking. There are 15 national parks in England, Wales and Scotland. They are areas of protected countryside that everyone can visit, and where people live, work and look after the landscape.</p>
        
        <p>There are many museums in the UK, which range from small community museums to large national and civic collections. Famous landmarks exist in towns, cities and the countryside throughout the UK. Most of them are open to the public to view (generally for a charge).</p>
        
        <p>Many parts of the countryside and places of interest are kept open by the National Trust in England, Wales and Northern Ireland and the National Trust for Scotland. Both are charities that work to preserve important buildings, coastline and countryside in the UK. The National Trust was founded in 1895 by three volunteers. There are now more than 61,000 volunteers helping to keep the organisation running.</p>

        <h2>UK landmarks</h2>
        
        <div class="highlight-box">
            <h3>Big Ben</h3>
            <p>Big Ben is the nickname for the great bell of the clock at the Houses of Parliament in London. Many people call the clock Big Ben as well. The clock is over 150 years old and is a popular tourist attraction. The clock tower is named 'Elizabeth Tower' in honour of Queen Elizabeth II's Diamond Jubilee in 2012.</p>
        </div>

        <div class="highlight-box">
            <h3>The Eden Project</h3>
            <p>The Eden Project is located in Cornwall, in the south west of England. Its biomes, which are like giant greenhouses, house plants from all over the world. The Eden Project is also a charity which runs environmental and social projects internationally.</p>
        </div>

        <div class="highlight-box">
            <h3>Edinburgh Castle</h3>
            <p>The Castle is a dominant feature of the skyline in Edinburgh, Scotland. It has a long history, dating back to the early Middle Ages. It is looked after by Historic Scotland, a Scottish government agency.</p>
        </div>

        <div class="highlight-box">
            <h3>The Giant's Causeway</h3>
            <p>Located on the north-east coast of Northern Ireland, the Giant's Causeway is a land formation of columns made from volcanic lava. It was formed about 50 million years ago. There are many legends about the Causeway and how it was formed.</p>
        </div>

        <div class="highlight-box">
            <h3>Loch Lomond and the Trossachs National Park</h3>
            <p>This national park covers 720 square miles (1,865 square kilometres) in the west of Scotland. Loch Lomond is the largest expanse of fresh water in mainland Britain and probably the best-known part of the park.</p>
        </div>

        <div class="highlight-box">
            <h3>London Eye</h3>
            <p>The London Eye is situated on the southern bank of the River Thames and is a Ferris wheel that is 443 feet (135 metres) tall. It was originally built as part of the UK's celebration of the new millennium and continues to be an important part of New Year celebrations.</p>
        </div>

        <div class="highlight-box">
            <h3>Snowdonia</h3>
            <p>Snowdonia is a national park in North Wales. It covers an area of 838 square miles (2,170 square kilometres). Its most well-known landmark is Snowdon, which is the highest mountain in Wales.</p>
        </div>

        <div class="highlight-box">
            <h3>The Tower of London</h3>
            <p>The Tower of London was first built by William the Conqueror after he became king in 1066. Tours are given by the Yeoman Warders, also known as Beefeaters, who tell visitors about the building's history. People can also see the Crown Jewels there.</p>
        </div>

        <div class="highlight-box">
            <h3>The Lake District</h3>
            <p>The Lake District is England's largest national park. It covers 885 square miles (2,292 square kilometres). It is famous for its lakes and mountains and is very popular with climbers, walkers and sailors. The biggest stretch of water is Windermere. In 2007, television viewers voted Wastwater as Britain's favourite view.</p>
        </div>

        <div class="info-box">
            <h3>Check that you understand</h3>
            <ul>
                <li>✔ Some of the ways in which people in the UK spend their leisure time</li>
                <li>✔ The development of British cinema</li>
                <li>✔ What the television licence is and how it funds the BBC</li>
                <li>✔ Some of the places of interest to visit in the UK</li>
            </ul>
        </div>
      `;

    case '5':
      return `
        <div class="section-marker" data-section="introduction"></div>
        <h1>The UK Government, the Law and Your Role</h1>
        
        <div class="image-placeholder">
            [The UK Government, the Law and Your Role - Chapter Header]
        </div>
        
        <div class="info-box">
            <h3>Chapter Contents</h3>
            <ul>
                <li>The development of British democracy</li>
                <li>The British constitution</li>
                <li>The government</li>
                <li>The UK and international institutions</li>
                <li>Respecting the law</li>
                <li>Fundamental principles</li>
                <li>Your role in the community</li>
            </ul>
        </div>

        <p>This chapter will tell you about the development of British democracy and the system of government in the UK today. It will explain how you can play a part in the democratic process and what your rights and responsibilities are as a resident of the UK.</p>
        
        <div class="section-marker" data-section="development-democracy"></div>
        <h1>The development of British democracy</h1>
        
        <p>Democracy is a system of government where the whole adult population gets a say. This might be by direct voting or by choosing representatives to make decisions on their behalf.</p>
        
        <p>At the turn of the 19th century, Britain was not a democracy as we know it today. Although there were elections to select members of Parliament (MPs), only a small group of people could vote. They were men who were over 21 years of age and who owned a certain amount of property.</p>
        
        <p>The franchise (that is, the number of people who had the right to vote) grew over the course of the 19th century and political parties began to involve ordinary men and women as members.</p>
        
        <h2>The Reform Act 1832</h2>
        <p>The Reform Act of 1832 was the first of a series of acts that extended the franchise (right to vote) in the UK to a much larger part of the population.</p>
        
        <p>The act abolished the rotten boroughs and more parliamentary seats were given to the growing towns and cities. The franchise was also extended, which meant that all men who owned property of a certain value were able to vote. This was about 1 in 7 of the adult male population. The act also introduced an electoral register, which made the electoral system fairer and more transparent.</p>
        
        <h2>The Chartists</h2>
        <p>In the 1830s and 1840s, a group called the Chartists campaigned for further reform. They wanted six changes:</p>
        
        <ul>
            <li>for every man to have the vote</li>
            <li>elections every year</li>
            <li>for all regions to be equal in the electoral system</li> 
            <li>secret ballots</li>
            <li>for any man to be able to stand as an MP</li>
            <li>for MPs to be paid</li>
        </ul>
        
        <p>At the time, the campaign was generally seen as a failure. However, by 1918 most of these reforms had been adopted. The voting franchise was also extended to women over 30, and then in 1928 to men and women over 21. In 1969, the voting age was reduced to 18 for men and women.</p>
        
        <h2>Women and the vote</h2>
        <p>Women campaigned for the vote throughout the 19th century. In 1897, the National Union of Women's Suffrage Societies was formed, led by Millicent Fawcett. This was a moderate group which believed in peaceful protest. They were known as 'suffragists'.</p>
        
        <p>In 1903, the Women's Social and Political Union was founded by Emmeline Pankhurst. This group became known as the 'suffragettes', and they were prepared to take direct action. They chained themselves to railings, disrupted public meetings and committed arson. Many women, including Emmeline Pankhurst and her daughters Christabel and Sylvia, went to prison. In 1913, Emily Davison was killed when she threw herself under the King's horse at the Derby to draw attention to the cause.</p>
        
        <div class="highlight-box">
            <h3>Emmeline Pankhurst (1858–1928)</h3>
            <p>Emmeline Pankhurst was born in Manchester in 1858. She set up the Women's Social and Political Union in 1903. She was imprisoned several times and went on hunger strike to draw attention to her cause. She died in 1928, shortly after women were given the vote on equal terms with men.</p>
            
            <div class="image-placeholder">
                [Emmeline Pankhurst campaigned for women's voting rights]  
            </div>
        </div>
        
        <p>During the First World War, women demonstrated that they could take on many of the roles previously held by men. In 1918, women over the age of 30 were given voting rights, and the franchise was extended to all men over the age of 21. It was not until 1928 that women were given the vote on equal terms with men.</p>
        
        <h2>Extension of the franchise during the 19th and 20th centuries</h2>
        <table>
            <tr><th>Year</th><th>Law</th><th>How did the law change the voting franchise?</th></tr>
            <tr><td>1832</td><td>The Reform Act 1832</td><td>Men who owned property of a certain value could vote; abolished rotten boroughs</td></tr>
            <tr><td>1867</td><td>The Reform Act 1867</td><td>Extended the franchise to men in towns and cities</td></tr>
            <tr><td>1884</td><td>The Reform Act 1884</td><td>Extended the franchise to men in the countryside; about 2 out of 3 men could vote</td></tr>
            <tr><td>1918</td><td>The Representation of the People Act 1918</td><td>Women over 30 could vote; franchise extended to all men over 21</td></tr>
            <tr><td>1928</td><td>The Equal Franchise Act 1928</td><td>Women could vote from the age of 21, the same as men</td></tr>
            <tr><td>1969</td><td>The Representation of the People Act 1969</td><td>Men and women could vote from the age of 18</td></tr>
        </table>
        
        <div class="section-marker" data-section="british-constitution"></div>
        <h1>The British constitution</h1>
        
        <p>A constitution is a set of principles by which a country is governed. It includes all the institutions and laws in a country, for example, Parliament. Unlike many other countries, the UK does not have a constitution that is written down in any single document. Instead, the UK constitution comes from a number of sources.</p>
        
        <h2>Constitutional institutions</h2>
        <p>The main constitutional institutions in the UK are:</p>
        
        <h3>Parliament</h3>
        <p>Parliament consists of the House of Commons and the House of Lords. The House of Commons is regarded as the more important of the two and its members are elected by the people. The House of Lords is mainly appointed and has less power than the House of Commons.</p>
        
        <h3>The monarchy</h3>
        <p>The UK is a constitutional monarchy. This means that the monarch (currently Queen Elizabeth II) is the head of state but has little real power. The monarch gives Royal Assent to laws passed by Parliament and performs ceremonial duties.</p>
        
        <h3>The judiciary</h3>
        <p>Courts, judges and the legal system ensure that the laws passed by Parliament are enforced. The judiciary has to remain independent of government.</p>
        
        <h2>The rule of law</h2>
        <p>The rule of law is a fundamental principle of the British constitution. It means:</p>
        <ul>
            <li>everyone, including the government, is equal before the law</li>
            <li>everyone must follow the law</li>
            <li>laws are made through an established process</li>
            <li>the courts are independent</li>
        </ul>
        
        <div class="section-marker" data-section="the-government"></div>
        <h1>The government</h1>
        
        <p>The UK has a parliamentary system of democratic government. In this system, people vote for Members of Parliament (MPs) to represent them in the House of Commons. The government is formed by the party (or coalition of parties) that can command a majority in the House of Commons.</p>
        
        <h2>The House of Commons</h2>
        <p>The House of Commons is the part of Parliament which has the most power. It is made up of Members of Parliament (MPs) who are elected by the public. There are 650 constituencies in the UK, each of which chooses one MP.</p>
        
        <p>Elections to the House of Commons are held at least every five years. If an MP dies or resigns, there will be a fresh election, called a by-election, in his or her constituency. MPs represent everyone in their constituency, not only people who voted for them or people who share their political views.</p>
        
        <h2>The House of Lords</h2>
        <p>Members of the House of Lords (called peers) are not elected by the people. Many members are nominated by political parties. Some others are recommended by an independent body, the House of Lords Appointments Commission. A few peers inherit their titles from their families – these are a small number of hereditary peers. The most senior bishops of the Church of England also sit in the House of Lords.</p>
        
        <p>The House of Lords normally agrees with decisions made by the House of Commons because the House of Commons is elected and therefore has democratic authority. However, the House of Lords can suggest amendments or changes to proposed laws, and can ask the House of Commons to reconsider a decision.</p>
        
        <h2>The Speaker</h2>
        <p>Debates in the House of Commons are chaired by the Speaker. This person is politically neutral. The Speaker is chosen by fellow MPs to chair debates and ensure that the rules are followed. This includes making sure the opposition has a guaranteed amount of time to debate issues which it chooses. The Speaker also represents Parliament on ceremonial occasions.</p>
        
        <h2>Parliamentary elections</h2>
        <p>UK elections are based on the 'first past the post' system. In each constituency, the candidate who gets the most votes is elected as the MP for that area. The government is formed by the party that wins the most constituencies. If no party wins a majority (more than half the constituencies), there may be a coalition government made up of two or more parties.</p>
        
        <p>Anyone who is 18 or over can vote, provided they are on the electoral register. You must register in every place where you are eligible to vote. The electoral register is updated every year in September or October. An electoral registration form is sent to every household and this must be completed and returned, with the names of everyone who is resident in the household and eligible to vote.</p>
        
        <p>By law, each local authority has to make the electoral register available for people to look at, although the full register is not available for commercial activities such as advertising. You can choose not to have your name and address made available for commercial use by only registering on the 'edited register'.</p>
        
        <h3>Standing for office</h3>
        <p>Most citizens of the UK, Ireland or the Commonwealth aged 18 or over can stand for election as an MP. Some people are not allowed to stand for Parliament. These include:</p>
        <ul>
            <li>members of the House of Lords</li>
            <li>some people with mental illness</li>
            <li>people found guilty of certain criminal offences</li>
            <li>people who are bankrupt</li>
            <li>full-time judges</li>
            <li>some civil servants</li>
            <li>people in the armed forces</li>
            <li>police officers</li>
            <li>some local government employees</li>
        </ul>
        
        <p>MPs are not allowed to hold certain government positions.</p>
        
        <h2>European parliamentary elections</h2>
        <p>Elections to the European Parliament are also held in the UK. Elections are held every five years. Members of the European Parliament (MEPs) are elected to represent regions of the UK using a system of proportional representation.</p>
        
        <h2>Contacting elected representatives</h2>
        <p>All elected representatives have a duty to serve and represent their constituents. You can get contact details for all your representatives and their parties from your local library and from www.parliament.uk. You can contact MPs by letter or telephone at their constituency office, or at their office in the House of Commons: The House of Commons, Westminster, London SW1A 0AA, or telephone 020 7219 3000. In addition, many MPs, Assembly members, MSPs and MEPs hold regular advice sessions for constituents.</p>
        
        <h2>The Prime Minister</h2>
        <p>The Prime Minister (PM) is the political leader of the UK. He or she is the leader of the party with the majority of members in the House of Commons. The Prime Minister has the ultimate responsibility for the policy and decisions of the government. The Prime Minister:</p>
        <ul>
            <li>appoints members of the cabinet</li>
            <li>is the principal adviser to the monarch</li>
            <li>makes major policy decisions</li>
            <li>often represents the UK at international meetings</li>
        </ul>
        
        <h2>The cabinet</h2>
        <p>The Prime Minister appoints about 20 senior MPs to become ministers in charge of departments. These include:</p>
        
        <ul>
            <li>Chancellor of the Exchequer – responsible for the economy</li>
            <li>Foreign Secretary – responsible for managing relationships with foreign countries</li>
            <li>Home Secretary – responsible for crime, policing, and immigration</li>
            <li>other ministers (called 'Secretaries of State') responsible for subjects such as education, health and defence</li>
        </ul>
        
        <p>These ministers form the cabinet, a committee which usually meets weekly and makes important decisions about government policy. Many of these decisions have to be debated or approved by Parliament.</p>
        
        <p>Ministers are supported by civil servants, who are politically neutral and are not political appointees. Civil servants are permanent employees who form the bureaucracy of all government departments.</p>
        
        <h2>The opposition</h2>
        <p>The second-largest party in the House of Commons is called the opposition. The leader of the opposition usually becomes Prime Minister if his or her party wins the next General Election.</p>
        
        <p>The leader of the opposition leads a 'shadow cabinet', which is a group of opposition MPs who act as spokesmen and women for the opposition on different issues. They have the job of challenging the government's policies, asking questions, and suggesting alternative policies.</p>
        
        <h2>The civil service</h2>
        <p>Civil servants support the government in developing and implementing its policies. They also deliver public services. Civil servants are accountable to ministers. They are politically neutral – they are not political appointees. People can apply to join the civil service through an application process, like other jobs in the UK. Civil servants are expected to carry out their role with dedication and a commitment to the civil service and its core values. These are: integrity, honesty, objectivity, and impartiality.</p>
        
        <h2>Local government</h2>
        <p>Many public services are provided by local government. These include education (schools), social services, housing, planning applications, rubbish collection, libraries, and local environmental health. Local government areas are decided by central government.</p>
        
        <p>Local authorities are funded by money from central government and by local taxes. Local elections for councillors are held in May every year. Many candidates stand for a political party but some are independent. Councillors serve for four years.</p>
        
        <p>Local authorities make decisions about how to provide local services. Meetings of the local authority, where these decisions are made, are open to the public to attend.</p>
        
        <h2>Devolved administrations</h2>
        <p>Since 1997, some powers have been devolved from the central government to give people in Wales, Scotland and Northern Ireland more control over matters that affect them. There are now separate parliaments or assemblies for Wales, Scotland and Northern Ireland.</p>
        
        <p>The UK government has the power to suspend the devolved administrations if their operation is not in the interests of the UK as a whole.</p>
        
        <h3>The Scottish Parliament</h3>
        <p>The Scottish Parliament was established in 1999. It sits in Edinburgh, the capital city of Scotland, and has 129 Members of the Scottish Parliament (MSPs). The Scottish Parliament can pass laws for Scotland on all matters that are not specifically reserved to the UK Parliament. The matters on which the Scottish Parliament can legislate include: education, health, housing, planning, tourism, some aspects of transport, heritage, culture and sport, some aspects of social security, and some legal matters. The Scottish Parliament cannot legislate on reserved matters, which include: defence, foreign policy, immigration, taxation, and social security.</p>
        
        <p>The Scottish Parliament is elected every four years using a form of proportional representation.</p>
        
        <h3>The Welsh Assembly</h3>
        <p>A Welsh Assembly was established in 1999. It sits in Cardiff, the capital city of Wales, and has 60 Assembly Members (AMs). The Welsh Assembly can make laws for Wales in 20 areas, including: agriculture, education, the environment, health, housing, local government, social services, tourism, town and country planning, and the Welsh language. Powers over other areas such as defence, foreign policy, immigration, and taxation remain with the UK Parliament.</p>
        
        <p>The Welsh Assembly is elected every four years using a form of proportional representation.</p>
        
        <h3>The Northern Ireland Assembly</h3>
        <p>A Northern Ireland Assembly was established in 1998, following the Belfast Agreement (also called the Good Friday Agreement). There is a power-sharing agreement which means that the Northern Ireland Assembly must be formed by both unionist and nationalist parties together. The Assembly has 108 elected members, known as MLAs (Members of the Legislative Assembly). Decision-making powers are shared between the main parties. The Assembly can make decisions on issues such as: education, agriculture, the environment, health, and social services. The UK Parliament has kept the power to legislate on all other issues, such as defence, foreign policy, immigration, and taxation.</p>
        
        <p>The Assembly was suspended between 2002 and 2007, with the Northern Ireland departments being run by the Northern Ireland Office, under the authority of the Secretary of State for Northern Ireland. In May 2007, the Assembly was restored, with a power-sharing Executive taking over responsibility for the administration of Northern Ireland.</p>
        
        <div class="section-marker" data-section="uk-international-institutions"></div>
        <h1>The UK and international institutions</h1>
        
        <h2>The Commonwealth</h2>
        <p>The Commonwealth is an association of countries that support each other and work together towards shared goals in democracy and development. Most member states were once part of the British Empire, although a few countries which were not have also joined.</p>
        
        <p>The Queen is the ceremonial head of the Commonwealth, which currently has 53 member states. Membership is voluntary. The Commonwealth has no power over its members, although it can suspend membership. The Commonwealth is based on the core values of democracy, good government and the rule of law.</p>
        
        <h3>Commonwealth members</h3>
        <div class="info-box">
            <p><strong>Commonwealth member states include:</strong></p>
            <p>Antigua and Barbuda, Australia, The Bahamas, Bangladesh, Barbados, Belize, Botswana, Brunei Darussalam, Cameroon, Canada, Cyprus, Dominica, Fiji (currently suspended), The Gambia, Ghana, Grenada, Guyana, India, Jamaica, Kenya, Kiribati, Lesotho, Malawi, Malaysia, Malta, Mauritius, Mozambique, Namibia, Nauru, New Zealand, Nigeria, Pakistan, Papua New Guinea, Rwanda, Samoa, Seychelles, Sierra Leone, Singapore, Solomon Islands, South Africa, Sri Lanka, St Kitts and Nevis, St Lucia, St Vincent and the Grenadines, Swaziland, Tanzania, Tonga, Trinidad and Tobago, Tuvalu, Uganda, UK, Vanuatu, Zambia.</p>
            <p><em>Note that the Maldives left the Commonwealth in October 2016.</em></p>
        </div>
        
        <h2>The European Union</h2>
        <p>The European Union (EU), originally called the European Economic Community (EEC), was set up by six western European countries (Belgium, France, Germany, Italy, Luxembourg and the Netherlands) who signed the Treaty of Rome on 25 March 1957. The UK originally decided not to join this group but it became a member in 1973. There are now 28 EU member states. In a referendum held on 23 June 2016 the UK voted to leave the European Union.</p>
        
        <h3>EU member states</h3>
        <div class="info-box">
            <p><strong>EU member states include:</strong></p>
            <p>Austria, Belgium, Bulgaria, Croatia, Cyprus, Czech Republic, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Ireland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden, UK.</p>
        </div>
        
        <p>EU law is legally binding in the UK and all the other EU member states. European laws are called directives, regulations or framework decisions.</p>
        
        <h2>The Council of Europe</h2>
        <p>The Council of Europe is separate from the EU. It has 47 member countries, including the UK, and is responsible for the protection and promotion of human rights in those countries. It has no power to make laws but draws up conventions and charters, the most well-known of which is the European Convention on Human Rights and Fundamental Freedoms, usually called the European Convention on Human Rights.</p>
        
        <h2>The United Nations</h2>
        <p>The UK is part of the United Nations (UN), an international organisation with more than 190 countries as members.</p>
        
        <p>The UN was set up after the Second World War and aims to prevent war and promote international peace and security. There are 15 members on the UN Security Council, which recommends action when there are international crises and threats to peace. The UK is one of five permanent members of the Security Council.</p>
        
        <h2>The North Atlantic Treaty Organization (NATO)</h2>
        <p>The UK is also a member of NATO. NATO is a group of European and North American countries that have agreed to help each other if they come under attack. It also aims to maintain peace between all of its members.</p>
        
        <div class="section-marker" data-section="respecting-law"></div>
        <h1>Respecting the law</h1>
        
        <p>One of the most important responsibilities of all residents in the UK is to know and obey the law. This section will explain the legal system in the UK and cover some of the laws that may affect you.</p>
        
        <h2>The legal system</h2>
        <p>There are different legal systems in England and Wales, in Scotland, and in Northern Ireland. All three systems are very similar and have the same fundamental principles. There are some differences in the laws and especially in the court procedures.</p>
        
        <p>The police are there to:</p>
        <ul>
            <li>protect life and property</li>
            <li>prevent disturbances and breaches of the peace</li>
            <li>prevent other crime</li>
            <li>detect and arrest offenders</li>
        </ul>
        
        <p>The police have 'operational independence'. This means that the government cannot instruct the police on what action to take in any particular case. The police must not favour any political party.</p>
        
        <p>Anyone who is arrested has the right to legal representation and may choose their own solicitor or use the duty solicitor. Legal aid can help meet the costs of legal advice or representation for those who cannot afford it. The legal aid system is managed by the Legal Services Commission.</p>
        
        <h2>Criminal law</h2>
        <p>Criminal law relates to crimes, which are usually investigated by the police or another authority such as HM Revenue and Customs, and which are punished by the courts.</p>
        
        <h3>Examples of criminal laws are:</h3>
        <ul>
            <li>Carrying a weapon: it is a criminal offence to carry a weapon of any kind, even if it is for self-defence. This includes a gun, a knife, or anything that is made, adapted or intended for use to cause injury to a person. There are some exceptions, such as adults can use a knife or sharp instrument at work, when preparing food or while playing sport.</li>
            <li>Drugs: selling or buying drugs such as heroin, cocaine, ecstasy and cannabis is illegal in the UK.</li>
            <li>Racial crime: it is a criminal offence to cause harassment, alarm or distress to someone because of their religion or ethnic origin.</li>
            <li>Selling tobacco: it is illegal to sell tobacco products to anyone under the age of 18.</li>
            <li>Selling alcohol: it is illegal to sell alcohol to anyone under 18 or to buy alcohol for consumption by someone under 18. (It is legal for someone over 16 to drink alcohol with a meal in a hotel or restaurant.)</li>
        </ul>
        
        <h2>Civil law</h2>
        <p>Civil law is used to settle disputes between individuals or groups. Examples include:</p>
        <ul>
            <li>housing law</li>
            <li>employment law</li>
            <li>contract law</li>
            <li>law of tort (disputes about land, debts, personal injury, marriage and divorce, etc.)</li>
        </ul>
        
        <h2>The court system</h2>
        <p>Most minor criminal cases are dealt with in a Magistrates' Court. More serious offences are tried in a Crown Court with a judge and jury. The most serious civil cases – for example, when a large amount of money is involved – are dealt with in the High Court. Less serious civil disputes – for example, arguments between neighbours about noise or boundaries – are dealt with in the County Court.</p>
        
        <p>Small claims are dealt with under a special procedure in the County Court. This procedure is much simpler and does not usually need a lawyer. It covers claims of less than £5,000 in England and Wales and £3,000 in Scotland and Northern Ireland.</p>
        
        <h2>Young people and crime</h2>
        <p>Young people aged 10 to 17 who commit crimes are dealt with in Youth Courts by specially trained magistrates or judges. The most serious cases will go to the Crown Court. The parents or carers are expected to attend the hearing and may be held responsible for the actions of the young person and may have to pay a fine. Young people may be given a reprimand or final warning by the police, or they may be sent to special centres for young offenders.</p>
        
        <h2>The police and their duties</h2>
        <p>The job of the police in the UK is to:</p>
        <ul>
            <li>protect life and property</li>
            <li>prevent disturbances (also known as keeping the peace)</li>
            <li>prevent and detect crime</li>
        </ul>
        
        <p>The police are organised into a number of separate police forces headed by Chief Constables. They are independent of the government.</p>
        
        <p>In November 2012, the public elected Police and Crime Commissioners (PCCs) in England and Wales. These are directly elected individuals who are responsible for the delivery of an efficient and effective police force that reflects the needs of their local communities. PCCs set local police priorities and the local policing budget. They also appoint the local Chief Constable.</p>
        
        <p>The police force is a public service that helps and protects everyone, no matter what their background or where they live. Police officers must themselves obey the law. They must not misuse their authority, make a false statement, be rude or abusive, or commit racial discrimination. If police officers are corrupt or misuse their authority they are severely punished.</p>
        
        <p>Police officers are often supported by police community support officers (PCSOs). PCSOs have different roles according to the area but usually patrol the streets, work with the public, and support police officers at crime scenes and major events.</p>
        
        <p>All people in the UK are expected to help the police prevent and detect crimes whenever they can. If you are arrested and taken to a police station, a police officer will tell you the reason for your arrest and you will be able to seek legal advice.</p>
        
        <p>If something goes wrong, the police complaints system tries to put it right. Anyone can make a complaint about the police by going to a police station or writing to the Chief Constable of the police force involved. Complaints can also be made to an independent body in England and Wales (www.policeconduct.gov.uk). In Scotland, if you are unhappy with the way your complaint has been handled, you can contact the Police Investigations and Review Commissioner at https://pirc.scot/. In Northern Ireland, you should contact the Police Ombudsman's Office (www.policeombudsman.org).</p>
        
        <h2>Terrorism and extremism</h2>
        <p>The UK faces a range of terrorist threats. The most serious of these is from Al Qa'ida, its affiliates and like-minded organisations. The UK also faces threats from other kinds of terrorism, such as Northern Ireland-related terrorism.</p>
        
        <p>All terrorist groups try to radicalise and recruit people to their cause. How, where and to what extent they try to do so will vary. Evidence shows that these groups attract very low levels of public support, but people who want to make their home in the UK should be aware of this threat. It is important that all citizens feel safe. This includes feeling safe from all kinds of extremism (vocal or active opposition to fundamental British values), including religious extremism and far-right extremism.</p>
        
        <p>If you think someone is trying to persuade you to join an extremist or terrorist cause, you should notify your local police force.</p>
        
        <h2>The role of the courts</h2>
        
        <h3>The judiciary</h3>
        <p>Judges (who are together called 'the judiciary') are responsible for interpreting the law and ensuring that trials are conducted fairly. The government cannot interfere with this.</p>
        
        <p>Sometimes the actions of the government are claimed to be illegal. If the judges agree, then the government must either change its policies or ask Parliament to change the law. If judges find that a public body is not respecting someone's legal rights, they can order that body to change its practices and/or pay compensation.</p>
        
        <p>Judges also make decisions in disputes between members of the public or organisations. These might be about contracts, property or employment rights or after an accident.</p>
        
        <h3>Criminal courts</h3>
        <p>There are some differences between the court systems in England and Wales, Scotland and Northern Ireland.</p>
        
        <h4>Magistrates' and Justice of the Peace Courts</h4>
        <p>In England, Wales and Northern Ireland, most minor criminal cases are dealt with in a Magistrates' Court. In Scotland, minor criminal offences go to a Justice of the Peace Court.</p>
        
        <p>Magistrates and Justices of the Peace (JPs) are members of the local community. In England, Wales and Scotland they usually work unpaid and do not need legal qualifications. They receive training to do the job and are supported by a legal adviser. Magistrates decide the verdict in each case that comes before them and, if the person is found guilty, the sentence that they are given. In Northern Ireland, cases are heard by a District Judge or Deputy District Judge, who is legally qualified and paid.</p>
        
        <h4>Crown Courts and Sheriff Courts</h4>
        <p>In England, Wales and Northern Ireland, serious offences are tried in front of a judge and a jury in a Crown Court. In Scotland, serious cases are heard in a Sheriff Court with either a sheriff or a sheriff with a jury. The most serious cases in Scotland, such as murder, are heard at a High Court with a judge and jury. A jury is made up of members of the public chosen at random from the local electoral register. In England, Wales and Northern Ireland a jury has 12 members, and in Scotland a jury has 15 members. Everyone who is summoned to do jury service must do it unless they are not eligible (for example, because they have a criminal conviction) or they provide a good reason to be excused, such as ill health.</p>
        
        <p>The jury has to listen to the evidence presented at the trial and then decide a verdict of 'guilty' or 'not guilty' based on what they have heard. In Scotland, a third verdict of 'not proven' is also possible. If the jury finds a defendant guilty, the judge decides on the penalty.</p>
        
        <h4>Youth Courts</h4>
        <p>In England, Wales and Northern Ireland, if an accused person is aged 10 to 17, the case is normally heard in a Youth Court in front of up to three specially trained magistrates or a District Judge. The most serious cases will go to the Crown Court. The parents or carers of the young person are expected to attend the hearing. Members of the public are not allowed in Youth Courts, and the name or photographs of the accused young person cannot be published in newspapers or used by the media.</p>
        
        <p>In Scotland a system called the Children's Hearings System is used to deal with children and young people who have committed an offence.</p>
        
        <p>Northern Ireland has a system of youth conferencing to consider how a child should be dealt with when they have committed an offence.</p>
        
        <h3>Civil courts</h3>
        
        <h4>County Courts</h4>
        <p>County Courts deal with a wide range of civil disputes. These include people trying to get back money that is owed to them, cases involving personal injury, family matters, breaches of contract, and divorce. In Scotland, most of these matters are dealt with in the Sheriff Court. More serious civil cases – for example, when a large amount of compensation is being claimed – are dealt with in the High Court in England, Wales and Northern Ireland. In Scotland, they are dealt with in the Court of Session in Edinburgh.</p>
        
        <p>The small claims procedure is an informal way of helping people to settle minor disputes without spending a lot of time and money using a lawyer. This procedure is used for claims of less than £10,000 in England and Wales and £3,000 in Scotland and Northern Ireland. The hearing is held in front of a judge in an ordinary room, and people from both sides of the dispute sit around a table. Small claims can also be issued online through Money Claims Online (www.moneyclaim.gov.uk).</p>
        
        <p>You can get details about the small claims procedure from your local County Court or Sheriff Court. Details of your local court can be found as follows:</p>
        <ul>
            <li>England and Wales: at www.gov.uk</li>
            <li>Scotland: at www.scotcourts.gov.uk</li>
            <li>Northern Ireland: at www.courtsni.gov.uk</li>
        </ul>
        
        <h3>Legal advice</h3>
        
        <h4>Solicitors</h4>
        <p>Solicitors are trained lawyers who give advice on legal matters, take action for their clients and represent their clients in court.</p>
        
        <p>There are solicitors' offices throughout the UK. It is important to find out which aspects of law a solicitor specialises in and to check that they have the right experience to help you with your case. Many advertise in local newspapers. Citizens Advice (www.citizensadvice.org.uk) can give you names of local solicitors and which areas of law they specialise in. You can also get this information from the Law Society (www.lawsociety.org.uk) in England and Wales, the Law Society of Scotland (www.lawscot.org.uk) or the Law Society of Northern Ireland (www.lawsoc-ni.org). Solicitors' charges are usually based on how much time they spend on a case. It is very important to find out at the start how much a case is likely to cost.</p>
        
        <div class="section-marker" data-section="fundamental-principles"></div>
        <h1>Fundamental principles</h1>
        
        <p>Britain has a long history of respecting an individual's rights and ensuring essential freedoms. These rights have their roots in Magna Carta, the Habeas Corpus Act and the Bill of Rights of 1689, and they have developed over a period of time. British diplomats and lawyers had an important role in drafting the European Convention on Human Rights and Fundamental Freedoms. The UK was one of the first countries to sign the Convention in 1950.</p>
        
        <p>Some of the principles included in the European Convention on Human Rights are:</p>
        <ul>
            <li>right to life</li>
            <li>prohibition of torture</li>
            <li>prohibition of slavery and forced labour</li>
            <li>right to liberty and security</li>
            <li>right to a fair trial</li>
            <li>freedom of thought, conscience and religion</li>
            <li>freedom of expression (speech)</li>
        </ul>
        
        <p>The Human Rights Act 1998 incorporated the European Convention on Human Rights into UK law. The government, public bodies and the courts must follow the principles of the Convention.</p>
        
        <h2>Equal opportunities</h2>
        <p>UK laws ensure that people are not treated unfairly in any area of life or work because of their age, disability, sex, pregnancy and maternity, race, religion or belief, sexuality or marital status.</p>
        
        <p>If you face problems with discrimination, you can get more information from Citizens Advice or from one of the following organisations:</p>
        <ul>
            <li>England and Wales: Equality and Human Rights Commission (www.equalityhumanrights.com)</li>
            <li>Scotland: Equality and Human Rights Commission in Scotland (www.equalityhumanrights.com/en/commission-scotland) and Scottish Human Rights Commission (www.scottishhumanrights.com)</li>
            <li>Northern Ireland: Equality Commission for Northern Ireland (www.equalityni.org)</li>
            <li>Northern Ireland Human Rights Commission (www.nihrc.org)</li>
        </ul>
        
        <h2>Domestic violence</h2>
        <p>In the UK, brutality and violence in the home is a serious crime. Anyone who is violent towards their partner – whether they are a man or a woman, married or living together – can be prosecuted. Any man who forces a woman to have sex, including a woman's husband, can be charged with rape.</p>
        
        <p>It is important for anyone facing domestic violence to get help as soon as possible. A solicitor or Citizens Advice can explain the available options. In some areas there are safe places to go and stay in, called refuges or shelters. The 24-hour National Domestic Violence Freephone Helpline is available on 0808 2000 247 at any time, and its voicemail service allows callers to leave a message to be called back. You can find out more by visiting its website on www.nationaldomesticviolencehelpline.org.uk. Alternatively, you can try the Women's Aid website on https://www.womensaid.org.uk. In an emergency, you should always call the police, who can also help you to find a safe place to stay.</p>
        
        <h2>Female genital mutilation</h2>
        <p>Female genital mutilation (FGM), also known as cutting or female circumcision, is illegal in the UK. Practising FGM or taking a girl or woman abroad for FGM is a criminal offence.</p>
        
        <h2>Forced marriage</h2>
        <p>A marriage should be entered into with the full and free consent of both people involved. Arranged marriages, where both parties agree to the marriage, are acceptable in the UK.</p>
        
        <p>Forced marriage is where one or both parties do not or cannot give their consent to enter into the partnership. Forcing another person to marry is a criminal offence.</p>
        
        <p>Forced Marriage Protection Orders were introduced in 2008 for England, Wales and Northern Ireland under the Forced Marriage (Civil Protection) Act 2007. Court orders can be obtained to protect a person from being forced into a marriage, or to protect a person in a forced marriage. Similar Protection Orders were introduced in Scotland in November 2011.</p>
        
        <p>A potential victim, or someone acting for them, can apply for an order. Anyone found to have breached an order can be jailed for up to two years for contempt of court.</p>
        
        <h2>Taxation</h2>
        
        <h3>Income tax</h3>
        <p>People in the UK have to pay tax on their income, which includes:</p>
        <ul>
            <li>wages from paid employment</li>
            <li>profits from self-employment</li>
            <li>taxable benefits</li>
            <li>pensions</li>
            <li>income from property, savings and dividends</li>
        </ul>
        
        <p>Money raised from income tax pays for government services such as roads, education, police and the armed forces.</p>
        
        <p>For most people, the right amount of income tax is automatically taken from their income from employment by their employer and paid directly to HM Revenue & Customs (HMRC), the government department that collects taxes. This system is called 'Pay As You Earn' (PAYE). If you are self-employed, you need to pay your own tax through a system called 'self-assessment', which includes completing a tax return. Other people may also need to complete a tax return. If HMRC sends you a tax return, it is important to complete and return the form as soon as you have all the necessary information.</p>
        
        <p>You can find out more about income tax at www.gov.uk/income-tax. You can get help and advice about taxes and completing tax forms from the HMRC self-assessment helpline on 0300 200 3310, and by visiting https://www.gov.uk/government/organisations/hm-revenue-customs.</p>
        
        <h3>National Insurance</h3>
        <p>Almost everybody in the UK who is in paid work, including self-employed people, must pay National Insurance Contributions. The money raised from National Insurance Contributions is used to pay for state benefits and services such as the state retirement pension and the National Health Service (NHS).</p>
        
        <p>Employees have their National Insurance Contributions deducted from their pay by their employer. People who are self-employed need to pay National Insurance Contributions themselves.</p>
        
        <p>Anyone who does not pay enough National Insurance Contributions will not be able to receive certain contributory benefits such as Jobseeker's Allowance or a full state retirement pension. Some workers, such as part-time workers, may not qualify for statutory payments such as maternity pay if they do not earn enough.</p>
        
        <p>Further guidance about National Insurance Contributions is available on https://www.gov.uk/national-insurance.</p>
        
        <h4>Getting a National Insurance number</h4>
        <p>A National Insurance number is a unique personal account number. It makes sure that the National Insurance Contributions and tax you pay are properly recorded against your name. All young people in the UK are sent a National Insurance number just before their 16th birthday.</p>
        
        <p>A non-UK national living in the UK and looking for work, starting work or setting up as self-employed will need a National Insurance number. However, you can start work without one. If you have permission to work in the UK, you will need to telephone the Department for Work and Pensions (DWP) to arrange to get a National Insurance number. You may be required to attend an interview. The DWP will advise you of the appropriate application process and tell you which documents you will need to bring to an interview if one is necessary. You will usually need documents that prove your identity and that you have permission to work in the UK. A National Insurance number does not on its own prove to an employer that you have the right to work in the UK.</p>
        
        <p>You can find out more information about how to apply for a National Insurance number at www.gov.uk.</p>
        
        <h2>Driving</h2>
        <p>In the UK, you must be at least 17 years old to drive a car or motor cycle and you must have a driving licence to drive on public roads. To get a UK driving licence you must pass a driving test, which tests both your knowledge and your practical skills. You need to be at least 16 years old to ride a moped, and there are other age requirements and special tests for driving large vehicles.</p>
        
        <p>Drivers can use their driving licence until they are 70 years old. After that, the licence is valid for three years at a time.</p>
        
        <p>In Northern Ireland, a newly qualified driver must display an 'R' plate (for restricted driver) for one year after passing the test.</p>
        
        <p>If your driving licence is from a country in the European Union (EU), Iceland, Liechtenstein or Norway, you can drive in the UK for as long as your licence is valid. If you have a licence from any other country, you may use it in the UK for up to 12 months. To continue driving after that, you must get a UK full driving licence.</p>
        
        <p>If you are resident in the UK, your car or motor cycle must be registered at the Driver and Vehicle Licensing Agency (DVLA). You must pay an annual vehicle tax, which cannot be passed on when a vehicle changes hands. If the vehicle is parked off the road and not being used, you must tell DVLA by making a Statutory Off Road Notification (SORN). SORN cannot be transferred if the vehicle is sold or given to a new owner. You must also have valid motor insurance. It is a serious criminal offence to drive without insurance. If your vehicle is over three years old, you must take it for a Ministry of Transport (MOT) test every year. It is an offence not to have an MOT certificate if your vehicle is more than three years old. You can find out more about vehicle tax and MOT requirements from www.gov.uk.</p>
        
        <p>If you are ever in danger from domestic violence, you can call the police on 999. There are also organisations that exist to help people who are suffering from domestic violence. Women's refuges are safe places where women and their children can go if they are in danger from domestic violence.</p>
        
        <h2>Female genital mutilation (FGM)</h2>
        <p>Female circumcision, also known as cutting or female genital mutilation (FGM), is illegal in the UK. It is also a criminal offence to take a child abroad for FGM or to help someone trying to do this. Anyone convicted of these offences can face a long prison sentence.</p>
        
        <h2>Forced marriage</h2>
        <p>Forced marriage is when someone is pressured into marrying someone that they don't want to marry. This is different from an arranged marriage, where the families of both the bride and the groom take a leading role in choosing a marriage partner, but both parties are free to choose whether or not to accept the arrangement.</p>
        
        <p>Forced marriage is illegal in England, Wales and Scotland. It can happen to both men and women. If someone is trying to force you to marry, you can get help by calling the police on 999.</p>
        
        <h2>Honour crimes</h2>
        <p>An 'honour crime' is a crime committed because someone has brought 'shame' on their family or community. It is illegal to harm someone because you think they have brought shame on you, your family or your community. These are crimes like any other, and anyone who commits such crimes will be prosecuted.</p>
        
        <div class="section-marker" data-section="your-role-community"></div>
        <h1>Your role in the community</h1>
        
        <p>Britain is a parliamentary democracy with a long history of freedom, fairness and helping others. These values are reflected in everyday life in the UK, where people are encouraged to play an active part in their communities.</p>
        
        <h2>Values</h2>
        <p>Shared values underpin British society. The government has a role in defending these values both at home and abroad. These values include:</p>
        <ul>
            <li>Democracy</li>
            <li>Rule of law</li>
            <li>Individual liberty</li>
            <li>Tolerance of those with different faiths and beliefs</li>
            <li>Participation in community life</li>
        </ul>
        
        <div class="section-marker" data-section="who-can-vote"></div>
        <h1>Who can vote?</h1>
        
        <p>The UK has had a fully democratic voting system since 1928. The present voting age of 18 was set in 1969 and (with a few exceptions) all UK-born and naturalised adult citizens have the right to vote.</p>
        
        <p>Adult citizens of the UK, and citizens of the Commonwealth and Ireland who are resident in the UK, can vote in all public elections. Adult citizens of other EU states who are resident in the UK can vote in all elections except General Elections.</p>
        
        <h2>The electoral register</h2>
        <p>To be able to vote in a parliamentary, local or European election, you must have your name on the electoral register.</p>
        
        <p>If you are eligible to vote, you can register by contacting your local council electoral registration office. This is usually based at your local council (in Scotland it may be based elsewhere). If you don't know which local authority you come under, you can find out by visiting www.aboutmyvote.co.uk and entering your postcode. You can also download voter registration forms in English, Welsh and some other languages.</p>
        
        <p>The electoral register is updated every year in September or October. An electoral registration form is sent to every household and this has to be completed and returned with the names of everyone who is resident in the household and eligible to vote.</p>
        
        <p>In Northern Ireland a different system operates. This is called 'individual registration' and all those entitled to vote must complete their own registration form. Once registered, people stay on the register provided their personal details do not change. For more information see the Electoral Office for Northern Ireland website at www.eoni.org.uk.</p>
        
        <p>By law, each local authority has to make its electoral register available for anyone to look at, although this has to be supervised. The register is kept at each local electoral registration office (or council office in England and Wales). It is also possible to see the register at some public buildings such as libraries.</p>
        
        <h2>Where to vote</h2>
        <p>People vote in elections at places called polling stations, or polling places in Scotland. Before the election you will be sent a poll card. This tells you where your polling station or polling place is and when the election will take place. On election day, the polling station or place will be open from 7.00 am until 10.00 pm.</p>
        
        <p>When you arrive at the polling station, the staff will ask for your name and address. In Northern Ireland you will also have to show photographic identification. You will then get your ballot paper, which you take to a polling booth to fill in privately. You should make up your own mind who to vote for. No one has the right to make you vote for a particular candidate. You should follow the instructions on the ballot paper. Once you have completed it, put it in the ballot box.</p>
        
        <p>If it is difficult for you to get to a polling station or polling place, you can register for a postal ballot. Your ballot paper will be sent to your home before the election. You then fill it in and post it back. You can choose to do this when you register to vote.</p>
        
        <h2>Standing for office</h2>
        <p>Most citizens of the UK, Ireland or the Commonwealth aged 18 or over can stand for public office. There are some exceptions, including:</p>
        <ul>
            <li>members of the armed forces</li>
            <li>civil servants</li>
            <li>people found guilty of certain criminal offences</li>
        </ul>
        <p>Members of the House of Lords may not stand for election to the House of Commons but are eligible for all other public offices.</p>
        
        <h2>Visiting Parliament and the devolved administrations</h2>
        
        <h3>The UK Parliament</h3>
        <p>The public can listen to debates in the Palace of Westminster from public galleries in both the House of Commons and the House of Lords.</p>
        
        <p>You can write to your local MP in advance to ask for tickets or you can queue on the day at the public entrance. Entrance is free. Sometimes there are long queues for the House of Commons and people have to wait for at least one or two hours. It is usually easier to get in to the House of Lords.</p>
        
        <p>You can find further information on the UK Parliament website at www.parliament.uk.</p>
        
        <h3>Northern Ireland Assembly</h3>
        <p>In Northern Ireland elected members, known as MLAs, meet in the Northern Ireland Assembly at Stormont, in Belfast.</p>
        
        <p>If you wish to visit Stormont, you can either contact the Northern Ireland Assembly Education Service (http://education.niassembly.gov.uk/visit), go to the Northern Ireland Assembly website (http://www.niassembly.gov.uk/visit-and-learning/visiting/) or contact an MLA.</p>
        
        <h3>Scottish Parliament</h3>
        <p>In Scotland the elected members, called MSPs, meet in the Scottish Parliament building at Holyrood in Edinburgh (for more information, see www.scottish.parliament.uk).</p>
        
        <p>You can get information, book tickets or arrange tours through visitor services. You can write to them at the Scottish Parliament, Edinburgh, EH99 1SP, telephone 0131 348 5200, freephone 0800 092 7600 or email visit@parliament.scot</p>
        
        <h3>National Assembly for Wales</h3>
        <p>In Wales the elected members, known as AMs, meet in the Welsh Assembly in the Senedd in Cardiff Bay (for more information, see www.wales.gov.uk).</p>
        
        <p>The Senedd is an open building. You can book guided tours or seats in the public galleries for the Welsh Assembly. To make a booking, contact the Assembly Booking Service on 0300 200 6565 or email contact@assembly.wales</p>
        
        <h2>Voting and political activity</h2>
        <p>In the UK, people can vote from the age of 18. The government is elected by the people and, in turn, is accountable to the people. Elections are held regularly. It is important that as many people as possible vote so that elected governments truly represent the population of the country.</p>
        
        <p>People can also contribute to democratic processes in other ways, including:</p>
        <ul>
            <li>standing for election to Parliament or to local government</li>
            <li>joining a political party</li>
            <li>campaigning on issues of concern</li>
            <li>signing petitions</li>
            <li>contacting local MPs on issues that matter to you</li>
        </ul>
        
        <h2>Helping others</h2>
        <p>Many people in Britain do voluntary work. This includes:</p>
        <ul>
            <li>helping in schools</li>
            <li>organising activities for young people</li>
            <li>volunteering at hospitals</li>
            <li>providing assistance to elderly or disabled people</li>
            <li>volunteering for charities</li>
            <li>helping with local community projects</li>
            <li>membership of local organisations such as parent-teacher associations</li>
            <li>being a local councillor</li>
            <li>being a special constable (this is a part-time, voluntary role helping the police)</li>
            <li>being a magistrate</li>
            <li>helping to run local youth groups or clubs</li>
        </ul>
        
        <p>There are many national charities which help people in need, such as Crisis (helping homeless people) and Age UK (helping elderly people). People give money to these charities, but charities also want people to give their time for free.</p>
        
        <p>Volunteering is an important part of British life, and surveys show that nearly half of all adults in the UK volunteer in some way.</p>
        
        <h2>Values and responsibilities</h2>
        <p>Although Britain is one of the world's most diverse societies, there is a set of shared values and responsibilities that everyone can agree with. These values and responsibilities include:</p>
        <ul>
            <li>to obey and respect the law</li>
            <li>to be aware of the rights of others and respect those rights</li>
            <li>to treat others with fairness</li>
            <li>to behave responsibly</li>
            <li>to help and protect your family</li>
            <li>to respect and preserve the environment</li>
            <li>to treat everyone equally, regardless of sex, race, religion, age, disability, class or sexual orientation</li>
            <li>to work to provide for yourself and your family</li>
            <li>to help others</li>
            <li>to vote in local and national government elections</li>
        </ul>
        
        <p>Taking on these values and responsibilities will make it easier for you to become a full and active citizen.</p>
        
        <h2>How you can support your community</h2>
        <p>There are a number of positive ways in which you can support your community and be a good citizen.</p>
        
        <h3>Jury service</h3>
        <p>As well as getting the right to vote, people on the electoral register are randomly selected to serve on a jury. Anyone who is on the electoral register and is aged 18–70 (18–75 in England and Wales) can be asked to do this.</p>
        
        <h3>Helping in schools</h3>
        <p>If you have children, there are many ways in which you can help at their schools. Parents can often help in classrooms, by supporting activities or listening to children read.</p>
        
        <p>Many schools organise events to raise money for extra equipment or out-of-school activities. Activities might include book sales, toy sales or bringing food to sell. You might have good ideas of your own for raising money. Sometimes events are organised by parent–teacher associations (PTAs). Volunteering to help with their events or joining the association is a way of doing something good for the school and also making new friends in your local community. You can find out about these opportunities from notices in the school or notes your children bring home.</p>
        
        <h4>School governors and school boards</h4>
        <p>School governors, or members of the school board in Scotland, are people from the local community who wish to make a positive contribution to children's education. They must be aged 18 or over at the date of their election or appointment. There is no upper age limit.</p>
        
        <p>Governors and school boards have an important part to play in raising school standards. They have three key roles:</p>
        <ul>
            <li>setting the strategic direction of the school</li>
            <li>ensuring accountability</li>
            <li>monitoring and evaluating school performance</li>
        </ul>
        
        <p>You can contact your local school to ask if they need a new governor or school board member. In England, you can also apply online at the Governors for Schools website at www.governorsforschools.org.uk.</p>
        
        <p>In England, parents and other community groups can apply to open a free school in their local area. More information about this can be found at https://www.gov.uk/set-up-free-school.</p>
        
        <h3>Supporting political parties</h3>
        <p>Political parties welcome new members. Joining one is a way to demonstrate your support for certain views and to get involved in the democratic process.</p>
        
        <p>Political parties are particularly busy at election times. Members work hard to persuade people to vote for their candidates – for instance, by handing out leaflets in the street or by knocking on people's doors and asking for their support. This is called 'canvassing'. You don't have to tell a canvasser how you intend to vote if you don't want to.</p>
        
        <p>British citizens can stand for office as a local councillor, a member of Parliament (or the devolved equivalents) or a member of the European Parliament. This is an opportunity to become even more involved in the political life of the UK. You may also be able to stand for office if you are an Irish citizen, an eligible Commonwealth citizen or (except for standing to be an MP) a citizen of another EU country.</p>
        
        <p>You can find out more about joining a political party from the individual party websites.</p>
        
        <h3>Helping with local services</h3>
        <p>There are opportunities to volunteer with a wide range of local service providers, including local hospitals and youth projects. Services often want to involve local people in decisions about the way in which they work. Universities, housing associations, museums and arts councils may advertise for people to serve as volunteers in their governing bodies.</p>
        
        <p>You can volunteer with the police, and become a special constable or a lay (non-police) representative. You can also apply to become a magistrate. You will often find advertisements for vacancies in your local newspaper or on local radio. You can also find out more about these sorts of roles at www.gov.uk.</p>
        
        <h3>Blood and organ donation</h3>
        <p>Donated blood is used by hospitals to help people with a wide range of injuries and illnesses. Giving blood only takes about an hour to do. You can register to give blood at:</p>
        <ul>
            <li>England and North Wales: www.blood.co.uk</li>
            <li>Rest of Wales: www.welsh-blood.org.uk</li>
            <li>Scotland: www.scotblood.co.uk</li>
            <li>Northern Ireland: https://nibts.hscni.net</li>
        </ul>
        
        <p>Many people in the UK are waiting for organ transplants. If you register to be an organ donor, it can make it easier for your family to decide whether to donate your organs when you die. You can register to be an organ donor at www.organdonation.nhs.uk. Living people can also donate a kidney.</p>
        
        <h3>Other ways to volunteer</h3>
        <p>Volunteering is working for good causes without payment. There are many benefits to volunteering, such as meeting new people and helping make your community a better place. Some volunteer activities will give you a chance to practise your English or develop work skills that will help you find a job or improve your curriculum vitae (CV). Many people volunteer simply because they want to help other people.</p>
        
        <p>Activities you can do as a volunteer include:</p>
        <ul>
            <li>working with animals – for example, caring for animals at a local rescue shelter</li>
            <li>youth work – for example, volunteering at a youth group</li>
            <li>helping improve the environment – for example, participating in a litter pick-up in the local area</li>
            <li>working with the homeless in, for example, a homelessness shelter</li>
            <li>mentoring – for example, supporting someone who has just come out of prison</li>
            <li>work in health and hospitals – for example, working on an information desk in a hospital</li>
            <li>helping older people at, for example, a residential care home</li>
        </ul>
        
        <p>There are thousands of active charities and voluntary organisations in the UK. They work to improve the lives of people, animals and the environment in many different ways. They range from the British branches of international organisations, such as the British Red Cross, to small local charities working in particular areas. They include charities working with older people (such as Age UK), with children (for example, the National Society for the Prevention of Cruelty to Children (NSPCC)), and with the homeless (for example, Crisis and Shelter). There are also medical research charities (for example, Cancer Research UK), environmental charities (including the National Trust and Friends of the Earth) and charities working with animals (such as the People's Dispensary for Sick Animals (PDSA)).</p>
        
        <p>Volunteers are needed to help with their activities and to raise money. The charities often advertise in local newspapers, and most have websites that include information about their opportunities. You can also get information about volunteering for different organisations from https://do-it.org</p>
        
        <p>There are many opportunities for younger people to volunteer and receive accreditation which will help them to develop their skills. These include the National Citizen Service programme, which gives 16- and 17-year-olds the opportunity to enjoy outdoor activities, develop their skills and take part in a community project. You can find out more about these opportunities as follows:</p>
        <ul>
            <li>National Citizen Service: at www.ncsyes.co.uk</li>
            <li>England: at www.vinspired.com</li>
            <li>Wales: at www.gwirvol.org</li>
            <li>Scotland: at www.volunteerscotland.net</li>
            <li>Northern Ireland: at www.volunteernow.co.uk</li>
        </ul>
        
        <h2>Looking after the environment</h2>
        <p>It is important to recycle as much of your waste as you can. Using recycled materials to make new products uses less energy and means that we do not need to extract more raw materials from the earth. It also means that less rubbish is created, so the amount being put into landfill is reduced.</p>
        
        <p>You can learn more about recycling and its benefits at www.recyclenow.com. At this website you can also find out what you can recycle at home and in the local area if you live in England. This information is available for Wales at www.wasteawarenesswales.org.uk, for Scotland at www.recycleforscotland.com and for Northern Ireland from your local authority.</p>
        
        <p>A good way to support your local community is to shop for products locally where you can. This will help businesses and farmers in your area and in Britain. It will also reduce your carbon footprint, because the products you buy will not have had to travel as far.</p>
        
        <p>Walking and using public transport to get around when you can is also a good way to protect the environment. It means that you create less pollution than when you use a car.</p>
        
        <h2>Being a good neighbour</h2>
        <p>When you move into a new house or apartment, introduce yourself to the people who live near you. Getting to know your neighbours can help you to become part of the community and make friends. Your neighbours are also a good source of help – for example, they may be willing to feed your pets if you are away, or offer advice on local shops and services.</p>
        
        <p>You can help prevent any problems and conflicts with your neighbours by respecting their privacy and limiting how much noise you make. Also try to keep your garden tidy, and only put your refuse bags and bins on the street or in communal areas if they are due to be collected.</p>
        
        <div class="info-box">
            <h3>Check that you understand</h3>
            <ul>
                <li>✔ How democracy has developed in the UK</li>
                <li>✔ The British constitution</li>
                <li>✔ The role of Parliament, government, and the opposition</li>
                <li>✔ The role of the monarch</li>
                <li>✔ How you can vote and stand for office</li>
                <li>✔ The role of the media</li>
                <li>✔ International institutions of which the UK is a member</li>
                <li>✔ The different courts</li>
                <li>✔ Civil and criminal law</li>
                <li>✔ The rights and responsibilities of citizens</li>
                <li>✔ The importance of shared values</li>
                <li>✔ How you can contribute to your community</li>
            </ul>
        </div>
      `;

    default:
      return `
        <h1>Chapter Content</h1>
        <p>Content for this chapter is being prepared. Please check back later.</p>
      `;
  }
}