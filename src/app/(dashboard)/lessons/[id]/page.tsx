'use client';
/* eslint-disable @next/next/no-img-element -- Authenticated lesson images. */
import LessonCheckpoint from '@/components/learning/LessonCheckpoint';
import LessonArticle from '@/components/ui/LessonArticle';
import { useLanguage } from '@/components/providers/LanguageProvider';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  slideUrl: string | null;
  imageUrls: string[];
  codeExample: string | null;
  estimatedTime: number | null;
  objectives: string[];
  resources: string[];
  nextLesson?:{id:string;title:string}|null;checkpointId?:string;
  completed: boolean;
  canManage: boolean;
  canComplete: boolean;
  resourceNames: Record<string,string>;
  chapter: {
    id: string;
    title: string;
    courseId: string;
    course: { id: string; title: string };
  };
}

export default function LessonPage() {
  const { t } = useLanguage();

  const params = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await fetch(`/api/lessons/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setLesson(data.data);
          setCompleted(data.data.completed);
        } else {
          setError(data.error);
        }
      } catch {
        setError('Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: 400 }}>
        <div className="spinner spinner-lg" role="status" aria-label={t("Loading content")} />
      </div>
    );
  }

  if (error && !lesson) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Icon name="book" size={28} /></div>
        <div className="empty-state-title">{t(error)}</div>
        <Link href="/courses" className="btn btn-primary mt-4">{t("Back to Courses")}</Link>
      </div>
    );
  }

  if (!lesson) return null;

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
    return match ? match[1] : null;
  };

  return (
    <div id="lesson-content" className="animate-fadeIn" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <span className="breadcrumb-item">
          <Link href={`/courses/${lesson.chapter.courseId}`}>{lesson.chapter.course.title}</Link>
        </span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item">
          <Link href={`/courses/${lesson.chapter.courseId}`}>{lesson.chapter.title}</Link>
        </span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">{lesson.title}</span>
      </nav>

      {error && <div className="alert alert-error" role="alert">{t(error)}</div>}
      {lesson.canManage && <Link href={'/courses/'+lesson.chapter.courseId+'/edit'} className="btn btn-secondary mb-4">{t('Manage course')}</Link>}
      {/* Lesson Header */}
      <div className="card mb-6 detail-hero">
        <div className="card-body" style={{ padding: 'var(--space-8)' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
            {lesson.title}
          </h1>
          {lesson.description && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              {lesson.description}
            </p>
          )}
          <div className="flex gap-3 flex-wrap">
            {lesson.estimatedTime && (
              <span className="badge badge-info"> {lesson.estimatedTime} {t("min")}</span>
            )}
            {completed && <span className="badge badge-success"> {t("Completed")}</span>}
          </div>
        </div>
      </div>

      <div className="lesson-assistant-banner mb-6"><span className="stat-card-icon"><Icon name="spark" /></span><div><strong>{t("Make this lesson clearer.")}</strong><p>{t("Ask a question, get a summary, or work through an example.")}</p></div><Link href={`/assistant?lessonId=${lesson.id}&summary=1`} className="btn btn-primary btn-sm">{t("Ask about this lesson")}<Icon name="arrow" size={15} /></Link></div>
      {/* Learning Objectives */}
      {lesson.objectives.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 style={{ fontWeight: 600 }}> {t("Learning Objectives")}</h3>
          </div>
          <div className="card-body">
            <ul style={{ paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {lesson.objectives.map((obj, i) => (
                <li key={i} style={{ color: 'var(--text-secondary)' }}>{obj}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Video */}
      {lesson.videoUrl && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 style={{ fontWeight: 600 }}> {t("Video Lesson")}</h3>
          </div>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
            {getYouTubeId(lesson.videoUrl) ? <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(lesson.videoUrl)}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allowFullScreen
              title={lesson.title}
            /> : <video controls src={lesson.videoUrl} style={{position: 'absolute', width: '100%', height: '100%'}} />}
          </div>
        </div>
      )}

      {/* Content */}
      {lesson.content && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 style={{ fontWeight: 600 }}> {t("Lesson Content")}</h3>
          </div>
          <div className="card-body">
            <LessonArticle content={lesson.content} />
          </div>
        </div>
      )}

      {lesson.imageUrls.length > 0 && <section className="card card-body mb-6"><h3>{t('Lesson images')}</h3><div className="lesson-image-gallery">{lesson.imageUrls.map((url,i)=><a key={url} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={lesson.title+' — '+(i+1)} loading="lazy" /></a>)}</div></section>}
      {lesson.slideUrl && <a href={lesson.slideUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary mb-6">{t('Open slides')} ↗</a>}
      {/* Code Example */}
      {lesson.codeExample && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 style={{ fontWeight: 600 }}> {t("Code Example")}</h3>
          </div>
          <div className="card-body">
            <pre
              style={{
                background: 'var(--bg-tertiary)',
                padding: 'var(--space-5)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.6,
              }}
            >
              <code>{lesson.codeExample}</code>
            </pre>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      {lesson.pdfUrl && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 style={{ fontWeight: 600 }}> {t("PDF Document")}</h3>
          </div>
          <div className="card-body">
            <iframe
              src={lesson.pdfUrl}
              sandbox="allow-same-origin"
              style={{ width: '100%', height: 600, border: 'none', borderRadius: 'var(--radius-lg)' }}
              title={t("PDF Viewer")}
            />
          </div>
        </div>
      )}

      {/* Resources */}
      {lesson.resources.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 style={{ fontWeight: 600 }}> {t("Resources")}</h3>
          </div>
          <div className="card-body">
            <ul style={{ paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {lesson.resources.map((res, i) => (
                <li key={i}>
                  <a href={res} target="_blank" rel="noopener noreferrer">{lesson.resourceNames?.[res] || res}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <LessonCheckpoint key={lesson.id} lessonId={lesson.id} onPassed={()=>setCompleted(true)} />
      {/* Mark as Complete */}
      {lesson.canComplete && <div className="card mb-6">
        <div className="card-body text-center" style={{ padding: 'var(--space-8)' }}>
          {completed&&<div className="mb-4">{lesson.nextLesson?<Link href={`/lessons/${lesson.nextLesson.id}`} className="btn btn-primary">{t('Next lesson')}: {lesson.nextLesson.title}</Link>:lesson.checkpointId?<Link href={`/quizzes/${lesson.checkpointId}`} className="btn btn-primary">{t('Take Quiz')}</Link>:null}</div>}
          {completed ? (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}></div>
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>{t("Lesson Completed!")}</h3>
              <Link href={`/courses/${lesson.chapter.courseId}`} className="btn btn-primary mt-4"> {t("Back to Course")} </Link>
            </div>
          ) : (
            <p className="text-muted">{t('Complete the lesson checkpoint above to continue.')}</p>
          )}
        </div>
      </div>

      }
      {/* Contact Support */}
      <div className="card" style={{ background: 'var(--surface-2)' }}>
        <div className="card-body text-center" style={{ padding: 'var(--space-5)' }}>
          <p className="text-sm text-muted"> {t("Need help?")} <Link href="/support" style={{ fontWeight: 500 }}>{t("Contact Support")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
