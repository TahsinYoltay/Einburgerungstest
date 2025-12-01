import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './languages/en.json';
import tr from './languages/tr.json';
import es from './languages/es.json';
import fr from './languages/fr.json';

// the translations
const resources = {
  en: {
    translation: en,
  },
  tr: {
    translation: tr,
  },
  es: {
    translation: es,
  },
  fr: {
    translation: fr,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources: resources as any,
    lng: 'en',
    fallbackLng: 'en',
    compatibilityJSON: 'v3', // Changed to v3 for better Android compatibility
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;