'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

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
  const { t, language } = useLanguage();

  const params = useParams();
  const { data: session } = useSession();
  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const res = await fetch(`/api/classrooms/${params.id}`);
        const data = await res.json();
        if (data.success) setClassroom(data.data);
      } catch {
        setError('Could not load this classroom. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchClassroom();
  }, [params.id]);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posting) return;
    setPosting(true); setError('');
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
      } else { setError(data.error || 'Could not post this announcement.'); }
    } catch {
      setError('Could not post this announcement. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (<div className="flex-center" style={{ minHeight: 400 }}><div className="spinner spinner-lg" role="status" aria-label={t("Loading content")} /></div>);
  }

  if (!classroom) {
    return (<div className="empty-state"><div className="empty-state-icon"><Icon name="book" size={28} /></div><div className="empty-state-title">{t("Classroom not found")}</div></div>);
  }

  const tabs = ['overview', 'lessons', 'announcements', 'members', 'files'];

  return (
    <div className="animate-fadeIn">
      <nav className="breadcrumb">
        <span className="breadcrumb-item"><Link href="/classrooms">{t("Classrooms")}</Link></span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">{classroom.name}</span>
      </nav>

      {/* Header Card */}
      <div className="card mb-6">
        <div style={{ height: 120, background: '#315c42', display: 'flex', alignItems: 'center', padding: '0 var(--space-8)' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{classroom.name}</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'var(--text-sm)' }}>
               {classroom.teacher.name} ·  {classroom._count.members} {t("members")} </p>
          </div>
          {isTeacher && (
            <span className="badge" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 'var(--text-sm)', padding: '6px 14px' }}> {t("Code:")} {classroom.code}
            </span>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error" role="alert">{t(error)}</div>}
      {/* Tabs */}
      <div className="tabs-container mb-6">
        <div className="tabs-list">
          {tabs.map((tab) => (
            <button key={tab} aria-pressed={activeTab === tab} className={`tab-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'overview' ? t(" Overview") :
               tab === 'lessons' ? t(" Lessons") :
               tab === 'announcements' ? t(" Announcements") :
               tab === 'members' ? t(" Members") : t(" Files")}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-panel">
        {activeTab === 'overview' && (
          <div className="grid-2">
            <div className="card"><div className="card-body">
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>{t("About")}</h3>
              <p className="text-muted">{classroom.description || t("No description provided.")}</p>
            </div></div>
            <div className="card"><div className="card-body">
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>{t("Quick Stats")}</h3>
              <div className="flex-col gap-3">
                <div className="flex-between"><span className="text-muted">{t("Members")}</span><strong>{classroom._count.members}</strong></div>
                <div className="flex-between"><span className="text-muted">{t("Lessons")}</span><strong>{classroom.lessons.length}</strong></div>
                <div className="flex-between"><span className="text-muted">{t("Announcements")}</span><strong>{classroom.announcements.length}</strong></div>
                <div className="flex-between"><span className="text-muted">{t("Files")}</span><strong>{classroom.fileUploads.length}</strong></div>
              </div>
            </div></div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="flex-col gap-3">
            {classroom.lessons.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon"><Icon name="book" size={28} /></div><div className="empty-state-title">{t("No lessons linked")}</div></div>
            ) : (
              classroom.lessons.map((cl) => (
                <Link key={cl.lesson.id} href={`/lessons/${cl.lesson.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card card-hover">
                    <div className="card-body flex gap-4 items-center">
                      <div style={{ fontSize: '1.5rem' }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cl.lesson.title}</div>
                        {cl.lesson.description && <div className="text-sm text-muted">{cl.lesson.description.slice(0, 100)}</div>}
                      </div>
                      {cl.lesson.estimatedTime && <span className="badge badge-info"> {cl.lesson.estimatedTime} {t("min")}</span>}
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
                  <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>{t("Post Announcement")}</h3>
                  <form onSubmit={handlePostAnnouncement}>
                    <div className="form-group">
                      <input className="form-input" aria-label={t("Announcement title")} placeholder={t("Title")} value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <textarea className="form-textarea" aria-label={t("Announcement content")} placeholder={t("Content...")} value={announcementContent} onChange={(e) => setAnnouncementContent(e.target.value)} required style={{ minHeight: 80 }} />
                    </div>
                    <button className={`btn btn-primary ${posting ? 'btn-loading' : ''}`} disabled={posting}> {t("Post")}</button>
                  </form>
                </div>
              </div>
            )}
            <div className="flex-col gap-3">
              {classroom.announcements.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon"><Icon name="book" size={28} /></div><div className="empty-state-title">{t("No announcements yet")}</div></div>
              ) : (
                classroom.announcements.map((a) => (
                  <div key={a.id} className="card">
                    <div className="card-body">
                      <div className="flex-between mb-2">
                        <h4 style={{ fontWeight: 600 }}>{a.pinned && " "}{a.title}</h4>
                        <span className="text-xs text-muted">{new Date(a.createdAt).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-GB')}</span>
                      </div>
                      <p className="text-muted">{a.content}</p>
                      <div className="text-xs text-muted mt-2">{t("By")} {a.author.name}</div>
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
              <h3 style={{ fontWeight: 600 }}>{t("Members (")}{classroom.members.length})</h3>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>{t("Name")}</th><th>{t("Email")}</th><th>{t("Joined")}</th></tr></thead>
                <tbody>
                  <tr><td><div className="flex gap-2 items-center"><div className="avatar avatar-sm">{t("T")}</div>{classroom.teacher.name}</div></td><td>{classroom.teacher.email}</td><td><span className="badge badge-primary">{t("Teacher")}</span></td></tr>
                  {classroom.members.map((m) => (
                    <tr key={m.student.id}>
                      <td><div className="flex gap-2 items-center"><div className="avatar avatar-sm">{m.student.name[0]}</div>{m.student.name}</div></td>
                      <td>{m.student.email}</td>
                      <td>{new Date(m.joinedAt).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-GB')}</td>
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
              <div className="empty-state"><div className="empty-state-icon"><Icon name="book" size={28} /></div><div className="empty-state-title">{t("No files uploaded")}</div></div>
            ) : (
              classroom.fileUploads.map((f) => (
                <div key={f.id} className="card card-hover">
                  <div className="card-body flex gap-4 items-center">
                    <div style={{ fontSize: '1.5rem' }}>{f.fileType.includes('pdf') ? "" : f.fileType.includes('video') ? "" : f.fileType.includes('image') ? "" : ""}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{f.fileName}</div>
                      <div className="text-xs text-muted">{f.uploader.name} · {(f.fileSize / 1024).toFixed(0)} {t("KB")}</div>
                    </div>
                    <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm"> {t("Download")}</a>
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
