import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './languages/en.json';
import tr from './languages/tr.json';
import es from './languages/es.json';
import fr from './languages/fr.json';
import de from './languages/de.json';
import it from './languages/it.json';
import pt from './languages/pt.json';
import ru from './languages/ru.json';
import zh from './languages/zh.json';
import ja from './languages/ja.json';
import ko from './languages/ko.json';
import ar from './languages/ar.json';
import hi from './languages/hi.json';
import pl from './languages/pl.json';
import nl from './languages/nl.json';

// the translations
const resources = {
  en: { translation: en },
  tr: { translation: tr },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  pt: { translation: pt },
  ru: { translation: ru },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  ar: { translation: ar },
  hi: { translation: hi },
  pl: { translation: pl },
  nl: { translation: nl },
};

i18n
  .use(initReactI18next)
  .init({
    resources: resources as any,
    lng: 'en',
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;