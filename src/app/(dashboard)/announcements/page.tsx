'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import Link from 'next/link';
import { useResource } from '@/hooks/useResource';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import { LoadingCards, ErrorNotice } from '@/components/ui/LoadState';
interface Notification { id: string; type: string; title: string; message: string; read: boolean; link: string | null; createdAt: string }
export default function AnnouncementsPage() {
  const { t, language } = useLanguage();

  const { data, loading, error, reload } = useResource<Notification[]>('/api/notifications');
  const items = data?.filter(item => item.type === 'ANNOUNCEMENT') || [];
  return <div className="animate-fadeIn"><PageHeader title={t("Stay in the loop.")} description={t("Your latest learning updates, all in one place.")} eyebrow={t("ANNOUNCEMENTS")} action={<Link href="/courses" className="btn btn-secondary"><Icon name="users" size={16} />{t("Course library")}</Link>} />{loading ? <LoadingCards /> : error ? <ErrorNotice message={error} onRetry={reload} /> : items.length ? <div className="flex-col gap-4">{items.map(item => <article className="card" key={item.id}><div className="card-body"><div className="flex-between mb-3"><span className="badge badge-primary"><Icon name="bell" size={12} />{t("Announcements")}</span><time className="text-xs text-muted" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-GB')}</time></div><h3 className="mb-3">{item.title}</h3><p className="text-sm text-muted">{item.message}</p>{item.link?.startsWith('/') && !item.link.startsWith('//') && !/^\/classrooms(?:[/?#]|$)/.test(item.link) && <Link className="course-link" href={item.link}>{t("View details")} <Icon name="arrow" size={16} /></Link>}</div></article>)}</div> : <EmptyState icon="bell" title={t("You are all caught up")} description={t("New learning announcements will appear here.")}><Link className="btn btn-secondary" href="/courses">{t("Explore courses")}</Link></EmptyState>}</div>;
}

