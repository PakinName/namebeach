'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useState } from 'react';
import Link from 'next/link';
import { useResource } from '@/hooks/useResource';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import { LoadingCards, ErrorNotice } from '@/components/ui/LoadState';
interface Resource { id: string; fileName: string; fileUrl: string; fileType: string; fileSize: number; classroom: { name: string } | null; uploader: { name: string } }
export default function FilesPage() {
  const { t } = useLanguage();

  const { data, loading, error, reload } = useResource<Resource[]>('/api/files');
  const [search,setSearch] = useState('');
  const files = data?.filter(file => file.fileName.toLowerCase().includes(search.toLowerCase())) || [];
  return <div className="animate-fadeIn"><PageHeader title={t("Everything within reach.")} description={t("Find the documents and learning materials shared with your classrooms.")} eyebrow={t("RESOURCE LIBRARY")} /><div className="filter-bar"><div className="input-group"><span className="input-icon"><Icon name="search" size={17} /></span><input className="form-input" aria-label={t("Search resources")} placeholder={t("Search by file name...")} value={search} onChange={e => setSearch(e.target.value)} /></div><span className="filter-count">{files.length} {t("resources")}</span></div>{loading ? <LoadingCards /> : error ? <ErrorNotice message={error} onRetry={reload} /> : files.length ? <div className="flex-col gap-3">{files.map(file => <article key={file.id} className="card"><div className="card-body resource-row"><span className="course-row-icon"><Icon name="file" size={24} /></span><div><h3>{file.fileName}</h3><p className="text-xs text-muted mt-2">{file.classroom?.name || t("Your uploads")} · {file.uploader.name} · {file.fileSize >= 1048576 ? (file.fileSize / 1048576).toFixed(1) + ' MB' : Math.ceil(file.fileSize / 1024) + ' KB'}</p></div>{/^(https?:\/\/|\/(?!\/))/i.test(file.fileUrl) && <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">{t("Open file")} <Icon name="arrow" size={14} /></a>}</div></article>)}</div> : <EmptyState icon="folder" title={search ? t("No matching resources") : t("A place for everything you need")} description={search ? t("Try searching for a different file name.") : t("Learning resources shared with you will appear here.")}><Link href="/courses" className="btn btn-secondary">{t("Explore courses")}</Link></EmptyState>}</div>;
}

