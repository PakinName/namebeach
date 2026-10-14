'use client';
import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import PageHeader from '@/components/ui/PageHeader';
import { courseDraftSchema, type CourseDraft } from '@/lib/course-draft';

const newLesson = () => ({ title: '', content: '', objectives: [''], estimatedTime: 15 });
const newChapter = () => ({ title: '', description: '', lessons: [newLesson()] });

export default function NewCoursePage() {
  const { t,language } = useLanguage();
  const [published,setPublished]=useState(false);
  const { data: session, status } = useSession();
  const [course, setCourse] = useState<CourseDraft>({ title: '', description: '', category: '', difficulty: 'BEGINNER', chapters: [newChapter()] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState('');
  const lock = useRef(false);
  function chapterChange(index: number, patch: Partial<CourseDraft['chapters'][number]>) {
    setCourse(current => ({ ...current, chapters: current.chapters.map((chapter, i) => i === index ? { ...chapter, ...patch } : chapter) }));
  }
  function lessonChange(chapterIndex: number, lessonIndex: number, patch: Partial<ReturnType<typeof newLesson>>) {
    setCourse(current => ({ ...current, chapters: current.chapters.map((chapter, i) => i === chapterIndex ? { ...chapter, lessons: chapter.lessons.map((lesson, j) => j === lessonIndex ? { ...lesson, ...patch } : lesson) } : chapter) }));
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || savedId) return;
    const payload = { ...course, chapters: course.chapters.map(chapter => ({ ...chapter, lessons: chapter.lessons.map(lesson => ({ ...lesson, objectives: lesson.objectives.map(value => value.trim()).filter(Boolean) })) })) };
    if (!courseDraftSchema.safeParse(payload).success) { setError('Complete all required fields. Use 1–8 objectives per lesson, one per line.'); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const response = await fetch('/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({...payload,published}) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error === 'INVALID_COURSE' ? 'Complete all required fields. Use 1–8 objectives per lesson, one per line.' : 'Could not save the course. Your entries are still here. Please try again.');
      setSavedId(result.data.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save the course. Your entries are still here. Please try again.'); }
    finally { lock.current = false; setBusy(false); }
  }
  if (status === 'loading') return <p role="status">{t('Loading content')}</p>;
  if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) return <div className="card p-6">{t('Only teachers and administrators can create courses.')} <Link href="/courses">{t('Course library')}</Link></div>;
  return <div className="course-builder manual-course">
    <PageHeader title="Create a course yourself" eyebrow="YOUR TEACHING STUDIO" description="Write your own course and lessons. No AI required." action={<Link href="/courses" className="btn btn-secondary">{t('Course library')}</Link>} />
    {savedId ? <section className="card builder-form-card" role="status"><h2>{published?t('Course published successfully'):(language==='th'?'บันทึกฉบับร่างแล้ว':'Draft saved')}</h2><p className="mt-4">{published?t('Your course is now in the library and available to students.'):(language==='th'?'นักเรียนยังไม่เห็นคอร์สนี้ กดเผยแพร่เมื่อพร้อม':'Students cannot see this draft. Publish when ready.')}</p><div className="flex gap-2 flex-wrap mt-6"><Link className="btn btn-primary" href={'/courses/' + savedId + '/edit'}>{t('Manage course')}</Link><Link className="btn btn-secondary" href={'/courses/' + savedId}>{t('Open saved course')}</Link><Link className="btn btn-secondary" href="/courses">{t('Course library')}</Link></div></section> :
    <form onSubmit={submit}><fieldset className="builder-fields" disabled={busy}>
      <section className="card builder-form-card mb-6"><h2 className="mb-4">{t('Course details')}</h2>
        <div className="form-group"><label className="form-label" htmlFor="manual-title">{t('Course topic')} *</label><input id="manual-title" className="form-input" required minLength={2} maxLength={200} value={course.title} onChange={e => setCourse({ ...course, title: e.target.value })} /></div>
        <div className="form-group"><label className="form-label" htmlFor="manual-description">{t('Course description')} *</label><textarea id="manual-description" className="form-textarea" required maxLength={5000} rows={3} value={course.description} onChange={e => setCourse({ ...course, description: e.target.value })} /></div>
        <div className="manual-course-grid"><div className="form-group"><label className="form-label" htmlFor="manual-category">{t('Course category')} *</label><input id="manual-category" className="form-input" required maxLength={100} value={course.category} onChange={e => setCourse({ ...course, category: e.target.value })} /></div><div className="form-group"><label className="form-label" htmlFor="manual-level">{t('Difficulty')}</label><select id="manual-level" className="form-select" value={course.difficulty} onChange={e => setCourse({ ...course, difficulty: e.target.value as CourseDraft['difficulty'] })}>{(['BEGINNER','INTERMEDIATE','ADVANCED'] as const).map(level => <option key={level} value={level}>{t(level[0] + level.slice(1).toLowerCase())}</option>)}</select></div></div>
      </section>
      {course.chapters.map((chapter, ci) => <section key={ci} className="card builder-form-card mb-6" aria-label={t('Chapter {0}', [ci + 1])}>
        <div className="flex-between mb-4"><h2>{t('Chapter {0}', [ci + 1])}</h2>{course.chapters.length > 1 && <button className="btn btn-secondary btn-sm" type="button" onClick={() => { if (window.confirm(t('Remove this chapter and its lessons?'))) setCourse({ ...course, chapters: course.chapters.filter((_, i) => i !== ci) }); }}>{t('Remove chapter')}</button>}</div>
        <div className="form-group"><label className="form-label" htmlFor={`chapter-${ci}`}>{t('Chapter title')} *</label><input id={`chapter-${ci}`} className="form-input" required maxLength={200} value={chapter.title} onChange={e => chapterChange(ci, { title: e.target.value })} /></div>
        <div className="form-group"><label className="form-label" htmlFor={`chapter-description-${ci}`}>{t('Chapter description')}</label><textarea id={`chapter-description-${ci}`} className="form-textarea" maxLength={2000} rows={2} value={chapter.description} onChange={e => chapterChange(ci, { description: e.target.value })} /></div>
        {chapter.lessons.map((lesson, li) => <div className="builder-lesson" key={li}>
          <div className="flex-between mb-4"><h3>{t('Lesson {0}', [`${ci + 1}.${li + 1}`])}</h3>{chapter.lessons.length > 1 && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { if (window.confirm(t('Remove this lesson?'))) chapterChange(ci, { lessons: chapter.lessons.filter((_, i) => i !== li) }); }}>{t('Remove lesson')}</button>}</div>
          <div className="form-group"><label className="form-label" htmlFor={`lesson-${ci}-${li}`}>{t('Lesson title')} *</label><input id={`lesson-${ci}-${li}`} className="form-input" required maxLength={200} value={lesson.title} onChange={e => lessonChange(ci, li, { title: e.target.value })} /></div>
          <div className="form-group"><label className="form-label" htmlFor={`content-${ci}-${li}`}>{t('Lesson content')} *</label><textarea id={`content-${ci}-${li}`} className="form-textarea" required maxLength={12000} rows={8} value={lesson.content} onChange={e => lessonChange(ci, li, { content: e.target.value })} /></div>
          <div className="form-group"><label className="form-label" htmlFor={`objectives-${ci}-${li}`}>{t('Learning objectives (one per line)')} *</label><textarea id={`objectives-${ci}-${li}`} className="form-textarea" required rows={3} maxLength={4007} value={lesson.objectives.join('\n')} onChange={e => lessonChange(ci, li, { objectives: e.target.value.split('\n') })} /><p className="form-helper">{t('1–8 objectives, up to 500 characters each.')}</p></div>
          <div className="form-group"><label className="form-label" htmlFor={`time-${ci}-${li}`}>{t('Duration (minutes)')} *</label><input id={`time-${ci}-${li}`} className="form-input" type="number" required min={1} max={240} value={lesson.estimatedTime || ''} onChange={e => lessonChange(ci, li, { estimatedTime: Number(e.target.value) })} /></div>
        </div>)}
        <button className="btn btn-secondary mt-4" type="button" disabled={chapter.lessons.length >= 5} onClick={() => chapterChange(ci, { lessons: [...chapter.lessons, newLesson()] })}>{t('Add lesson')}</button>
      </section>)}
      <button type="button" className="btn btn-secondary mb-6" disabled={course.chapters.length >= 8} onClick={() => setCourse({ ...course, chapters: [...course.chapters, newChapter()] })}>{t('Add chapter')}</button>
      <section className="card builder-form-card"><label className="form-label">{language==='th'?'สถานะคอร์ส':'Course status'}<select className="form-select" value={published?'published':'draft'} onChange={e=>setPublished(e.target.value==='published')}><option value="draft">{language==='th'?'บันทึกฉบับร่าง':'Save draft'}</option><option value="published">{language==='th'?'เผยแพร่ทันที':'Publish now'}</option></select></label><p className="text-muted mb-4">{t('Up to 8 chapters and 5 lessons per chapter. Students can see this course after publishing.')}</p><button className="btn btn-primary btn-lg w-full" type="submit">{busy?t('Saving...'):published?t('Save and publish course'):(language==='th'?'บันทึกฉบับร่าง':'Save draft')}</button><p className="form-helper mt-4">{t('Chapters without a quiz unlock the next chapter when all lessons are completed.')}</p></section>
    </fieldset>{error && <div className="alert alert-error mt-4" role="alert">{t(error)}</div>}</form>}
  </div>;
}
