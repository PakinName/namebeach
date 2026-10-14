'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import Icon from './Icon';
export default function LearningArt() {
  const { t } = useLanguage();

  return <div className="learning-art" aria-hidden="true"><div className="art-orbit" /><div className="art-book"><Icon name="book" size={44} /></div><div className="art-chip"><Icon name="check" size={15} /> {t("One step closer.")}</div></div>;
}

