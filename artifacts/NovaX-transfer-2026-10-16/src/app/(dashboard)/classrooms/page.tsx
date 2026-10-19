'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import Dialog from '@/components/ui/Dialog';
import { LoadingCards, ErrorNotice } from '@/components/ui/LoadState';
import { useResource } from '@/hooks/useResource';
interface Classroom { id: string; name: string; description: string | null; code: string; teacher: { name: string }; _count: { members: number; lessons: number } }
export default function ClassroomsPage() {
  const { t } = useLanguage();

  const { data: session } = useSession();
  const { data, loading, error, reload } = useResource<Classroom[]>('/api/classrooms');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const teacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';
  const openDialog = () => { setFormError(''); setOpen(true); };
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (saving) return; setSaving(true); setFormError('');
    try {
      const response = await fetch('/api/classrooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(teacher ? { name, description } : { code: code.trim().toUpperCase() }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not save your classroom.');
      setOpen(false); setName(''); setDescription(''); setCode(''); reload();
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Could not connect. Please try again.'); }
    finally { setSaving(false); }
  }
  return <div className="animate-fadeIn"><PageHeader title={t("Better together.")} description={teacher ? t("Bring your students, lessons, and conversations into one space.") : t("A place to connect with your teachers and keep learning together.")} eyebrow={t("YOUR CLASSROOMS")} action={<button className="btn btn-primary" onClick={openDialog}><Icon name="plus" size={17} />{teacher ? t("Create classroom") : t("Join classroom")}</button>} />{loading ? <LoadingCards /> : error ? <ErrorNotice message={error} onRetry={reload} /> : !data?.length ? <EmptyState icon="users" title={teacher ? t("Create a space for your students") : t("Find your learning community")} description={teacher ? t("Create your first classroom and share its invite code with your students.") : t("Enter the invite code from your teacher to join your classroom.")}><button className="btn btn-primary" onClick={openDialog}>{teacher ? t("Create classroom") : t("Enter invite code")}</button></EmptyState> : <div className="grid-3">{data.map((classroom,index) => <Link key={classroom.id} href={`/classrooms/${classroom.id}`} className="course-card-link"><article className="card card-hover course-card"><div className="course-cover" data-tone={index % 3}><Icon name="users" /><span className="cover-label">{t("Learning community")}</span></div><div className="card-body"><h3>{classroom.name}</h3><p className="course-description">{classroom.description || t("Your shared space for lessons, resources, and classroom updates.")}</p><div className="course-meta"><span><Icon name="users" size={14} />{classroom._count.members} {t("members")}</span><span><Icon name="book" size={14} />{classroom._count.lessons} {t("lessons")}</span></div></div><div className="card-footer"><span className="text-xs text-muted">{classroom.teacher.name}</span>{teacher ? <span className="badge badge-primary">{classroom.code}</span> : <Icon name="arrow" size={16} />}</div></article></Link>)}</div>}{open && <Dialog title={teacher ? t("Create a classroom") : t("Join your classroom")} onClose={() => { if (!saving) setOpen(false); }}><form onSubmit={submit}><div className="modal-body">{formError && <div className="alert alert-error" role="alert">{formError}</div>}{teacher ? <><div className="form-group"><label className="form-label" htmlFor="class-name">{t("Classroom name")}</label><input id="class-name" autoFocus className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder={t("e.g. Introduction to programming")} required maxLength={150} /></div><div className="form-group"><label className="form-label" htmlFor="class-description">{t("Description (optional)")}</label><textarea id="class-description" className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder={t("What will your students learn?")} maxLength={2000} /></div></> : <div className="form-group"><label className="form-label" htmlFor="class-code">{t("Invite code")}</label><input id="class-code" autoFocus className="form-input" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder={t("Enter your classroom code")} required maxLength={6} autoComplete="off" /><p className="form-helper">{t("Ask your teacher for the 6-character classroom code.")}</p></div>}</div><div className="modal-footer"><button type="button" className="btn btn-secondary" disabled={saving} onClick={() => setOpen(false)}>{t("Cancel")}</button><button className="btn btn-primary" disabled={saving}>{saving ? t("Saving...") : teacher ? t("Create classroom") : t("Join classroom")}</button></div></form></Dialog>}</div>;
}

