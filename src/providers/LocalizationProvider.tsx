import React, { createContext, useState, useContext, useEffect } from 'react';
import i18n from '../localization/i18n';

type LocalizationContextType = {
  language: string;
  setLanguage: (lang: string) => void;
};

const LocalizationContext = createContext<LocalizationContextType>({
  language: 'de',
  setLanguage: () => {},
});

export const useLocalization = () => useContext(LocalizationContext);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState(i18n.language || 'de');

  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguageState(lang);
  };

  useEffect(() => {
    // You could load the user's preferred language from AsyncStorage here
  }, []);

  return (
    <LocalizationContext.Provider value={{ language, setLanguage }}>
      {children}
    </LocalizationContext.Provider>
  );
};
