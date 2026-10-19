import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getActiveSession } from '@/lib/auth';
import { canAccessLesson } from '@/lib/progression';
import { checkpointQuestions, publicQuestions } from '@/lib/lesson-checkpoint';
import { issueEligibleCertificates } from '@/lib/student-overview';
type Context={params:Promise<{id:string}>};
async function access(id:string){
 const session=await getActiveSession();
 if(!session)return null;
 const lesson=await prisma.lesson.findUnique({where:{id},include:{chapter:{select:{course:{select:{teacherId:true}}}}}});
 if(!lesson)return null;
 const manager=session.user.role==='ADMIN'||session.user.role==='TEACHER'&&lesson.chapter.course.teacherId===session.user.id;
 if(!manager&&(session.user.role!=='STUDENT'||!await canAccessLesson(session.user.id,id)))return null;
 return {session,manager,lesson};
}
export async function GET(_:Request,{params}:Context){
 const{id}=await params,a=await access(id);if(!a)return NextResponse.json({error:'Forbidden'},{status:403});
 const checkpoint=await prisma.lessonCheckpoint.findUnique({where:{lessonId:id}});
 const latest=!a.manager?await prisma.lessonCheckAttempt.findFirst({where:{lessonId:id,studentId:a.session.user.id},orderBy:{createdAt:'desc'}}):null;
 const completed=!a.manager&&!!await prisma.lessonCompletion.findUnique({where:{studentId_lessonId:{lessonId:id,studentId:a.session.user.id}}});
 const parsed=checkpoint?checkpointQuestions.safeParse(checkpoint.questions):null;
 return NextResponse.json({success:true,data:{ready:!!parsed?.success,canManage:a.manager,revision:checkpoint?.updatedAt.toISOString()||null,reviewText:checkpoint?.reviewText||'',questions:parsed?.success?(a.manager?parsed.data:publicQuestions(parsed.data)):[],completed,latest:latest?{score:latest.score,passed:latest.passed,createdAt:latest.createdAt}:null}});
}
const editSchema=z.object({revision:z.string().nullable(),reviewText:z.string().max(12000).default(''),questions:checkpointQuestions});
export async function PUT(request:Request,{params}:Context){
 const{id}=await params,a=await access(id);if(!a?.manager)return NextResponse.json({error:'Forbidden'},{status:403});
 const parsed=editSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'ต้องมี 5 ข้อ พร้อมตัวเลือก เฉลย และคำอธิบาย / Provide five complete questions.'},{status:400});
 try{const saved=await prisma.$transaction(async tx=>{
 await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
 const previous=await tx.lessonCheckpoint.findUnique({where:{lessonId:id}});
 if((previous?.updatedAt.toISOString()||null)!==parsed.data.revision)throw new Error('CHANGED');
 const data={questions:parsed.data.questions,reviewText:parsed.data.reviewText};
 return tx.lessonCheckpoint.upsert({where:{lessonId:id},create:{lessonId:id,...data},update:data});
 });return NextResponse.json({success:true,revision:saved.updatedAt.toISOString()});}catch{return NextResponse.json({error:'ข้อสอบเปลี่ยนแล้ว กรุณาโหลดใหม่ / Reload the checkpoint.'},{status:409});}
}
const answersSchema=z.object({revision:z.string(),answers:z.array(z.number().int().min(0).max(3)).length(5)});
export async function POST(request:Request,{params}:Context){
 const{id}=await params,a=await access(id);if(!a||a.session.user.role!=='STUDENT')return NextResponse.json({error:'Forbidden'},{status:403});
 const parsed=answersSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'กรุณาตอบครบ 5 ข้อ / Answer all five questions.'},{status:400});
 try{const result=await prisma.$transaction(async tx=>{
 await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
 const quiz=await tx.lessonCheckpoint.findUnique({where:{lessonId:id}});
 if(!quiz||quiz.updatedAt.toISOString()!==parsed.data.revision)throw new Error('CHANGED');
 const questions=checkpointQuestions.parse(quiz.questions);
 if(parsed.data.answers.some((answer,i)=>answer>=questions[i].options.length))throw new Error('INVALID');
 const score=questions.reduce((n,q,i)=>n+Number(q.correctIndex===parsed.data.answers[i]),0),passed=score>=3;
 await tx.lessonCheckAttempt.create({data:{lessonId:id,studentId:a.session.user.id,score,passed,questions,answers:parsed.data.answers}});
 if(passed)await tx.lessonCompletion.upsert({where:{studentId_lessonId:{studentId:a.session.user.id,lessonId:id}},create:{studentId:a.session.user.id,lessonId:id},update:{}});
 return {score,passed,questions:questions.map((q,i)=>({...q,selectedIndex:parsed.data.answers[i],isCorrect:q.correctIndex===parsed.data.answers[i]}))};
 });
 if(result.passed)await issueEligibleCertificates(a.session.user.id).catch(()=>{});
 return NextResponse.json({success:true,data:result});
 }catch{return NextResponse.json({error:'ข้อสอบเปลี่ยนหรือคำตอบไม่ถูกต้อง กรุณาโหลดใหม่ / Reload and try again.'},{status:409});}
}
