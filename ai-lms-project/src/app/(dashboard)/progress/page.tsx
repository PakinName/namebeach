'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ProgressData {
  courseId: string;
  courseTitle: string;
  category: string;
  totalChapters: number;
  completedChapters: number;
  progressPercent: number;
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (data.success && data.data.courseProgress) {
          setProgress(data.data.courseProgress);
        }
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const overall = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.progressPercent, 0) / progress.length)
    : 0;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Progress</h1>
          <p className="page-subtitle">Track your learning journey across all courses</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="card mb-8">
        <div className="card-body" style={{ padding: 'var(--space-8)' }}>
          <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-4)' }}>Overall Progress</h3>
          <div className="progress-label">
            <span className="text-muted">All Courses</span>
            <span className="progress-text" style={{ fontSize: 'var(--text-2xl)' }}>{overall}%</span>
          </div>
          <div className="progress-container progress-lg">
            <div className="progress-bar" style={{ width: `${overall}%` }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid-2">{[1, 2].map((i) => (<div key={i} className="skeleton skeleton-card" />))}</div>
      ) : progress.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No progress yet</div>
          <div className="empty-state-description">Start a course to track your progress</div>
          <Link href="/courses" className="btn btn-primary mt-4">Browse Courses</Link>
        </div>
      ) : (
        <div className="grid-2">
          {progress.map((p) => (
            <Link key={p.courseId} href={`/courses/${p.courseId}`} style={{ textDecoration: 'none' }}>
              <div className="card card-hover">
                <div className="card-body">
                  <div className="flex-between mb-3">
                    <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.courseTitle}</h3>
                    <span className="badge badge-info">{p.category}</span>
                  </div>
                  <div className="progress-label">
                    <span className="text-sm text-muted">{p.completedChapters}/{p.totalChapters} chapters</span>
                    <span className="progress-text">{p.progressPercent}%</span>
                  </div>
                  <div className="progress-container progress-md">
                    <div className="progress-bar" style={{ width: `${p.progressPercent}%` }} />
                  </div>
                  <div className="text-xs text-muted mt-3">
                    {p.progressPercent === 100 ? '🎉 Course Completed!' : p.progressPercent > 0 ? '📖 In Progress' : '🆕 Not Started'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
