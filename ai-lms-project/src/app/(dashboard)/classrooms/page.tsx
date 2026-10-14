'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Classroom {
  id: string;
  name: string;
  description: string | null;
  code: string;
  teacher: { id: string; name: string };
  _count: { members: number; lessons: number; announcements: number };
  createdAt: string;
}

export default function ClassroomsPage() {
  const { data: session } = useSession();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';

  const fetchClassrooms = async () => {
    try {
      const res = await fetch('/api/classrooms');
      const data = await res.json();
      if (data.success) setClassrooms(data.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClassrooms(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, description: formDesc }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setFormName('');
        setFormDesc('');
        fetchClassrooms();
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to create classroom');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode }),
      });
      const data = await res.json();
      if (data.success) {
        setShowJoin(false);
        setJoinCode('');
        fetchClassrooms();
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to join classroom');
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏫 Classrooms</h1>
          <p className="page-subtitle">
            {isTeacher ? 'Manage your classrooms' : 'Your enrolled classrooms'}
          </p>
        </div>
        <div className="flex gap-3">
          {isTeacher ? (
            <button onClick={() => setShowCreate(true)} className="btn btn-primary">
              ➕ Create Classroom
            </button>
          ) : (
            <button onClick={() => setShowJoin(true)} className="btn btn-primary">
              🔑 Join Classroom
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Classroom</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Classroom Name</label>
                  <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="e.g., CS101 Section A" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <textarea className="form-textarea" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Describe your classroom..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Join Classroom</h3>
              <button className="modal-close" onClick={() => setShowJoin(false)}>✕</button>
            </div>
            <form onSubmit={handleJoin}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Invite Code</label>
                  <input className="form-input" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} required placeholder="Enter classroom code" maxLength={6} style={{ textAlign: 'center', fontSize: 'var(--text-xl)', letterSpacing: '0.2em', fontWeight: 600 }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowJoin(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classrooms Grid */}
      {loading ? (
        <div className="grid-3">
          {[1, 2, 3].map((i) => (<div key={i} className="skeleton skeleton-card" />))}
        </div>
      ) : classrooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏫</div>
          <div className="empty-state-title">No classrooms yet</div>
          <div className="empty-state-description">
            {isTeacher ? 'Create your first classroom to get started' : 'Join a classroom with an invite code'}
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {classrooms.map((classroom) => (
            <Link key={classroom.id} href={`/classrooms/${classroom.id}`} style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ height: '100%' }}>
                <div style={{
                  height: 100,
                  background: 'linear-gradient(135deg, var(--secondary-500), var(--primary-500))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                }}>🏫</div>
                <div className="card-body">
                  <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                    {classroom.name}
                  </h3>
                  {classroom.description && (
                    <p className="text-sm text-muted mb-3">{classroom.description.slice(0, 80)}...</p>
                  )}
                  <div className="flex gap-3 text-xs text-muted">
                    <span>👤 {classroom._count.members} members</span>
                    <span>📖 {classroom._count.lessons} lessons</span>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="flex-between text-xs text-muted">
                    <span>👨‍🏫 {classroom.teacher.name}</span>
                    {isTeacher && <span className="badge badge-primary">Code: {classroom.code}</span>}
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
