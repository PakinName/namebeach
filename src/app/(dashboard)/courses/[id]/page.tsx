'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  teacher: { name: string };
  teacherId: string;
  thumbnail: string | null;
  published: boolean;
  progressPercent?: number;
  completedChapters?: number;
  totalChapters?: number;
  chapters: Array<{
    id: string;
    title: string;
    description: string | null;
    orderIndex: number;
    quiz: { id: string } | null;
    lessons: Array<{ id: string; title: string; completed?: boolean }>;
    progress?: { completed: boolean; unlocked: boolean; highestScore: number };
  }>;
}

export default function CourseDetailPage() {
  const { t } = useLanguage();

  const params = useParams();
  const { data: session } = useSession();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/courses/${params.id}`);
        const data = await res.json();
        if (data.success) setCourse(data.data);
      } catch (err) {
        console.error('Course error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [params.id]);

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-title mb-4" />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        <div className="flex-col gap-4 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Icon name="book" size={28} /></div>
        <div className="empty-state-title">{t("Course not found")}</div>
        <Link href="/courses" className="btn btn-primary mt-4">{t("Back to Courses")}</Link>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <span className="breadcrumb-item"><Link href="/courses">{t("Courses")}</Link></span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">{course.title}</span>
      </nav>

      {session && (session.user.role === 'ADMIN' || (session.user.role === 'TEACHER' && course.teacherId === session.user.id)) && <div className="flex-between mb-4"><span className="badge badge-info">{t(course.published ? 'Published' : 'Draft')}</span><Link href={'/courses/'+course.id+'/edit'} className="btn btn-primary">{t('Manage course')}</Link></div>}
      {/* Course Header */}
      <div className="card mb-6 detail-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {course.thumbnail && <img className="course-detail-cover" src={course.thumbnail} alt={course.title} />}
        <div className="card-body" style={{ padding: 'var(--space-8)' }}>
          <div className="flex gap-2 mb-3">
            <span className="badge badge-primary">{t(course.difficulty)}</span>
            <span className="badge badge-info">{t(course.category)}</span>
          </div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
            {course.title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', maxWidth: 700 }}>
            {course.description}
          </p>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}> {t("Instructor:")} <strong>{course.teacher.name}</strong> ·  {course.chapters.length} {t("Chapters")} </div>

          {/* Overall Progress */}
          {course.progressPercent !== undefined && (
            <div style={{ marginTop: 'var(--space-6)', maxWidth: 500 }}>
              <div className="progress-label">
                <span style={{ fontWeight: 500 }}>{t("Overall Progress")}</span>
                <span className="progress-text">{course.progressPercent}%</span>
              </div>
              <div className="progress-container progress-lg">
                <div
                  className="progress-bar"
                  style={{ width: `${course.progressPercent}%` }}
                />
              </div>
              <div className="text-sm text-muted mt-2">
                {course.completedChapters}/{course.totalChapters} {t("chapters completed")} </div>
            </div>
          )}
        </div>
      </div>

      {/* Chapters List */}
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--space-4)' }}> {t("Chapters")} </h2>

      <div className="flex-col gap-3">
        {course.chapters.map((chapter) => {
          const isLocked = chapter.progress && !chapter.progress.unlocked;
          const isCompleted = chapter.progress?.completed;
          const isUnlocked = !isLocked && !isCompleted;

          const statusClass = isCompleted
            ? 'chapter-completed'
            : isLocked
            ? 'chapter-locked'
            : 'chapter-unlocked';

          return (
            <div key={chapter.id} className={`chapter-item ${statusClass}`}>
              <div className="chapter-number">
                {isCompleted ? <Icon name="check" size={19} /> : isLocked ? <Icon name="lock" size={19} /> : chapter.orderIndex + 1}
              </div>

              <div className="chapter-info" style={{ flex: 1 }}>
                <div className="chapter-title">{chapter.title}</div>
                {!isLocked && <div className="chapter-lessons">{chapter.lessons.map((lesson) => <Link key={lesson.id} href={`/lessons/${lesson.id}`}><Icon name={lesson.completed ? 'check' : 'play'} size={13} />{lesson.title}</Link>)}</div>}
                {chapter.description && (
                  <div className="chapter-desc">{chapter.description}</div>
                )}
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                   {chapter.lessons.length} {t("lessons")} {chapter.progress?.highestScore ? t("Best score: {0}%", [chapter.progress.highestScore.toFixed(0)]) : ''}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
                {isCompleted && (
                  <span className="badge badge-success">{t("✓ Completed")}</span>
                )}
                {isLocked && (
                  <span className="badge badge-warning"> {t("Locked")}</span>
                )}
                {(isUnlocked || isCompleted) && chapter.lessons.length > 0 && (
                  <Link
                    href={chapter.lessons.length > 0
                      ? `/lessons/${chapter.lessons[0].id}`
                      : '#'
                    }
                    className="btn btn-primary btn-sm"
                  > {t("Start Learning")} </Link>
                )}

                {!isLocked && chapter.quiz && (
                  <Link href={`/quizzes/${chapter.quiz.id}`} className="btn btn-outline btn-sm"> {t("Take Quiz")} </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contact Support */}
      <div className="card mt-8" style={{ background: 'var(--surface-2)' }}>
        <div className="card-body text-center" style={{ padding: 'var(--space-6)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}> {t("Need help? Contact Admin or Teacher.")} </p>
          <div className="flex-center gap-3">
            <Link href="/support" className="btn btn-secondary btn-sm"> {t("Contact Admin")} </Link>
            <Link href="/support" className="btn btn-ghost btn-sm"> {t("Contact Teacher")} </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
