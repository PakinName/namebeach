'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardData {
  role: string;
  totalCourses?: number;
  completedChapters?: number;
  lockedChapters?: number;
  averageScore?: number;
  totalStudents?: number;
  activeClassrooms?: number;
  averageQuizScore?: number;
  courseProgress?: Array<{
    courseId: string;
    courseTitle: string;
    category: string;
    totalChapters: number;
    completedChapters: number;
    progressPercent: number;
  }>;
  recentQuizzes?: Array<{
    id: string;
    percentage: number;
    passed: boolean;
    quiz: { title: string };
    startedAt: string;
  }>;
  recentActivities?: Array<{
    type: string;
    message: string;
    createdAt: string;
  }>;
  announcements?: Array<{
    id: string;
    title: string;
    content: string;
    author: { name: string };
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (data.success) setDashboard(data.data);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          </div>
        </div>
        <div className="grid-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: 140 }} />
          ))}
        </div>
      </div>
    );
  }

  const isTeacher = dashboard?.role === 'TEACHER';

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back, {session?.user?.name} 👋
          </h1>
          <p className="page-subtitle">
            {isTeacher
              ? 'Manage your courses and track student progress'
              : 'Continue your learning journey'}
          </p>
        </div>
        <div className="flex gap-3">
          {isTeacher ? (
            <Link href="/courses" className="btn btn-primary">
              ➕ Create Course
            </Link>
          ) : (
            <Link href="/courses" className="btn btn-primary">
              📚 Browse Courses
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4 mb-8">
        {isTeacher ? (
          <>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon stat-icon-primary">👨‍🎓</div>
              </div>
              <div className="stat-card-value">{dashboard?.totalStudents || 0}</div>
              <div className="stat-card-label">Total Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon stat-icon-success">📚</div>
              </div>
              <div className="stat-card-value">{dashboard?.totalCourses || 0}</div>
              <div className="stat-card-label">Total Courses</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon stat-icon-warning">🏫</div>
              </div>
              <div className="stat-card-value">{dashboard?.activeClassrooms || 0}</div>
              <div className="stat-card-label">Active Classrooms</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon stat-icon-info">📊</div>
              </div>
              <div className="stat-card-value">{dashboard?.averageQuizScore || 0}%</div>
              <div className="stat-card-label">Avg Quiz Score</div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon stat-icon-primary">📚</div>
              </div>
              <div className="stat-card-value">{dashboard?.totalCourses || 0}</div>
              <div className="stat-card-label">Enrolled Courses</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon stat-icon-success">✅</div>
              </div>
              <div className="stat-card-value">{dashboard?.completedChapters || 0}</div>
              <div className="stat-card-label">Completed Chapters</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon stat-icon-warning">🔒</div>
              </div>
              <div className="stat-card-value">{dashboard?.lockedChapters || 0}</div>
              <div className="stat-card-label">Locked Chapters</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon stat-icon-info">📊</div>
              </div>
              <div className="stat-card-value">{dashboard?.averageScore || 0}%</div>
              <div className="stat-card-label">Avg Quiz Score</div>
            </div>
          </>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid-2">
        {/* Course Progress / Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontWeight: 600 }}>
              {isTeacher ? '📋 Recent Activity' : '📊 Course Progress'}
            </h3>
          </div>
          <div className="card-body">
            {isTeacher ? (
              dashboard?.recentActivities && dashboard.recentActivities.length > 0 ? (
                <div className="timeline">
                  {dashboard.recentActivities.map((activity, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <div style={{ fontSize: 'var(--text-sm)' }}>{activity.message}</div>
                        <div className="timeline-date">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title">No activity yet</div>
                  <div className="empty-state-description">
                    Student activities will appear here
                  </div>
                </div>
              )
            ) : (
              dashboard?.courseProgress && dashboard.courseProgress.length > 0 ? (
                <div className="flex-col gap-4">
                  {dashboard.courseProgress.map((cp) => (
                    <Link
                      key={cp.courseId}
                      href={`/courses/${cp.courseId}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="flex-between mb-2">
                          <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                            {cp.courseTitle}
                          </span>
                          <span className="badge badge-primary">{cp.category}</span>
                        </div>
                        <div className="progress-label">
                          <span className="text-sm text-muted">
                            {cp.completedChapters}/{cp.totalChapters} chapters
                          </span>
                          <span className="progress-text">{cp.progressPercent}%</span>
                        </div>
                        <div className="progress-container progress-md">
                          <div
                            className="progress-bar"
                            style={{ width: `${cp.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <div className="empty-state-icon">📚</div>
                  <div className="empty-state-title">No courses yet</div>
                  <div className="empty-state-description">
                    Start by browsing available courses
                  </div>
                  <Link href="/courses" className="btn btn-primary mt-4">
                    Browse Courses
                  </Link>
                </div>
              )
            )}
          </div>
        </div>

        {/* Recent Quizzes / Announcements */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontWeight: 600 }}>
              {isTeacher ? '📢 Announcements' : '📝 Recent Quizzes'}
            </h3>
          </div>
          <div className="card-body">
            {!isTeacher && dashboard?.recentQuizzes && dashboard.recentQuizzes.length > 0 ? (
              <div className="flex-col gap-3">
                {dashboard.recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="flex-between" style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                        {quiz.quiz.title}
                      </div>
                      <div className="text-xs text-muted">
                        {new Date(quiz.startedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`badge ${quiz.passed ? 'badge-success' : 'badge-danger'}`}>
                      {quiz.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              dashboard?.announcements && dashboard.announcements.length > 0 ? (
                <div className="flex-col gap-3">
                  {dashboard.announcements.map((a) => (
                    <div key={a.id} style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{a.title}</div>
                      <div className="text-xs text-muted mt-1">
                        By {a.author.name} · {new Date(a.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <div className="empty-state-icon">📝</div>
                  <div className="empty-state-title">Nothing here yet</div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
