'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import PageHeader from '@/components/ui/PageHeader';
import Icon from '@/components/ui/Icon';
import type { CourseDraft } from '@/lib/course-draft';
import type { GenerationEvent } from '@/lib/course-generation';

export default function CourseBuilderPage() {
  const { t, language } = useLanguage();
  const { data: session, status } = useSession();
  const [draft, setDraft] = useState<CourseDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ completed: 0, total: 5, title: '' });
  const [notice, setNotice] = useState('');
  const controller = useRef<AbortController | null>(null);
  const saveLock = useRef(false);
  const preview = useRef<HTMLElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const messages: Record<string,string> = { QUOTA_EXHAUSTED: 'The AI project quota is exhausted. Wait for the quota to reset or ask the administrator to review the plan and billing.',
    OLLAMA_OFFLINE: 'Ollama is offline. Please open Ollama on the computer running this website.',
    GENERATION_BUSY: 'Another course is being generated. Please try again when it finishes.',
    PDF_NO_TEXT: 'This PDF has no readable text. Use a text-based PDF, TXT or Markdown file.',
    NOT_CONFIGURED: 'Gemini is not configured. Please ask the administrator to enable it.',
    SERVICE_BUSY: 'The AI service is busy. Please try again shortly or use lesson search.',
    RATE_LIMITED: 'Too many questions. Please try again in a few minutes.',
    TIMEOUT: 'The response took too long. Please try again.',
    FILE_TOO_LARGE: 'Please choose a file smaller than 5 MB.',
    INVALID_FILE: 'Use a valid PDF, TXT, or Markdown file. Text files must be under 30,000 characters.',
    INVALID_INPUT: 'Please complete the course title and syllabus.',
    INVALID_KEY: 'The AI service rejected access. Please ask the administrator to check the API key and permissions.',
    MODEL_UNAVAILABLE: 'This AI model is unavailable. Please ask the administrator to update the model.',
    FORBIDDEN: 'Only teachers and administrators can create courses.',
    INVALID_DRAFT: 'The generated draft was incomplete. Please try a shorter syllabus.',
    SAVE_FAILED: 'Could not save the draft. Please try again.',
  };
  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (controller.current || saving) return;
    const form = new FormData(event.currentTarget); form.set('language',language);
    const file = form.get('reference');
    if (file instanceof File && file.size > 5 * 1024 * 1024) { setError(messages.FILE_TOO_LARGE); return; }
    const active = new AbortController(); controller.current = active;
    setBusy(true); setError(''); setNotice(''); setProgress({completed:0,total:5,title:''});
    try {
      const response = await fetch('/api/ai/generate-course', { method: 'POST', body: form, signal: active.signal });
      if (!response.ok) { const result = await response.json(); throw new Error(messages[result.error] || 'Could not get a response. Please try again.'); }
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Could not get a response. Please try again.');
      const decoder = new TextDecoder(); let buffer = ''; let complete = false;
      try {
        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, {stream:!done});
          const lines = buffer.split('\n'); buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as GenerationEvent;
            if (event.type === 'progress') setProgress(event);
            if (event.type === 'reference' && event.truncated) setNotice('Using the first 6,000 reference characters (up to 20 PDF pages).');
            if (event.type === 'error') throw new Error(messages[event.error] || 'Could not get a response. Please try again.');
            if (event.type === 'complete') { complete=true; setDraft(event.data); setSavedId(''); }
          }
          if (done) break;
        }
      } finally { await reader.cancel().catch(()=>{}); reader.releaseLock(); }
      if (!complete) throw new Error('The response took too long. Please try again.');
      requestAnimationFrame(() => preview.current?.scrollIntoView({ behavior:'smooth', block:'start' }));
    } catch (cause) { if (!active.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not get a response. Please try again.'); else setNotice('Generation stopped. You can start again.'); }
    finally { setBusy(false); controller.current = null; }
  }
  async function save() {
    if (!draft || saveLock.current || savedId) return;
    saveLock.current = true; setSaving(true); setError('');
    try {
      const response = await fetch('/api/courses/drafts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(draft) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(messages[result.error] || messages.SAVE_FAILED);
      setSavedId(result.data.id);
    } catch(cause) { setError(cause instanceof Error ? cause.message : messages.SAVE_FAILED); }
    finally { saveLock.current = false; setSaving(false); }
  }
  if (status === 'loading') return <p role="status">{t('Loading content')}</p>;
  if (!session || !['TEACHER','ADMIN'].includes(session.user.role)) return <div className="card p-6"><p>{t(messages.FORBIDDEN)}</p><Link href="/courses" className="btn btn-primary mt-4">{t('Course library')}</Link></div>;
  return <div className="course-builder"><PageHeader title="Create a course with AI" eyebrow="YOUR TEACHING STUDIO" description="Turn your syllabus into a structured learning experience." action={<Link href="/courses/new" className="btn btn-secondary">{t("Create a course yourself")}</Link>} />
    <section className="card builder-form-card"><div className="builder-intro"><span className="stat-card-icon"><Icon name="spark" /></span><div><h2>{t('Tell AI what you want to teach')}</h2><p>{t('Qwen3 via Ollama creates your course locally, without API charges.')}</p></div></div>
      <form onSubmit={generate}><fieldset disabled={busy || saving} className="builder-fields">
        <div className="form-group"><label htmlFor="course-title" className="form-label">{t('Course topic')} <span aria-hidden="true">*</span></label><input id="course-title" name="title" className="form-input" minLength={2} maxLength={200} required placeholder={t('For example: Introduction to Python')} /></div>
        <div className="form-group"><label htmlFor="course-description" className="form-label">{t('Course description')}</label><textarea id="course-description" name="description" className="form-textarea" rows={3} maxLength={3000} placeholder={t('Describe your learners and what they should achieve.')} /></div>
        <div className="form-group"><label htmlFor="course-syllabus" className="form-label">{t('Weekly syllabus')} <span aria-hidden="true">*</span></label><textarea id="course-syllabus" name="syllabus" className="form-textarea" rows={5} minLength={5} maxLength={6000} required placeholder={t('Week 1: Fundamentals\nWeek 2: Examples and practice\nWeek 3: Apply your skills')} /></div>
        <div className="form-group"><label htmlFor="course-reference" className="form-label">{t('Reference document (optional)')}</label><div className="builder-upload"><Icon name="file" size={24} /><input type="file" id="course-reference" name="reference" accept=".pdf,.txt,.md" aria-describedby="reference-help" /></div><p className="form-helper" id="reference-help">{t('PDF, TXT, or Markdown · Up to 5 MB. Text files: up to 30,000 characters.')}</p><p className="form-helper">{t('References are processed on this computer. Scanned PDFs require OCR first.')}</p></div>
        <button type="submit" className="btn btn-primary btn-lg w-full"><Icon name="spark" size={18} />{t(busy ? 'Creating your course draft…' : draft ? 'Generate another draft' : 'Generate course outline')}</button>
      </fieldset>{busy && <div className="flex-between mt-4"><p className="text-sm text-muted" role="status">{t(progress.completed === 0 ? 'Preparing the course outline…' : 'Writing lesson content…')} {progress.title} ({progress.completed}/{progress.total})</p><button type="button" className="btn btn-secondary btn-sm" onClick={() => controller.current?.abort()}>{t('Stop')}</button></div>}</form>
      <p className="builder-note"><Icon name="eye" size={15} />{t('Review first. Nothing is published automatically.')}</p>
    </section>
    {notice && <div className="alert alert-info mt-4" role="status">{t(notice)}</div>}
    {busy && <div className="progress-container mt-4" role="progressbar" aria-label={t('Creating your course draft…')} aria-valuenow={progress.completed} aria-valuemax={progress.total} aria-valuemin={0}><div className="progress-bar" style={{width:(progress.completed/progress.total*100)+'%'}} /></div>}
    {error && <div className="alert alert-error mt-4" role="alert">{t(error)}</div>}
    {draft && <section className="card builder-preview mt-6" ref={preview}><div className="card-header"><h2>{t('Review your course draft')}</h2><span className="badge badge-warning">{t('Draft')}</span></div><div className="card-body"><label className="form-label" htmlFor="draft-title">{t('Course topic')}</label><input id="draft-title" className="form-input mb-4" value={draft.title} minLength={2} maxLength={200} disabled={saving || !!savedId || busy} onChange={event => setDraft({...draft,title:event.target.value})} /><p className="text-sm text-muted mb-4">{draft.description}</p><div className="flex gap-2 mb-6"><span className="badge badge-primary">{draft.chapters.length} {t('chapters')}</span><span className="badge badge-info">{draft.category}</span></div>
      {draft.chapters.map((chapter,index) => <details key={index} className="builder-chapter" open><summary>{index+1}. {chapter.title}</summary><p>{chapter.description}</p>{chapter.lessons.map((lesson,i) => <article key={i} className="builder-lesson"><h3>{index+1}.{i+1} {lesson.title}</h3><small>{lesson.estimatedTime} {t('min')}</small><ul>{lesson.objectives.map((objective,j) => <li key={j}>{objective}</li>)}</ul><p className="builder-content">{lesson.content}</p></article>)}</details>)}
      {savedId ? <div className="alert alert-success" role="status">{t('Draft saved. It is visible only to you and administrators.')} <Link href={'/courses/'+savedId+'/edit'}>{t('Manage course')} →</Link> <Link href={'/courses/'+savedId}>{t('Open saved course')} →</Link></div> : <button className="btn btn-primary mt-4" disabled={saving || busy || draft.title.trim().length < 2} onClick={() => void save()}><Icon name="check" size={17} />{t(saving ? 'Saving...' : 'Save course draft')}</button>}</div></section>}
  </div>;
}
