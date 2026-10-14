'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { ReactNode } from 'react';
export default function PageHeader({ title, description, eyebrow = 'YOUR LEARNING SPACE', action }: { title: string; description?: string; eyebrow?: string; action?: ReactNode }) {
  const { t } = useLanguage();

  return <div className="page-header"><div><p className="eyebrow">{t(eyebrow)}</p><h1 className="page-title">{t(title)}</h1>{description && <p className="page-subtitle">{t(description)}</p>}</div>{action && <div className="page-actions">{action}</div>}</div>;
}

