'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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
  completed: boolean;
  chapter: {
    id: string;
    title: string;
    courseId: string;
    course: { id: string; title: string };
  };
}

export default function LessonPage() {
  const params = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
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

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/lessons/${params.id}/complete`, { method: 'POST' });
      const data = await res.json();
      if (data.success) setCompleted(true);
    } catch {
      // silently fail
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: 400 }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <div className="empty-state-title">{error}</div>
        <Link href="/courses" className="btn btn-primary mt-4">Back to Courses</Link>
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
    <div className="animate-fadeIn" style={{ maxWidth: 900, margin: '0 auto' }}>
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

      {/* Lesson Header */}
      <div className="card mb-6">
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
              <span className="badge badge-info">⏱️ {lesson.estimatedTime} min</span>
            )}
            {completed && <span className="badge badge-success">✅ Completed</span>}
          </div>
        </div>
      </div>

      {/* Learning Objectives */}
      {lesson.objectives.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 style={{ fontWeight: 600 }}>🎯 Learning Objectives</h3>
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
            <h3 style={{ fontWeight: 600 }}>🎬 Video Lesson</h3>
          </div>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
            <iframe
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
            />
          </div>
        </div>
      )}

      {/* Content */}
      {lesson.content && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 style={{ fontWeight: 600 }}>📖 Lesson Content</h3>
          </div>
          <div className="card-body">
            <div style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              {lesson.content.split('\n').map((line, i) => (
                <p key={i} style={{ marginBottom: 'var(--space-3)' }}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Code Example */}
      {lesson.codeExample && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 style={{ fontWeight: 600 }}>💻 Code Example</h3>
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
            <h3 style={{ fontWeight: 600 }}>📄 PDF Document</h3>
          </div>
          <div className="card-body">
            <iframe
              src={lesson.pdfUrl}
              style={{ width: '100%', height: 600, border: 'none', borderRadius: 'var(--radius-lg)' }}
              title="PDF Viewer"
            />
          </div>
        </div>
      )}

      {/* Resources */}
      {lesson.resources.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 style={{ fontWeight: 600 }}>📚 Resources</h3>
          </div>
          <div className="card-body">
            <ul style={{ paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {lesson.resources.map((res, i) => (
                <li key={i}>
                  <a href={res} target="_blank" rel="noopener noreferrer">{res}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Mark as Complete */}
      <div className="card mb-6">
        <div className="card-body text-center" style={{ padding: 'var(--space-8)' }}>
          {completed ? (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>✅</div>
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Lesson Completed!</h3>
              <Link href={`/courses/${lesson.chapter.courseId}`} className="btn btn-primary mt-4">
                📚 Back to Course
              </Link>
            </div>
          ) : (
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Finished this lesson?</h3>
              <p className="text-muted mb-4">Mark it as complete to track your progress</p>
              <button
                onClick={handleComplete}
                className={`btn btn-success btn-lg ${completing ? 'btn-loading' : ''}`}
                disabled={completing}
              >
                {completing ? 'Saving...' : '✅ Mark as Complete'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contact Support */}
      <div className="card" style={{ background: 'var(--surface-2)' }}>
        <div className="card-body text-center" style={{ padding: 'var(--space-5)' }}>
          <p className="text-sm text-muted">
            Need help? <Link href="/support" style={{ fontWeight: 500 }}>Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
