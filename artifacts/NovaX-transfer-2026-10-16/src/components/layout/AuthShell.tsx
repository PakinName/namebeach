'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { ReactNode } from 'react';
import Link from 'next/link';
import Brand from '@/components/ui/Brand';
import Icon from '@/components/ui/Icon';
import LearningArt from '@/components/ui/LearningArt';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
export default function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useLanguage();

  return <div className="auth-shell"><div className="auth-language-bar"><LanguageSwitcher /></div><aside className="auth-story"><Brand /><div className="auth-story-content"><p className="eyebrow">{t("YOUR NEXT CHAPTER STARTS HERE")}</p><h2>{t("Small steps.")}<br />{t("Lasting knowledge.")}</h2><p>{t("A thoughtful space to learn, connect, and build the skills that take you forward.")}</p><LearningArt /><div className="auth-benefit"><Icon name="check" size={17} />{t("Learn at your own pace")}</div><div className="auth-benefit"><Icon name="check" size={17} />{t("Build confidence with every chapter")}</div><div className="auth-benefit"><Icon name="check" size={17} />{t("Stay connected with your classroom")}</div></div><span className="auth-story-foot">{t("Designed for curious minds. Built for meaningful progress.")}</span></aside><main className="auth-form-panel"><div className="auth-form-container"><div className="auth-mobile-brand"><Brand /></div><Link href="/" className="auth-back">{t("← Back to home")}</Link>{children}</div></main></div>;
}

