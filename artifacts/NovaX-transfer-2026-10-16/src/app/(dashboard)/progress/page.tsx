'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import Link from 'next/link';
import { useResource } from '@/hooks/useResource';
import PageHeader from '@/components/ui/PageHeader';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import { LoadingCards, ErrorNotice } from '@/components/ui/LoadState';
interface Progress { courseId: string; courseTitle: string; category: string; totalChapters: number; completedChapters: number; progressPercent: number }
export default function ProgressPage() {
  const { t } = useLanguage();

  const { data, loading, error, reload } = useResource<{ courseProgress?: Progress[] }>('/api/dashboard');
  const progress = data?.courseProgress || [];
  const total = progress.reduce((sum,course) => sum + course.totalChapters,0);
  const completed = progress.reduce((sum,course) => sum + course.completedChapters,0);
  const percent = total ? Math.round(completed / total * 100) : 0;
  return <div className="animate-fadeIn"><PageHeader title={t("Look how far you are going.")} description={t("Every completed chapter is a step toward something bigger.")} eyebrow={t("MY PROGRESS")} />{loading ? <LoadingCards /> : error ? <ErrorNotice message={error} onRetry={reload} /> : <><div className="welcome-banner"><div><p className="eyebrow">{t("YOUR PROGRESS, AT A GLANCE")}</p><h2>{completed} {t("chapters. A growing foundation.")}</h2><p>{completed} {t("of")} {total} {t("chapters completed across")} {progress.length} {t("courses.")}</p><Link href="/courses" className="btn btn-primary">{t("Keep learning")} <Icon name="arrow" size={16} /></Link></div><div className="progress-ring" style={{ background: `conic-gradient(#487650 ${percent}%, #d8e3d5 0)` }} aria-label={t("{0}% of chapters completed", [percent])}><span>{percent}<small>{t("% complete")}</small></span></div></div>{progress.length ? <div className="grid-2">{progress.map(course => <Link href={`/courses/${course.courseId}`} className="course-card-link" key={course.courseId}><article className="card card-hover"><div className="card-body"><div className="flex-between mb-4"><span className="badge badge-info">{course.category}</span><Icon name={course.progressPercent === 100 ? 'check' : 'book'} size={18} /></div><h3 className="mb-4">{course.courseTitle}</h3><div className="progress-label"><span>{course.completedChapters} / {course.totalChapters} {t("chapters")}</span><span className="progress-text">{course.progressPercent}%</span></div><div className="progress-container" role="progressbar" aria-label={course.courseTitle} aria-valuenow={course.progressPercent} aria-valuemin={0} aria-valuemax={100}><div className="progress-bar" style={{ width: `${course.progressPercent}%` }} /></div><div className="course-link">{course.progressPercent === 100 ? t("Revisit your course") : course.progressPercent ? t("Continue your journey") : t("Take the first step")}<Icon name="arrow" size={16} /></div></div></article></Link>)}</div> : <EmptyState icon="chart" title={t("A fresh page, full of possibilities")} description={t("Choose a course and complete your first chapter to start tracking your progress.")}><Link href="/courses" className="btn btn-secondary">{t("Find a course")}</Link></EmptyState>}</>}</div>;
}

