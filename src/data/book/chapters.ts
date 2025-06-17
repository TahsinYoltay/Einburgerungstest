export interface SubSection {
  id: string;
  title: string;
  href: string; // The actual file path in EPUB
  order: number;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  image: any; // require() image
  epubPath?: string; // Optional path to specific EPUB file
  isAvailable: boolean;
  subSections: SubSection[];
}

export const chapters: Chapter[] = [
  {
    id: '1',
    title: 'The Values and Principles of the UK',
    description: 'Learn about the fundamental values and principles that form the foundation of UK society, including democracy, rule of law, and individual liberty.',
    image: require('../../assets/images/chapters/chapter1.jpg'),
    epubPath: 'Life in the United Kingdom_ A Guide for New Residents, 3rd edition, Chapter 1 (20)',
    isAvailable: true,
    subSections: [
      { id: '1-1', title: 'The values and principles of the UK', href: 'chapter1_section1.xhtml', order: 1 },
      { id: '1-2', title: 'Becoming a permanent resident', href: 'chapter1_section2.xhtml', order: 2 },
      { id: '1-3', title: 'Taking the Life in the UK test', href: 'chapter1_section3.xhtml', order: 3 },
    ]
  },
  {
    id: '2',
    title: 'What is the UK?',
    description: 'Discover the geography, countries, and constituent parts of the United Kingdom, including England, Scotland, Wales, and Northern Ireland.',
    image: require('../../assets/images/chapters/chapter2.jpg'),
    epubPath: 'Life in the United Kingdom_ A Guide for New Residents, 3rd edition, Chapter 2 (21)',
    isAvailable: true,
    subSections: [
      { id: '2-1', title: 'What is the UK?', href: 'chapter2_section1.xhtml', order: 1 },
    ]
  },
  {
    id: '3',
    title: 'A Long and Illustrious History',
    description: 'Explore the rich history of the UK from ancient times to the modern era, including key events, figures, and developments.',
    image: require('../../assets/images/chapters/chapter3.jpg'),
    epubPath: 'Life in the United Kingdom_ A Guide for New Residents, 3rd edition (22)',
    isAvailable: true,
    subSections: [
      { id: '3-1', title: 'Early Britain', href: 'chapter3_section1.xhtml', order: 1 },
      { id: '3-2', title: 'The Middle Ages', href: 'chapter3_section2.xhtml', order: 2 },
      { id: '3-3', title: 'The Tudors and the Stuarts', href: 'chapter3_section3.xhtml', order: 3 },
      { id: '3-4', title: 'A global power', href: 'chapter3_section4.xhtml', order: 4 },
      { id: '3-5', title: 'The 20th century', href: 'chapter3_section5.xhtml', order: 5 },
      { id: '3-6', title: 'Britain since 1945', href: 'chapter3_section6.xhtml', order: 6 },
    ]
  },
  {
    id: '4',
    title: 'A Modern, Thriving Society',
    description: 'Learn about contemporary UK society, including its diverse population, cultural achievements, and modern developments.',
    image: require('../../assets/images/chapters/chapter4.jpg'),
    epubPath: 'Life in the United Kingdom_ A Guide for New Residents, 3rd edition (23)',
    isAvailable: true,
    subSections: [
      { id: '4-1', title: 'The UK today', href: 'chapter4_section1.xhtml', order: 1 },
      { id: '4-2', title: 'Religion', href: 'chapter4_section2.xhtml', order: 2 },
      { id: '4-3', title: 'Customs and traditions', href: 'chapter4_section3.xhtml', order: 3 },
      { id: '4-4', title: 'Sports', href: 'chapter4_section4.xhtml', order: 4 },
      { id: '4-5', title: 'Arts and culture', href: 'chapter4_section5.xhtml', order: 5 },
      { id: '4-6', title: 'Leisure', href: 'chapter4_section6.xhtml', order: 6 },
      { id: '4-7', title: 'Places of interest', href: 'chapter4_section7.xhtml', order: 7 },
    ]
  },
  {
    id: '5',
    title: 'The UK Government, the Law and Your Role',
    description: 'Understand the UK political system, legal framework, and your rights and responsibilities as a resident.',
    image: require('../../assets/images/chapters/chapter5.jpg'),
    epubPath: 'Life in the United Kingdom_ A Guide for New Residents, 3rd edition (24)',
    isAvailable: true,
    subSections: [
      { id: '5-1', title: 'The British constitution', href: 'chapter5_section1.xhtml', order: 1 },
      { id: '5-2', title: 'The government', href: 'chapter5_section2.xhtml', order: 2 },
      { id: '5-3', title: 'The UK and international institutions', href: 'chapter5_section3.xhtml', order: 3 },
      { id: '5-4', title: 'Respecting the law', href: 'chapter5_section4.xhtml', order: 4 },
      { id: '5-5', title: 'Fundamental principles', href: 'chapter5_section5.xhtml', order: 5 },
      { id: '5-6', title: 'Your role in the community', href: 'chapter5_section6.xhtml', order: 6 },
    ]
  },
];

export const getChapterById = (id: string): Chapter | undefined => {
  return chapters.find(chapter => chapter.id === id);
};

export const getAvailableChapters = (): Chapter[] => {
  return chapters.filter(chapter => chapter.isAvailable);
};
