'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useResource } from '@/hooks/useResource';
type Course={courseId:string;title:string;totalLessons:number;completedLessons:number;progressPercent:number;status:string;nextLesson:{id:string;title:string}|null;quizzes:{id:string;title:string;passed:boolean;highestScore:number|null;passingScore:number;pending:boolean;ready:boolean}[]};
export default function StudentOverview(){
  const {language}=useLanguage(),tr=(th:string,en:string)=>language==='th'?th:en;
  const {data,loading,error,reload}=useResource<Course[]>('/api/learning-overview');
  useEffect(()=>{void fetch('/api/certificates',{method:'POST'});},[]);
  const states={IN_PROGRESS:tr('กำลังเรียน','In progress'),COMPLETED:tr('เรียนสำเร็จ','Completed'),NOT_STARTED:tr('ยังไม่ได้เริ่ม','Not started')};
  return <section><div className="section-heading"><h2>{tr('ความก้าวหน้าของฉัน','My learning progress')}</h2><Link className="btn btn-primary" href="/certificates">{tr('เกียรติบัตรของฉัน','My certificates')}</Link></div>{error&&<button onClick={reload}>{error}</button>}{loading?<p>Loading…</p>:Object.entries(states).map(([key,label])=><section className="mb-6" key={key}><h2 className="mb-4">{label} ({data?.filter(c=>c.status===key).length||0})</h2><div className="grid-2">{data?.filter(c=>c.status===key).map(course=><article className="card card-body" key={course.courseId}><h3>{course.title}</h3><p>{course.completedLessons}/{course.totalLessons} {tr('บทเรียน','lessons')} · {course.progressPercent}%</p><progress style={{width:'100%',accentColor:'var(--primary-500)'}} value={course.progressPercent} max={100}/>{course.quizzes.map(quiz=><p key={quiz.id}>{quiz.ready?<Link href={`/quizzes/${quiz.id}`}>{quiz.title}</Link>:<span>{quiz.title} · {tr('เรียนบทนี้ให้จบก่อน','Complete this chapter first')}</span>} · {quiz.pending?tr('รอครูตรวจข้อเขียน','Awaiting teacher grading'):quiz.highestScore===null?tr('ยังไม่ได้สอบ','Not attempted'):`${quiz.highestScore.toFixed(1)}% · ${quiz.passed?tr('ผ่าน','Passed'):tr('ไม่ผ่าน','Not passed')}`}</p>)}<Link className="btn btn-secondary mt-4" href={course.nextLesson?`/lessons/${course.nextLesson.id}`:`/courses/${course.courseId}`}>{course.nextLesson?tr('เรียนต่อ','Continue learning'):tr('ดูรายวิชา','View course')}</Link></article>)}</div></section>)}</section>;
}
