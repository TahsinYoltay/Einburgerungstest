export interface ContentModuleConfig {
  version: number;
  path: string; // Path in Firebase Storage (e.g., 'content/home.json')
  required: boolean; // If true, app blocks until downloaded
}

export interface MasterManifest {
  modules: {
    exams: ContentModuleConfig;
    languages: ContentModuleConfig;
    home: ContentModuleConfig;
    // Add more modules here as needed
    [key: string]: ContentModuleConfig;
  };
}

export interface LocalVersionMap {
  [moduleId: string]: number;
}

export type LocalizedText = string | { [langCode: string]: string };

// Specific Data Types for Modules
export interface HomeContent {
  heroImage?: string;
  welcomeMessage?: LocalizedText;
  promoBanner?: {
    visible: boolean;
    text: LocalizedText;
    link?: string;
  };
}
