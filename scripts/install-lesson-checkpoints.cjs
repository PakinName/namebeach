/* eslint-disable @typescript-eslint/no-require-imports */
// Add only missing per-lesson checkpoints. Never modify chapter exams or historical attempts.
require('dotenv').config({path:'.env.local',quiet:true});
const {PrismaClient}=require('@prisma/client');
const bank=require('./lesson-checkpoint-bank.json');
const p=new PrismaClient();
async function main(){
 if(!['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname))throw Error('Local database required');
 const lessons=await p.lesson.findMany({include:{chapter:true,checkpoint:true},orderBy:{orderIndex:'asc'}});
 let added=0,skipped=0;
 for(const lesson of lessons){
 if(lesson.checkpoint)continue;
 const rows=bank[lesson.chapter.title];if(!rows){skipped++;continue;}
 const questions=rows.map((row,i)=>{const options=row.slice(1,4);const shift=(i+lesson.orderIndex)%3;const rotated=[...options.slice(shift),...options.slice(0,shift)];return {questionText:row[0],options:rotated,correctIndex:rotated.indexOf(row[1]),explanation:row[4]};});
 // These additional study notes make the checkpoint's coverage explicit even for sparse demo lessons.
 const reviewText='สรุปเสริมสำหรับเรื่องนี้ / Additional review notes: '+lesson.title+'\n\n'+rows.map((row,i)=>(i+1)+'. '+row[4]).join('\n');
 await p.lessonCheckpoint.create({data:{lessonId:lesson.id,questions,reviewText}});added++;
 }
 console.log(JSON.stringify({added,needsTeacherQuestions:skipped}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>p.$disconnect());
