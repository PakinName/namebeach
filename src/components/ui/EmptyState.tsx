'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { ReactNode } from 'react';
import Icon, { type IconName } from './Icon';
export default function EmptyState({ icon = 'book', title, description, children }: { icon?: IconName; title: string; description?: string; children?: ReactNode }) {
  const { t } = useLanguage();

  return <div className="empty-state"><span className="empty-state-icon"><Icon name={icon} size={28} /></span><h3 className="empty-state-title">{t(title)}</h3>{description && <p className="empty-state-description">{t(description)}</p>}{children && <div className="mt-4">{children}</div>}</div>;
}

