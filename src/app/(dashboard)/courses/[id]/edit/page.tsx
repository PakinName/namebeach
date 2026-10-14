'use client';
/* eslint-disable @next/next/no-img-element -- Authenticated course uploads are served directly. */
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import PageHeader from '@/components/ui/PageHeader';
import LessonArticle from '@/components/ui/LessonArticle';
import { blankLesson, type EditableCourse, type EditableLesson } from '@/lib/course-editor';

type Asset = { id: string; fileName: string; fileUrl: string; fileType: string; fileSize: number };
type Course = EditableCourse & { id: string };
const move = <T,>(items: T[], index: number, offset: number) => { const copy = [...items]; [copy[index], copy[index + offset]] = [copy[index + offset], copy[index]]; return copy; };
export default function CourseEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [course, setCourse] = useState<Course | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState(false);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const lock = useRef(false);
  const errors: Record<string,string> = {
    FORBIDDEN: 'You can only edit your own courses.', CONFLICT: 'This course changed in another window. Reload before saving again.',
    CONTENT_IN_USE: 'Cannot remove content with student progress, quizzes, or scheduled lessons. Restore it or reload, then unpublish the course if needed.',
    INVALID_COURSE: 'Check required fields, URLs and lesson content before publishing.',
    FILE_TOO_LARGE: 'Choose a non-empty file up to 15 MB.', INVALID_FILE: 'Supported files: PNG, JPG, WebP, PDF, TXT, MD, CSV, DOCX, PPTX and XLSX.',
  };
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/courses/${id}/manage`, { signal: controller.signal }).then(r => r.json()).then(result => {
      if (!result.success) throw new Error('You can only edit your own courses.');
      setCourse(result.data); setAssets(result.assets);
    }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    const navigate = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (dirty && anchor?.href && anchor.target !== '_blank' && !window.confirm(t('Leave without saving your changes?'))) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener('beforeunload', warn); document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', navigate, true); };
  }, [dirty, t]);
  const update = (fn: (current: Course) => Course) => { setCourse(current => current ? fn(current) : current); setDirty(true); setMessage(''); };
  const changeLesson = (patch: Partial<EditableLesson>) => {
    if (!selected) return;
    const [ci, li] = selected;
    update(current => ({ ...current, chapters: current.chapters.map((ch, i) => i === ci ? { ...ch, lessons: ch.lessons.map((l, j) => j === li ? { ...l, ...patch } : l) } : ch) }));
  };
  async function save() {
    if (!course || lock.current) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const payload = { ...course, chapters: course.chapters.map(ch => ({ ...ch, lessons: ch.lessons.map(l => ({ ...l, objectives: l.objectives.map(value => value.trim()).filter(Boolean) })) })) };
      const result = await (await fetch(`/api/courses/${id}/manage`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json();
      if (!result.success) throw new Error(errors[result.error] || 'Could not save your changes. Please try again.');
      setCourse(result.data); setAssets(result.assets); setDirty(false); setMessage('Changes saved successfully.');
    } catch(cause) { setError(cause instanceof Error ? cause.message : 'Could not save your changes. Please try again.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function attach(asset: Asset, target: 'cover' | 'image' | 'file') {
    if (target === 'cover') update(current => ({ ...current, thumbnail: asset.fileUrl }));
    else if (selected && course) {
      const lesson = course.chapters[selected[0]].lessons[selected[1]];
      if (target === 'image') changeLesson({ imageUrls: [...new Set([...lesson.imageUrls, asset.fileUrl])] });
      else changeLesson({ resources: [...new Set([...lesson.resources, asset.fileUrl])] });
    }
  }
  async function upload(file: File | undefined, target: 'cover' | 'image' | 'file') {
    if (!file || lock.current) return;
    if (file.size > 15 * 1024 * 1024) { setError(errors.FILE_TOO_LARGE); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const form = new FormData(); form.set('file', file);
      const result = await (await fetch(`/api/courses/${id}/assets`, { method: 'POST', body: form })).json();
      if (!result.success) throw new Error(errors[result.error] || 'Upload failed. Please try again.');
      setAssets(current => [result.data, ...current]); attach(result.data, target);
      setMessage('File uploaded. Save changes to attach it to the course.');
    } catch(cause) { setError(cause instanceof Error ? cause.message : 'Upload failed. Please try again.'); }
    finally { lock.current = false; setBusy(false); }
  }
  const fileName = (url: string) => assets.find(asset => asset.fileUrl === url)?.fileName || url;
  const current = selected && course ? course.chapters[selected[0]]?.lessons[selected[1]] : null;
  function format(before: string, after = '') {
    if (!current || !textArea.current) return;
    const { selectionStart: start, selectionEnd: end } = textArea.current;
    changeLesson({ content: current.content.slice(0, start) + before + current.content.slice(start, end) + after + current.content.slice(end) });
    requestAnimationFrame(() => { textArea.current?.focus(); textArea.current?.setSelectionRange(start + before.length, end + before.length); });
  }
  if (loading) return <p role="status">{t('Loading content')}</p>;
  if (!course) return <div className="alert alert-error" role="alert">{t(error)} <Link href="/courses">{t('Course library')}</Link></div>;
  return <div className="course-studio">
    <PageHeader eyebrow="YOUR TEACHING STUDIO" title="Manage course" description={course.title} action={<Link target="_blank" href={`/courses/${id}`} className="btn btn-secondary">{t('Preview saved course')} ↗</Link>} />
    <div className="studio-savebar"><span className={`badge ${dirty ? 'badge-warning' : 'badge-success'}`}>{t(dirty ? 'Unsaved changes' : 'All changes saved')}</span><span className="text-sm text-muted">{course.chapters.length} {t('chapters')} · {course.chapters.reduce((n,ch) => n + ch.lessons.length,0)} {t('lessons')}</span><button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => { if (!dirty || window.confirm(t('Discard your changes and reload?'))) window.location.reload(); }}>{t('Reload')}</button><button type="button" className="btn btn-primary" disabled={busy || !dirty} onClick={() => void save()}>{t(busy ? 'Saving...' : 'Save changes')}</button></div>
    {error && <div className="alert alert-error mb-4" role="alert">{t(error)}</div>}{message && <div className="alert alert-success mb-4" role="status">{t(message)}</div>}
    <fieldset disabled={busy} className="builder-fields studio-layout">
      <aside className="card studio-outline"><button type="button" className={`studio-nav ${!selected ? 'selected' : ''}`} onClick={() => { setSelected(null); setExpanded(false); }}>{t('Course details')}</button>
        {course.chapters.map((chapter,ci) => <div key={chapter.id || `new-${ci}`} className="studio-outline-chapter"><strong>{ci + 1}. {chapter.title || t('New chapter')}</strong><div className="flex gap-2 mt-2"><button type="button" aria-label={t('Move chapter up')} disabled={ci === 0} onClick={() => { update(c => ({ ...c, chapters: move(c.chapters,ci,-1) })); setSelected(null); }}>↑</button><button type="button" aria-label={t('Move chapter down')} disabled={ci === course.chapters.length-1} onClick={() => { update(c => ({ ...c, chapters: move(c.chapters,ci,1) })); setSelected(null); }}>↓</button><button type="button" disabled={course.chapters.length === 1} onClick={() => { if (window.confirm(t('Remove this chapter and its lessons?'))) { update(c => ({ ...c, chapters: c.chapters.filter((_,i) => i !== ci) })); setSelected(null); } }}>{t('Remove chapter')}</button></div>
          {chapter.lessons.map((lesson,li) => <button type="button" className={`studio-nav ${selected?.[0] === ci && selected[1] === li ? 'selected' : ''}`} key={lesson.id || `new-${li}`} onClick={() => { setSelected([ci,li]); setPreview(false); }}>{ci+1}.{li+1} {lesson.title || t('New lesson')}</button>)}
          <button type="button" className="btn btn-ghost btn-sm" disabled={chapter.lessons.length >= 50} onClick={() => { update(c => ({ ...c, chapters: c.chapters.map((ch,i) => i === ci ? { ...ch, lessons: [...ch.lessons, blankLesson()] } : ch) })); setSelected([ci,chapter.lessons.length]); }}>{t('Add lesson')} +</button>
        </div>)}
        <button type="button" className="btn btn-secondary w-full mt-4" disabled={course.chapters.length >= 40} onClick={() => { update(c => ({ ...c, chapters: [...c.chapters, { title: '', description: '', lessons: [blankLesson()] }] })); setSelected([course.chapters.length,0]); }}>{t('Add chapter')} +</button>
      </aside>
      <section className="card builder-form-card studio-panel">
      {!current || !selected ? <><h2>{t('Course details')}</h2><p className="text-muted mb-6">{t('Update your course information and publishing status.')}</p>
        <label className="form-label" htmlFor="edit-title">{t('Course topic')} *</label><input id="edit-title" className="form-input mb-4" maxLength={200} value={course.title} onChange={e => update(c => ({ ...c, title: e.target.value }))} />
        <label className="form-label" htmlFor="edit-description">{t('Course description')} *</label><textarea id="edit-description" className="form-textarea mb-4" rows={5} maxLength={5000} value={course.description} onChange={e => update(c => ({ ...c, description: e.target.value }))} />
        <div className="manual-course-grid"><div><label className="form-label" htmlFor="edit-category">{t('Course category')} *</label><input id="edit-category" className="form-input mb-4" maxLength={100} value={course.category} onChange={e => update(c => ({ ...c, category: e.target.value }))} /></div><div><label className="form-label" htmlFor="edit-level">{t('Difficulty')}</label><select id="edit-level" className="form-select" value={course.difficulty} onChange={e => update(c => ({ ...c, difficulty: e.target.value as Course['difficulty'] }))}>{['BEGINNER','INTERMEDIATE','ADVANCED'].map(level => <option key={level} value={level}>{t(level)}</option>)}</select></div></div>
        <label className="form-label" htmlFor="publish-status">{t('Publishing status')}</label><select id="publish-status" className="form-select mb-4" value={String(course.published)} onChange={e => update(c => ({ ...c, published: e.target.value === 'true' }))}><option value="false">{t('Draft — visible to you and administrators')}</option><option value="true">{t('Published — visible to students')}</option></select>
        <p className="form-helper mb-6">{t('Publishing changes take effect after saving. Existing student progress is preserved.')}</p>
        <label className="form-label" htmlFor="course-cover">{t('Course cover image')}</label><input id="course-cover" type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { void upload(e.target.files?.[0],'cover'); e.target.value=''; }} />
        {course.thumbnail && <div className="studio-cover mt-4"><img src={course.thumbnail} alt={t('Course cover image')} /><button type="button" className="btn btn-secondary mt-2" onClick={() => update(c => ({ ...c, thumbnail: '' }))}>{t('Remove image')}</button></div>}
      </> : <>
        <div className="studio-chapter-fields"><label className="form-label" htmlFor="edit-chapter">{t('Chapter title')} *</label><input id="edit-chapter" className="form-input mb-4" value={course.chapters[selected[0]].title} maxLength={200} onChange={e => update(c => ({ ...c, chapters: c.chapters.map((ch,i) => i === selected[0] ? { ...ch, title: e.target.value } : ch) }))} /><label className="form-label" htmlFor="edit-chapter-description">{t('Chapter description')}</label><textarea id="edit-chapter-description" className="form-textarea mb-4" rows={2} maxLength={2000} value={course.chapters[selected[0]].description} onChange={e => update(c => ({ ...c, chapters: c.chapters.map((ch,i) => i === selected[0] ? { ...ch, description: e.target.value } : ch) }))} /></div>
        <div className="flex-between mb-4"><h2>{t('Edit lesson')}</h2><div className="flex gap-2"><button type="button" className="btn btn-secondary btn-sm" disabled={selected[1] === 0} onClick={() => { const [ci,li]=selected; update(c => ({...c,chapters:c.chapters.map((ch,i)=> i===ci ? {...ch,lessons:move(ch.lessons,li,-1)}:ch)})); setSelected([ci,li-1]); }}>↑</button><button type="button" className="btn btn-secondary btn-sm" disabled={selected[1] === course.chapters[selected[0]].lessons.length-1} onClick={() => { const [ci,li]=selected; update(c => ({...c,chapters:c.chapters.map((ch,i)=> i===ci ? {...ch,lessons:move(ch.lessons,li,1)}:ch)})); setSelected([ci,li+1]); }}>↓</button><button type="button" className="btn btn-secondary btn-sm" disabled={course.chapters[selected[0]].lessons.length===1} onClick={() => { if(window.confirm(t('Remove this lesson?'))) { const [ci,li]=selected;update(c=>({...c,chapters:c.chapters.map((ch,i)=>i===ci?{...ch,lessons:ch.lessons.filter((_,j)=>j!==li)}:ch)}));setSelected([ci,0]); } }}>{t('Remove lesson')}</button></div></div>
        <label className="form-label" htmlFor="edit-lesson-title">{t('Lesson title')} *</label><input id="edit-lesson-title" className="form-input mb-4" maxLength={200} value={current.title} onChange={e => changeLesson({title:e.target.value})} />
        <label className="form-label" htmlFor="edit-lesson-description">{t('Lesson summary')}</label><textarea id="edit-lesson-description" className="form-textarea mb-4" maxLength={5000} rows={2} value={current.description} onChange={e => changeLesson({description:e.target.value})} />
        <div className={`studio-article-editor ${expanded ? 'expanded' : ''}`}><div className="studio-toolbar"><strong>{t('Lesson content')}</strong><button type="button" onClick={() => format('**','**')}>{t('Bold')}</button><button type="button" onClick={() => format('\n## ')}>{t('Heading')}</button><button type="button" onClick={() => format('\n- ')}>{t('List')}</button><button type="button" onClick={() => format('\n```\n','\n```\n')}>{t('Code')}</button><button type="button" onClick={() => setPreview(!preview)}>{t(preview ? 'Edit' : 'Preview')}</button><button type="button" onClick={() => setExpanded(!expanded)}>{t(expanded ? 'Collapse editor' : 'Expand editor')}</button></div>{preview ? <div className="studio-article-preview"><LessonArticle content={current.content} /></div> : <textarea ref={textArea} aria-label={t('Lesson content')} className="form-textarea" rows={16} maxLength={100000} value={current.content} onChange={e => changeLesson({content:e.target.value})} />}<p className="form-helper">{current.content.length.toLocaleString()} / 100,000 · {t('Markdown: headings, bold, lists and code. HTML is displayed as text.')}</p></div>
        <label className="form-label mt-6" htmlFor="edit-objectives">{t('Learning objectives (one per line)')}</label><textarea id="edit-objectives" className="form-textarea mb-4" rows={3} value={current.objectives.join('\n')} onChange={e => changeLesson({ objectives:e.target.value.split('\n') })} />
        <label className="form-label" htmlFor="edit-time">{t('Duration (minutes)')}</label><input id="edit-time" type="number" className="form-input mb-4" min={1} max={1440} value={current.estimatedTime || ''} onChange={e => changeLesson({estimatedTime:Number(e.target.value)})} />
        <label className="form-label" htmlFor="edit-video">{t('Video URL (YouTube or direct MP4)')}</label><input id="edit-video" type="url" className="form-input mb-4" value={current.videoUrl} onChange={e => changeLesson({videoUrl:e.target.value})} />
        <label className="form-label" htmlFor="edit-code">{t('Code Example')}</label><textarea id="edit-code" className="form-textarea mb-4" rows={4} value={current.codeExample} onChange={e => changeLesson({codeExample:e.target.value})} />
        <label className="form-label" htmlFor="lesson-images">{t('Lesson images')}</label><input id="lesson-images" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{void upload(e.target.files?.[0],'image');e.target.value='';}} /><div className="studio-image-grid mt-4">{current.imageUrls.map((url,i)=><figure key={url}><img src={url} alt={`${t('Lesson images')} ${i+1}`} /><button type="button" onClick={()=>changeLesson({imageUrls:current.imageUrls.filter((_,j)=>j!==i)})}>{t('Remove image')}</button></figure>)}</div>
        <label className="form-label mt-6" htmlFor="lesson-files">{t('Attach learning files')}</label><input id="lesson-files" type="file" accept=".pdf,.txt,.md,.csv,.docx,.pptx,.xlsx" onChange={e=>{void upload(e.target.files?.[0],'file');e.target.value='';}} />
        <p className="form-helper">{t('Up to 15 MB per file. Uploaded files stay in this course library for reuse.')}</p>
        {current.resources.map((url,i)=><div key={url} className="studio-file-row"><a href={url} target="_blank" rel="noopener noreferrer">{fileName(url)}</a><button type="button" onClick={()=>changeLesson({resources:current.resources.filter((_,j)=>j!==i)})}>{t('Detach')}</button></div>)}
        <label className="form-label mt-4" htmlFor="edit-pdf">{t('PDF preview URL')}</label><input id="edit-pdf" className="form-input mb-4" value={current.pdfUrl} onChange={e=>changeLesson({pdfUrl:e.target.value})} />
        <label className="form-label" htmlFor="edit-slides">{t('Slide URL')}</label><input id="edit-slides" className="form-input" value={current.slideUrl} onChange={e=>changeLesson({slideUrl:e.target.value})} />
      </>}
      <details className="studio-assets mt-6"><summary>{t('Course file library')} ({assets.length})</summary><p className="form-helper">{t('Upload first, then attach files here to reuse them. Detaching does not delete the original file.')}</p>{assets.map(asset=><div className="studio-file-row" key={asset.id}><a href={asset.fileUrl} target="_blank" rel="noopener noreferrer">{asset.fileName} <small>({Math.ceil(asset.fileSize/1024)} KB)</small></a><div className="flex gap-2 flex-wrap">{asset.fileType.startsWith('image/') ? <button type="button" onClick={()=>attach(asset,selected?'image':'cover')}>{t(selected?'Add image':'Use as cover')}</button> : selected && <><button type="button" onClick={()=>attach(asset,'file')}>{t('Attach')}</button>{asset.fileType==='application/pdf' && <button type="button" onClick={()=>changeLesson({pdfUrl:asset.fileUrl})}>{t('Use PDF preview')}</button>}</>}</div></div>)}</details>
      </section>
    </fieldset>
  </div>;
}
