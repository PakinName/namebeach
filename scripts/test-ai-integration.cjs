/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner */
const assert = require('node:assert/strict');
require('dotenv').config({path:'.env.local',quiet:true});
require('dotenv').config({quiet:true});
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient();
const root='http://127.0.0.1:3000';
let cookies=new Map();
async function request(url,options={}){const r=await fetch(root+url,{...options,headers:{...options.headers,cookie:[...cookies].map(([k,v])=>k+'='+v).join('; ')}});for(const c of r.headers.getSetCookie()){const [k,...v]=c.split(';')[0].split('=');cookies.set(k,v.join('='));}return r;}
(async()=>{
 assert.equal((await request('/api/ai/chat')).status,401);
 const csrf=await (await request('/api/auth/csrf')).json();
 await request('/api/auth/callback/credentials',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrfToken:csrf.csrfToken,email:'student@ailms.com',password:'password123',json:'true'}),redirect:'manual'});
 const session=await (await request('/api/auth/session')).json();assert.ok(session.user);
 const call=(body)=>request('/api/ai/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await call({message:''})).status,400);
 const r=await call({message:'ตัวแปร',provider:'local',language:'th'});assert.equal(r.status,200);const result=await r.json();assert.equal(result.data.mode,'lesson-search');assert.ok(result.data.sources.length);assert.match(result.data.reply,/ไม่ได้สร้างคำตอบ/);
 const lessonId=result.data.sources[0].id;
 assert.equal((await call({message:'summarize',provider:'local',lessonId})).status,200);
 const locked=await db.lesson.findFirst({where:{chapter:{orderIndex:{gt:0},studentProgress:{none:{studentId:session.user.id,unlocked:true}}}},select:{id:true}});
 assert.ok(locked);assert.equal((await call({message:'explain',provider:'local',lessonId:locked.id})).status,403);
 assert.equal((await request('/api/ai/chat?lessonId='+locked.id)).status,403);
 assert.equal((await request('/api/ai/generate-quiz',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({topic:'Python'})})).status,403);
 console.log('PASS: unauthenticated access, authenticated Thai lesson search, lesson context, input validation, locked lesson protection, student quiz-generator restriction. No records modified.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.$disconnect());
