'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
export function LoadingCards({ count = 3 }: { count?: number }) {
  const { t } = useLanguage();

  return <div className="grid-3" role="status" aria-label={t("Loading content")}>{Array.from({ length: count }, (_, i) => <div key={i} className="skeleton skeleton-card" />)}<span className="sr-only">{t("Loading...")}</span></div>;
}
export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useLanguage();

  return <div className="alert alert-error" role="alert"><span>{t(message)}</span>{onRetry && <button className="btn btn-secondary btn-sm" onClick={onRetry}>{t("Try again")}</button>}</div>;
}

