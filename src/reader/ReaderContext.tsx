import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ReaderSettings = {
  fontSize: number;
  setFontSize: (sz: number) => void;
  location: string;
  setLocation: (cfi: string) => void;
  readingTime: number;
  addTime: (ms: number) => void;
};

const ReaderContext = createContext<ReaderSettings | null>(null);

interface ReaderProviderProps {
  children: ReactNode;
}

export const ReaderProvider: React.FC<ReaderProviderProps> = ({ children }) => {
  const [fontSize, _setFontSize] = useState(100);
  const [location, _setLocation] = useState('');
  const [readingTime, _setReading] = useState(0);

  useEffect(() => {
    AsyncStorage.multiGet(['fontSize', 'location', 'readingTime']).then(kv => {
      kv.forEach(([k, v]) => {
        if (v) {
          const num = JSON.parse(v);
          if (k === 'fontSize') _setFontSize(num);
          if (k === 'location') _setLocation(num);
          if (k === 'readingTime') _setReading(num);
        }
      });
    });
  }, []);

  const setFontSize = async (sz: number) => {
    _setFontSize(sz);
    await AsyncStorage.setItem('fontSize', JSON.stringify(sz));
  };
  
  const setLocation = async (cfi: string) => {
    _setLocation(cfi);
    await AsyncStorage.setItem('location', JSON.stringify(cfi));
  };
  
  const addTime = async (ms: number) => {
    const total = readingTime + ms;
    _setReading(total);
    await AsyncStorage.setItem('readingTime', JSON.stringify(total));
  };

  return (
    <ReaderContext.Provider value={{ fontSize, setFontSize, location, setLocation, readingTime, addTime }}>
      {children}
    </ReaderContext.Provider>
  );
};

export const useReader = () => {
  const context = useContext(ReaderContext);
  if (!context) {
    throw new Error('useReader must be used within a ReaderProvider');
  }
  return context;
};