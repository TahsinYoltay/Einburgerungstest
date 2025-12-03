export interface BookSubSection {
  id: string;
  title: string;
  content: string;
}

export interface BookChapter {
  id: string;
  title: string;
  description: string;
  subSections: BookSubSection[];
}

export interface BookContent {
  language: string;
  version: number;
  chapters: BookChapter[];
}
