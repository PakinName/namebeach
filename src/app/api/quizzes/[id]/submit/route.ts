import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getActiveSession } from '@/lib/auth';
import { canTakeQuiz, processQuizCompletion } from '@/lib/progression';
import { issueEligibleCertificates } from '@/lib/student-overview';
const schema=z.object({revision:z.string(),answers:z.array(z.object({questionId:z.string().max(100),selectedOptionId:z.string().max(100).optional(),textAnswer:z.string().trim().max(10000).optional()})).min(1).max(100)});
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const session=await getActiveSession();if(session?.user.role!=='STUDENT')return NextResponse.json({success:false},{status:403});const{id}=await params;const input=schema.safeParse(await request.json().catch(()=>null));if(!input.success)return NextResponse.json({success:false,error:'Invalid answers. Reload the quiz.'},{status:400});
 try{
 const quiz=await prisma.quiz.findUnique({where:{id},include:{questions:{where:{active:true},orderBy:{orderIndex:'asc'},include:{options:true}}}});
 if(!quiz)return NextResponse.json({success:false},{status:404});if(!await canTakeQuiz(session.user.id,quiz.chapterId))return NextResponse.json({success:false,error:'เรียนทุกเรื่องในบทนี้ให้จบก่อนสอบ / Complete all lessons first'},{status:403});
 const {answers,revision}=input.data;if(revision!==quiz.updatedAt.toISOString())return NextResponse.json({success:false,error:'ครูแก้ไขข้อสอบแล้ว กรุณาโหลดใหม่ / Quiz changed. Reload.'},{status:409});
 if(answers.length!==quiz.questions.length||new Set(answers.map(a=>a.questionId)).size!==answers.length||answers.some(a=>{const q=quiz.questions.find(q=>q.id===a.questionId);return !q||(q.questionType==='SHORT_ANSWER'?!a.textAnswer||!!a.selectedOptionId:!!a.textAnswer||!q.options.some(o=>o.id===a.selectedOptionId));}))return NextResponse.json({success:false,error:'กรุณาตอบให้ครบทุกข้อ / Answer every question'},{status:400});
 const pending=quiz.questions.some(q=>q.questionType==='SHORT_ANSWER'),totalPoints=quiz.questions.reduce((n,q)=>n+q.points,0);
 const graded=quiz.questions.map(q=>{const a=answers.find(a=>a.questionId===q.id)!;const isCorrect=q.questionType!=='SHORT_ANSWER'&&q.options.some(o=>o.id===a.selectedOptionId&&o.isCorrect);return {questionId:q.id,selectedOptionId:a.selectedOptionId||null,textAnswer:a.textAnswer||null,isCorrect,awardedPoints:q.questionType==='SHORT_ANSWER'?null:isCorrect?q.points:0};});
 const score=graded.reduce((n,a)=>n+(a.awardedPoints||0),0),percentage=score/totalPoints*100;
 const attempt=await prisma.$transaction(async tx=>{await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${quiz.chapterId}))`;const current=await tx.quiz.findUniqueOrThrow({where:{id}});if(current.updatedAt.toISOString()!==revision)throw new Error('QUIZ_CHANGED');if(await tx.quizAttempt.count({where:{quizId:id,studentId:session.user.id,status:'PENDING'}}))throw new Error('PENDING_REVIEW');return tx.quizAttempt.create({data:{quizId:id,studentId:session.user.id,score,percentage,totalPoints,passingScore:quiz.passingScore,passed:!pending&&percentage>=quiz.passingScore,status:pending?'PENDING':'GRADED',completedAt:new Date(),answers:{create:graded}}});});
 const progress=pending?{passed:false,nextChapterUnlocked:false,nextChapterId:null,message:'ส่งคำตอบแล้ว รอครูตรวจข้อเขียน / Submitted. Awaiting teacher grading.'}:await processQuizCompletion(session.user.id,id,score,percentage,attempt.passingScore);
 if(!pending)await issueEligibleCertificates(session.user.id);
 return NextResponse.json({success:true,data:{attemptId:attempt.id,score,totalPoints,percentage,pending,...progress,questions:pending?[]:quiz.questions.map(q=>({...q,selectedOptionId:graded.find(a=>a.questionId===q.id)?.selectedOptionId,isCorrect:graded.find(a=>a.questionId===q.id)?.isCorrect}))}});
 }catch(e){const code=e instanceof Error?e.message:'';return NextResponse.json({success:false,error:code==='PENDING_REVIEW'?'มีคำตอบรอครูตรวจแล้ว / An attempt is awaiting grading':code==='QUIZ_CHANGED'?'Quiz changed. Reload.':'Could not submit quiz.'},{status:409});}
}
