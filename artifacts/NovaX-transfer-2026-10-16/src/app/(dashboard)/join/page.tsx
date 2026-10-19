'use client';
import { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useResource } from '@/hooks/useResource';
import CourseAccessControls from '@/components/ui/CourseAccessControls';
import type { CourseSummary } from '@/components/ui/CourseCard';
export default function JoinCourses(){
 const {language}=useLanguage(),tr=(th:string,en:string)=>language==='th'?th:en;
 const {data,loading,error,reload}=useResource<CourseSummary[]>('/api/courses');
 const [search,setSearch]=useState(''),[joined,setJoined]=useState(false);
 const courses=(data||[]).filter(c=>c.published&&Boolean(c.enrolled)===joined&&(c.title+' '+c.teacher.name).toLowerCase().includes(search.toLowerCase()));
 return <div><p className="eyebrow">NovaX</p><h1>{tr('เข้าร่วมคอร์สเรียน','Join a course')}</h1><p className="mb-6">{tr('เลือกห้องเรียนหรือวิชาของคุณ กรอกรหัสที่ได้รับจากครู แล้วเริ่มเรียนได้เลย','Choose your class or course, enter your teacher’s code and start learning.')}</p><div className="flex gap-2 mb-6"><button aria-pressed={!joined} className={!joined?'btn btn-primary':'btn btn-secondary'} onClick={()=>setJoined(false)}>{tr('เลือกคอร์สเข้าร่วม','Find courses')}</button><button aria-pressed={joined} className={joined?'btn btn-primary':'btn btn-secondary'} onClick={()=>setJoined(true)}>{tr('คอร์สที่เข้าร่วมแล้ว','Joined courses')}</button></div><label className="form-label">{tr('ค้นหาวิชาหรือชื่อครู','Search course or teacher')}<input className="form-input mb-6" value={search} onChange={e=>setSearch(e.target.value)}/></label>{loading&&<p>{tr('กำลังโหลด…','Loading…')}</p>}{error&&<p role="alert">{error}<button className="btn btn-secondary" onClick={reload}>{tr('ลองใหม่','Retry')}</button></p>}<div className="grid-2">{courses.map(c=><article className="card card-body" key={c.id}><span className="badge badge-primary">{c.requiresCode?tr('ใช้รหัสจากครู','Teacher code required'):tr('เข้าร่วมได้โดยไม่ใช้รหัส','Open enrollment')}</span><h2 className="mt-4">{c.title}</h2><p>{c.teacher.name}</p><p className="mb-4">{c.description}</p><CourseAccessControls id={c.id} teacher={false} requiresCode={c.requiresCode} enrolled={c.enrolled} reload={reload}/></article>)}</div>{!loading&&!error&&!courses.length&&<p className="card card-body">{joined?tr('ยังไม่มีคอร์สที่เข้าร่วม ลองเลือกคอร์สในแท็บแรก','No joined courses. Find a course in the first tab.'):tr('ไม่พบคอร์สที่ตรงกับคำค้น','No matching courses.')}</p>}</div>;
}
