'use client';
/* eslint-disable @next/next/no-img-element -- Authenticated course covers. */
import { useLanguage } from '@/components/providers/LanguageProvider';
import Link from 'next/link';
import Icon from './Icon';
export interface CourseSummary {
  thumbnail?: string | null; published?: boolean; id: string; title: string; description: string; category: string; difficulty: string;
  estimatedTime: number | null; teacher: { name: string }; _count: { chapters: number }; progress?: number; certificateId?: string | null; requiresCode?: boolean; enrolled?: boolean;
}
export default function CourseCard({ course, index = 0 }: { course: CourseSummary; index?: number }) {
  const { t, language } = useLanguage();

  const level = course.difficulty.toLowerCase();
  return <Link href={course.certificateId ? `/verify/${course.certificateId}` : `/courses/${course.id}`} className="course-card-link"><article className="card card-hover course-card"><div className="course-cover" data-tone={index % 3}>{course.thumbnail && <img src={course.thumbnail} alt="" className="course-card-cover-image" />}<Icon name={index % 3 === 1 ? 'grid' : index % 3 === 2 ? 'chart' : 'book'} /><span className="cover-label">{t(course.category)}</span></div><div className="card-body"><div className="flex gap-2 flex-wrap"><span className={`badge ${level === 'beginner' ? 'badge-success' : level === 'advanced' ? 'badge-warning' : 'badge-info'}`}>{t(level.charAt(0).toUpperCase() + level.slice(1))}</span><span className="badge badge-primary">{course._count.chapters} {t("chapters")}</span></div>{course.published === false && <span className="badge badge-warning mt-2">{t('Draft')}</span>}<h3>{course.title}</h3><p className="course-description">{course.description}</p><div className="course-meta"><span><Icon name="user" size={13} />{course.teacher.name}</span>{course.estimatedTime && <span><Icon name="clock" size={13} />{course.estimatedTime} {t("min")}</span>}</div>{course.progress !== undefined && <div className="mt-4"><div className="progress-label"><span>{t("Course progress")}</span><span>{course.progress}%</span></div><div className="progress-container progress-sm" role="progressbar" aria-label={t("{0} progress", [course.title])} aria-valuenow={course.progress} aria-valuemin={0} aria-valuemax={100}><div className="progress-bar" style={{ width: `${course.progress}%` }} /></div></div>}<div className="course-link"><span>{course.certificateId ? (language==='th'?'เรียนสำเร็จ · เปิดเกียรติบัตร':'Completed · Open certificate') : course.progress ? t("Continue learning") : t("Explore course")}</span><Icon name="arrow" size={16} /></div></div></article></Link>;
}

