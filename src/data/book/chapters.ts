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
  chapterHref?: string; // Base href to chapter start (title page with image)
  isAvailable: boolean;
  subSections: SubSection[];
}

export const chapters: Chapter[] = [
  {
    id: '1',
    title: 'The Values and Principles of the UK',
    description: 'Learn about the fundamental values and principles that form the foundation of UK society, including democracy, rule of law, and individual liberty.',
    image: require('../../assets/images/chapters/chapter1.jpg'),
    epubPath: 'LIUKV3',
    chapterHref: 'OEBPS/part0005.xhtml',
    isAvailable: true,
    subSections: [
      { id: '1-1', title: 'The values and principles of the UK', href: 'OEBPS/part0005.xhtml#a42J', order: 1 },
      { id: '1-2', title: 'Becoming a permanent resident', href: 'OEBPS/part0005.xhtml#a42K', order: 2 },
      { id: '1-3', title: 'Taking the Life in the UK test', href: 'OEBPS/part0005.xhtml#a42M', order: 3 },
    ]
  },
  {
    id: '2',
    title: 'What is the UK?',
    description: 'Discover the geography, countries, and constituent parts of the United Kingdom, including England, Scotland, Wales, and Northern Ireland.',
    image: require('../../assets/images/chapters/chapter2.jpg'),
    epubPath: 'LIUKV3',
    chapterHref: 'OEBPS/part0006.xhtml',
    isAvailable: true,
    subSections: [
      { id: '2-1', title: 'What is the UK?', href: 'OEBPS/part0006.xhtml', order: 1 },
    ]
  },
  {
    id: '3',
    title: 'A Long and Illustrious History',
    description: 'Explore the rich history of the UK from ancient times to the modern era, including key events, figures, and developments.',
    image: require('../../assets/images/chapters/chapter3.jpg'),
    epubPath: 'LIUKV3',
    chapterHref: 'OEBPS/part0007.xhtml',
    isAvailable: true,
    subSections: [
      { id: '3-1', title: 'Early Britain', href: 'OEBPS/part0007.xhtml#a42R', order: 1 },
      { id: '3-2', title: 'The Middle Ages', href: 'OEBPS/part0007.xhtml#a42S', order: 2 },
      { id: '3-3', title: 'The Tudors and Stuarts', href: 'OEBPS/part0007.xhtml#a42T', order: 3 },
      { id: '3-4', title: 'A global power', href: 'OEBPS/part0007.xhtml#a42U', order: 4 },
      { id: '3-5', title: 'The 20th century', href: 'OEBPS/part0007.xhtml#a42V', order: 5 },
      { id: '3-6', title: 'Britain since 1945', href: 'OEBPS/part0007.xhtml#a42W', order: 6 },
    ]
  },
  {
    id: '4',
    title: 'A Modern, Thriving Society',
    description: 'Learn about contemporary UK society, including its diverse population, cultural achievements, and modern developments.',
    image: require('../../assets/images/chapters/chapter4.jpg'),
    epubPath: 'LIUKV3',
    chapterHref: 'OEBPS/part0008.xhtml',
    isAvailable: true,
    subSections: [
      { id: '4-1', title: 'The UK today', href: 'OEBPS/part0008.xhtml#a42Y', order: 1 },
      { id: '4-2', title: 'Religion', href: 'OEBPS/part0008.xhtml#a42Z', order: 2 },
      { id: '4-3', title: 'Customs and traditions', href: 'OEBPS/part0008.xhtml#a430', order: 3 },
      { id: '4-4', title: 'Sport', href: 'OEBPS/part0008.xhtml#a431', order: 4 },
      { id: '4-5', title: 'Arts and culture', href: 'OEBPS/part0008.xhtml#a432', order: 5 },
      { id: '4-6', title: 'Leisure', href: 'OEBPS/part0008.xhtml#a433', order: 6 },
      { id: '4-7', title: 'Places of interest', href: 'OEBPS/part0008.xhtml#a434', order: 7 },
    ]
  },
  {
    id: '5',
    title: 'The UK Government, the Law and Your Role',
    description: 'Understand the UK political system, legal framework, and your rights and responsibilities as a resident.',
    image: require('../../assets/images/chapters/chapter5.jpg'),
    epubPath: 'LIUKV3',
    chapterHref: 'OEBPS/part0009.xhtml',
    isAvailable: true,
    subSections: [
      { id: '5-1', title: 'The development of British democracy', href: 'OEBPS/part0009.xhtml#a436', order: 1 },
      { id: '5-2', title: 'The British constitution', href: 'OEBPS/part0009.xhtml#a437', order: 2 },
      { id: '5-3', title: 'The government', href: 'OEBPS/part0009.xhtml#a438', order: 3 },
      { id: '5-4', title: 'The UK and international institutions', href: 'OEBPS/part0009.xhtml#a439', order: 4 },
      { id: '5-5', title: 'Respecting the law', href: 'OEBPS/part0009.xhtml#a43A', order: 5 },
      { id: '5-6', title: 'Fundamental principles', href: 'OEBPS/part0009.xhtml#a43B', order: 6 },
      { id: '5-7', title: 'Your role in the community', href: 'OEBPS/part0009.xhtml#a43C', order: 7 },
    ]
  },
];

export const getChapterById = (id: string): Chapter | undefined => {
  return chapters.find(chapter => chapter.id === id);
};

export const getAvailableChapters = (): Chapter[] => {
  return chapters.filter(chapter => chapter.isAvailable);
};
