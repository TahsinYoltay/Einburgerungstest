export interface EpubMetadata {
  title: string;
  author: string;
  language: string;
  identifier: string;
  date?: string;
  description?: string;
  publisher?: string;
  rights?: string;
}

export interface EpubManifestItem {
  id: string;
  href: string;
  mediaType: string;
  properties?: string;
}

export interface EpubSpineItem {
  idref: string;
  linear?: boolean;
}

export interface EpubNavPoint {
  id: string;
  playOrder: number;
  navLabel: string;
  content: string;
  children?: EpubNavPoint[];
}

export interface EpubPackage {
  metadata: EpubMetadata;
  manifest: EpubManifestItem[];
  spine: EpubSpineItem[];
  guide?: any[];
  toc?: EpubNavPoint[];
}

export interface EpubBook {
  packagePath: string;
  package: EpubPackage;
  resources: Map<string, string>; // href -> full content
  cover?: string;
}

export interface EpubSection {
  id: string;
  href: string;
  title: string;
  content: string;
  index: number;
  spineIndex: number;
} 