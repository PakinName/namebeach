'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  category: string;
  difficulty: string;
  estimatedTime: number | null;
  teacher: { name: string };
  _count: { chapters: number };
  progress?: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (data.success) setCourses(data.data);
      } catch (err) {
        console.error('Courses error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const categories = ['all', ...new Set(courses.map((c) => c.category))];

  const filtered = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || c.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const difficultyColor = (d: string) => {
    switch (d) {
      case 'BEGINNER': return 'badge-success';
      case 'INTERMEDIATE': return 'badge-warning';
      case 'ADVANCED': return 'badge-danger';
      default: return 'badge-primary';
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">📚 Courses</h1>
          <p className="page-subtitle">Explore and enroll in courses to start learning</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6" style={{ padding: 'var(--space-4) var(--space-6)' }}>
        <div className="flex gap-4 flex-wrap items-center">
          <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
            <span className="input-icon">🔍</span>
            <input
              className="form-input"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 150 }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">No courses found</div>
          <div className="empty-state-description">
            {search || filterCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Courses will appear here once created'}
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ height: '100%' }}>
                <div
                  style={{
                    height: 140,
                    background: `linear-gradient(135deg, var(--primary-500), var(--accent-500))`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                  }}
                >
                  📖
                </div>
                <div className="card-body">
                  <div className="flex gap-2 mb-2">
                    <span className={`badge ${difficultyColor(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                    <span className="badge badge-info">{course.category}</span>
                  </div>
                  <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                    {course.title}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    {course.description.slice(0, 100)}...
                  </p>
                  <div className="flex-between" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    <span>👤 {course.teacher.name}</span>
                    <span>📖 {course._count.chapters} chapters</span>
                  </div>
                  {course.progress !== undefined && course.progress > 0 && (
                    <div style={{ marginTop: 'var(--space-3)' }}>
                      <div className="progress-container progress-sm">
                        <div
                          className="progress-bar"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-right mt-1" style={{ color: 'var(--primary-500)' }}>
                        {course.progress}% complete
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
