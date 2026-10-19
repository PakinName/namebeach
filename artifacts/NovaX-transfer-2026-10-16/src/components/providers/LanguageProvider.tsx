'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { thai } from '@/lib/i18n/th';

export type Language = 'th' | 'en';
type Translator = (text: string, values?: Array<string | number>) => string;
const LanguageContext = createContext<{ language: Language; setLanguage: (value: Language) => void; t: Translator } | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, updateLanguage] = useState<Language>('th');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai-lms-language');
      if (saved === 'en' || saved === 'th') queueMicrotask(() => updateLanguage(saved));
    } catch { /* Storage may be unavailable in private browsing. */ }
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const setLanguage = useCallback((value: Language) => {
    updateLanguage(value);
    try { localStorage.setItem('ai-lms-language', value); } catch { /* Keep the in-memory preference. */ }
  }, []);
  const t = useCallback<Translator>((text, values = []) => {
    const translated = language === 'th' ? thai[text.trim()] ?? text : text;
    return translated.replace(/\{(\d+)\}/g, (match, index: string) => String(values[Number(index)] ?? match));
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
