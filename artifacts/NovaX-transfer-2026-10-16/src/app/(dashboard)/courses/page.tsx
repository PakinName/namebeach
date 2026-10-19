'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import CourseAccessControls from '@/components/ui/CourseAccessControls';
import CourseCard, { type CourseSummary } from '@/components/ui/CourseCard';
import { LoadingCards, ErrorNotice } from '@/components/ui/LoadState';
import { useResource } from '@/hooks/useResource';
export default function CoursesPage() {
  const { t,language } = useLanguage();
  const [publication,setPublication]=useState('all');
  const tr=(th:string,en:string)=>language==='th'?th:en;
  const { data: session } = useSession();
  const canCreate = session && ['TEACHER', 'ADMIN'].includes(session.user.role);

  const { data, loading, error, reload } = useResource<CourseSummary[]>('/api/courses');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  useEffect(() => { queueMicrotask(() => setSearch(new URLSearchParams(window.location.search).get('q') || '')); }, []);
  const courses = data || [];
  const categories = ['all', ...new Set(courses.map(course => course.category))];
  const filtered = courses.filter(course => (course.title + course.description).toLowerCase().includes(search.toLowerCase()) && (category === 'all' || course.category === category) && (publication==='all'||(publication==='draft'?!course.published:course.published)));
  return <div className="animate-fadeIn"><PageHeader title={t("Find your next chapter.")} description={t("Explore new ideas, build your skills, and learn at your own pace.")} eyebrow={t("COURSE LIBRARY")} action={canCreate ? <><Link href="/courses/new" className="btn btn-primary">{t("Create a course yourself")}</Link><Link href="/course-builder" className="btn btn-secondary">{t("Create a course with AI")}</Link></> : undefined} />{canCreate&&<div className="flex gap-2 mb-6">{[['all',tr('ทั้งหมด','All')],['draft',tr('ฉบับร่าง','Drafts')],['published',tr('เผยแพร่แล้ว','Published')]].map(([key,label])=><button key={key} className={publication===key?'btn btn-primary':'btn btn-secondary'} onClick={()=>setPublication(key)}>{label} ({courses.filter(c=>key==='all'||(key==='draft'?!c.published:c.published)).length})</button>)}</div>}<div className="filter-bar"><div className="input-group"><span className="input-icon"><Icon name="search" size={18} /></span><input className="form-input" aria-label={t("Search course library")} placeholder={t("What would you like to learn?")} value={search} onChange={e => setSearch(e.target.value)} /></div><select className="form-select" aria-label={t("Course category")} value={category} onChange={e => setCategory(e.target.value)}>{categories.map(item => <option key={item} value={item}>{item === 'all' ? t("All categories") : item}</option>)}</select><span className="filter-count" aria-live="polite">{filtered.length} {t("courses to explore")}</span></div>{loading ? <LoadingCards /> : error ? <ErrorNotice message={error} onRetry={reload} /> : filtered.length ? <div className="grid-3">{filtered.map((course,index) => <div className="course-library-item" key={course.id}><CourseCard course={course} index={index} /><CourseAccessControls id={course.id} teacher={!!canCreate} published={course.published} requiresCode={course.requiresCode} enrolled={course.enrolled} reload={reload}/></div>)}</div> : <EmptyState icon="search" title={courses.length ? t("No matching courses") : t("Your next chapter is on its way")} description={courses.length ? t("Try another topic or clear your filters to see all courses.") : t("Published courses will appear here when they are available.")}>{courses.length > 0 && <button className="btn btn-secondary" onClick={() => { setSearch(''); setCategory('all'); }}>{t("Clear filters")}</button>}</EmptyState>}</div>;
}

