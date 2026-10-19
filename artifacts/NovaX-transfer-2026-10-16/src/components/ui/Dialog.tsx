'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import Icon from './Icon';
export default function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useLanguage();

  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { dialog?.close(); document.body.style.overflow = overflow; }; }, []);
  return <dialog ref={ref} className="native-dialog" aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div><div className="modal-header"><h2 id="dialog-title" className="modal-title">{t(title)}</h2><button type="button" className="icon-button" aria-label={t("Close dialog")} onClick={onClose}><Icon name="close" /></button></div>{children}</div></dialog>;
}

