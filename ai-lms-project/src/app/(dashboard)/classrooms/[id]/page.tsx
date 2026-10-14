'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ClassroomDetail {
  id: string;
  name: string;
  description: string | null;
  code: string;
  teacher: { id: string; name: string; email: string };
  members: Array<{ student: { id: string; name: string; email: string }; joinedAt: string }>;
  announcements: Array<{ id: string; title: string; content: string; pinned: boolean; author: { name: string }; createdAt: string }>;
  fileUploads: Array<{ id: string; fileName: string; fileUrl: string; fileType: string; fileSize: number; uploader: { name: string }; createdAt: string }>;
  lessons: Array<{ lesson: { id: string; title: string; description: string | null; estimatedTime: number | null } }>;
  _count: { members: number };
}

export default function ClassroomDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [posting, setPosting] = useState(false);

  const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const res = await fetch(`/api/classrooms/${params.id}`);
        const data = await res.json();
        if (data.success) setClassroom(data.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchClassroom();
  }, [params.id]);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    try {
      const res = await fetch(`/api/classrooms/${params.id}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: announcementTitle, content: announcementContent }),
      });
      const data = await res.json();
      if (data.success && classroom) {
        setClassroom({
          ...classroom,
          announcements: [data.data, ...classroom.announcements],
        });
        setAnnouncementTitle('');
        setAnnouncementContent('');
      }
    } catch {
      // silently fail
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (<div className="flex-center" style={{ minHeight: 400 }}><div className="spinner spinner-lg" /></div>);
  }

  if (!classroom) {
    return (<div className="empty-state"><div className="empty-state-icon">❌</div><div className="empty-state-title">Classroom not found</div></div>);
  }

  const tabs = ['overview', 'lessons', 'announcements', 'members', 'files'];

  return (
    <div className="animate-fadeIn">
      <nav className="breadcrumb">
        <span className="breadcrumb-item"><Link href="/classrooms">Classrooms</Link></span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">{classroom.name}</span>
      </nav>

      {/* Header Card */}
      <div className="card mb-6">
        <div style={{ height: 120, background: 'linear-gradient(135deg, var(--secondary-500), var(--primary-600))', display: 'flex', alignItems: 'center', padding: '0 var(--space-8)' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{classroom.name}</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'var(--text-sm)' }}>
              👨‍🏫 {classroom.teacher.name} · 👥 {classroom._count.members} members
            </p>
          </div>
          {isTeacher && (
            <span className="badge" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 'var(--text-sm)', padding: '6px 14px' }}>
              Code: {classroom.code}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container mb-6">
        <div className="tabs-list">
          {tabs.map((tab) => (
            <button key={tab} className={`tab-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'overview' ? '📋 Overview' :
               tab === 'lessons' ? '📖 Lessons' :
               tab === 'announcements' ? '📢 Announcements' :
               tab === 'members' ? '👥 Members' : '📁 Files'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-panel">
        {activeTab === 'overview' && (
          <div className="grid-2">
            <div className="card"><div className="card-body">
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>About</h3>
              <p className="text-muted">{classroom.description || 'No description provided.'}</p>
            </div></div>
            <div className="card"><div className="card-body">
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Quick Stats</h3>
              <div className="flex-col gap-3">
                <div className="flex-between"><span className="text-muted">Members</span><strong>{classroom._count.members}</strong></div>
                <div className="flex-between"><span className="text-muted">Lessons</span><strong>{classroom.lessons.length}</strong></div>
                <div className="flex-between"><span className="text-muted">Announcements</span><strong>{classroom.announcements.length}</strong></div>
                <div className="flex-between"><span className="text-muted">Files</span><strong>{classroom.fileUploads.length}</strong></div>
              </div>
            </div></div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="flex-col gap-3">
            {classroom.lessons.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📖</div><div className="empty-state-title">No lessons linked</div></div>
            ) : (
              classroom.lessons.map((cl) => (
                <Link key={cl.lesson.id} href={`/lessons/${cl.lesson.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card card-hover">
                    <div className="card-body flex gap-4 items-center">
                      <div style={{ fontSize: '1.5rem' }}>📖</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cl.lesson.title}</div>
                        {cl.lesson.description && <div className="text-sm text-muted">{cl.lesson.description.slice(0, 100)}</div>}
                      </div>
                      {cl.lesson.estimatedTime && <span className="badge badge-info">⏱️ {cl.lesson.estimatedTime} min</span>}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div>
            {isTeacher && (
              <div className="card mb-6">
                <div className="card-body">
                  <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Post Announcement</h3>
                  <form onSubmit={handlePostAnnouncement}>
                    <div className="form-group">
                      <input className="form-input" placeholder="Title" value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <textarea className="form-textarea" placeholder="Content..." value={announcementContent} onChange={(e) => setAnnouncementContent(e.target.value)} required style={{ minHeight: 80 }} />
                    </div>
                    <button className={`btn btn-primary ${posting ? 'btn-loading' : ''}`} disabled={posting}>📢 Post</button>
                  </form>
                </div>
              </div>
            )}
            <div className="flex-col gap-3">
              {classroom.announcements.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📢</div><div className="empty-state-title">No announcements yet</div></div>
              ) : (
                classroom.announcements.map((a) => (
                  <div key={a.id} className="card">
                    <div className="card-body">
                      <div className="flex-between mb-2">
                        <h4 style={{ fontWeight: 600 }}>{a.pinned && '📌 '}{a.title}</h4>
                        <span className="text-xs text-muted">{new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-muted">{a.content}</p>
                      <div className="text-xs text-muted mt-2">By {a.author.name}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontWeight: 600 }}>Members ({classroom.members.length})</h3>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Name</th><th>Email</th><th>Joined</th></tr></thead>
                <tbody>
                  <tr><td><div className="flex gap-2 items-center"><div className="avatar avatar-sm">T</div>{classroom.teacher.name}</div></td><td>{classroom.teacher.email}</td><td><span className="badge badge-primary">Teacher</span></td></tr>
                  {classroom.members.map((m) => (
                    <tr key={m.student.id}>
                      <td><div className="flex gap-2 items-center"><div className="avatar avatar-sm">{m.student.name[0]}</div>{m.student.name}</div></td>
                      <td>{m.student.email}</td>
                      <td>{new Date(m.joinedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="flex-col gap-3">
            {classroom.fileUploads.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📁</div><div className="empty-state-title">No files uploaded</div></div>
            ) : (
              classroom.fileUploads.map((f) => (
                <div key={f.id} className="card card-hover">
                  <div className="card-body flex gap-4 items-center">
                    <div style={{ fontSize: '1.5rem' }}>{f.fileType.includes('pdf') ? '📄' : f.fileType.includes('video') ? '🎬' : f.fileType.includes('image') ? '🖼️' : '📁'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{f.fileName}</div>
                      <div className="text-xs text-muted">{f.uploader.name} · {(f.fileSize / 1024).toFixed(0)} KB</div>
                    </div>
                    <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">⬇️ Download</a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
