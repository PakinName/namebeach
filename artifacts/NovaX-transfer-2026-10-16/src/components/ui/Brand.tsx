'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import Link from 'next/link';
import Icon from './Icon';
export default function Brand({ href = '/' }: { href?: string }) {
  const { t } = useLanguage();

  return <Link href={href} className="brand" aria-label={t("NovaX home")}><span className="brand-mark"><Icon name="book" size={23} /></span><span>{t("NovaX")}<span className="brand-caption">{t("A little progress, every day.")}</span></span></Link>;
}

