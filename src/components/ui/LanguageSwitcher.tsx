'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return <div className="language-switcher" role="group" aria-label="ภาษา / Language"><button type="button" lang="th" aria-pressed={language === 'th'} onClick={() => setLanguage('th')}>ไทย</button><button type="button" lang="en" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button></div>;
}
