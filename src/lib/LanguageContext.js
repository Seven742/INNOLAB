'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (key, fallback) => fallback || key,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('innolab_lang');
      if (saved && (saved === 'en' || saved === 'kh')) {
        setLangState(saved);
        document.documentElement.lang = saved === 'kh' ? 'km' : 'en';
      }
    } catch (e) {
      console.warn('localStorage not accessible:', e);
    }
    setMounted(true);
  }, []);

  const setLang = (newLang) => {
    if (newLang !== 'en' && newLang !== 'kh') return;
    setLangState(newLang);
    try {
      localStorage.setItem('innolab_lang', newLang);
      document.documentElement.lang = newLang === 'kh' ? 'km' : 'en';
    } catch (e) {
      console.warn('Failed to save language:', e);
    }
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'kh' : 'en');
  };

  const t = (key, fallback = '') => {
    const dict = translations[lang] || translations.en;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    // Fallback to English dictionary
    if (translations.en && translations.en[key] !== undefined) {
      return translations.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

