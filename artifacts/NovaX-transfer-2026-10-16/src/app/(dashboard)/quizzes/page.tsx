'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import Link from 'next/link';
import { useResource } from '@/hooks/useResource';
import PageHeader from '@/components/ui/PageHeader';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import { LoadingCards, ErrorNotice } from '@/components/ui/LoadState';
import type { CourseSummary } from '@/components/ui/CourseCard';
export default function QuizzesPage() {
  const { t } = useLanguage();

  const { data, loading, error, reload } = useResource<CourseSummary[]>('/api/courses');
  return <div className="animate-fadeIn"><PageHeader title={t("Turn knowledge into confidence.")} description={t("Choose a course, open an unlocked chapter, and put what you have learned into practice.")} eyebrow={t("PRACTICE & QUIZZES")} /><div className="card mb-6"><div className="card-body flex gap-4 items-center"><span className="stat-card-icon"><Icon name="target" /></span><div><h3>{t("One chapter at a time")}</h3><p className="text-xs text-muted mt-2">{t("Each chapter has its own quiz. Pass the required score to unlock the next chapter, or revisit your lessons and try again.")}</p></div></div></div>{loading ? <LoadingCards /> : error ? <ErrorNotice message={error} onRetry={reload} /> : data?.length ? <div className="grid-3">{data.map(course => <article className="card" key={course.id}><div className="card-body"><span className="badge badge-info">{course.category}</span><h3 className="mt-4 mb-3">{course.title}</h3><p className="text-xs text-muted">{course._count.chapters} {t("chapters · Quizzes inside each chapter")}</p><Link href={`/courses/${course.id}`} className="course-link">{t("View chapter quizzes")} <Icon name="arrow" size={16} /></Link></div></article>)}</div> : <EmptyState icon="quiz" title={t("Your first challenge is ahead")} description={t("Quizzes will be available when courses are published.")}><Link href="/courses" className="btn btn-secondary">{t("Explore course library")}</Link></EmptyState>}</div>;
}

