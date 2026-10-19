/* eslint-disable @typescript-eslint/no-require-imports -- HTTP integration tests */
const assert=require('node:assert/strict');
require('dotenv').config({path:'.env.local',quiet:true});
const {PrismaClient}=require('@prisma/client');const db=new PrismaClient();
const root=process.env.LMS_TEST_URL||'http://127.0.0.1:3000',prefix='workflow-'+Date.now(),users=[],courses=[];
const json=(method,body)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
async function ok(r){const j=await r.json();assert.ok(r.ok,JSON.stringify(j));return j.data;}
async function login(email,password='Test-only-12345'){const jar=new Map();const req=async(path,options={})=>{const r=await fetch(root+path,{...options,headers:{...options.headers,cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')}});for(const c of r.headers.getSetCookie()){const[k,...v]=c.split(';')[0].split('=');jar.set(k,v.join('='));}return r;};const csrf=await(await req('/api/auth/csrf')).json();await req('/api/auth/callback/credentials',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrfToken:csrf.csrfToken,email,password,json:'true'})});return req;}
async function register(role,index){const email=prefix+index+'@example.test';const r=await fetch(root+'/api/auth/register',json('POST',{name:'Display '+index,fullName:'ชื่อจริง ทดสอบ '+index,nickname:'เล่น'+index,email,password:'Test-only-12345',role}));const j=await r.json();assert.equal(r.status,201,JSON.stringify(j));users.push(j.data.id);return {...j.data,pendingApproval:j.pendingApproval};}
(async()=>{try{
const admin=await login('admin@ailms.com','password123');
const t=await register('TEACHER',1),s=await register('STUDENT',2),o=await register('TEACHER',3);
await ok(await admin('/api/admin',json('POST',{action:'approve',id:t.id,approved:true})));
await ok(await admin('/api/admin',json('POST',{action:'approve',id:o.id,approved:true})));
const teacher=await login(t.email),student=await login(s.email),other=await login(o.email);
const lesson=title=>({title,description:'Variables',content:'A variable stores a value. score = 23 stores the integer 23. print(score) displays 23.',estimatedTime:5,objectives:['Understand variables'],videoUrl:'',pdfUrl:'',slideUrl:'',codeExample:''});
const course=await ok(await teacher('/api/courses',json('POST',{title:prefix,description:'Checkpoint integration fixture',category:'Testing',difficulty:'BEGINNER',published:true,chapters:[{title:'Chapter one',description:'',lessons:[lesson('1.1'),lesson('1.2')]},{title:'Chapter two',description:'',lessons:[lesson('2.1')]}]})));courses.push(course.id);
const original=await db.course.findUnique({where:{id:course.id},include:{chapters:{orderBy:{orderIndex:'asc'},include:{lessons:{orderBy:{orderIndex:'asc'}},quiz:true}}}});
const[c1,c2]=original.chapters,[l1,l2]=c1.lessons,l3=c2.lessons[0];
const url=id=>'/api/lessons/'+id,check=id=>url(id)+'/checkpoint';
assert.equal((await student(check(l1.id))).status,403);
await ok(await student('/api/courses/'+course.id+'/access',json('POST',{})));
assert.equal((await student(check(l2.id))).status,403);
assert.equal((await student(url(l1.id)+'/complete',{method:'POST'})).status,403);
const questions=Array.from({length:5},(_,i)=>({questionText:'What value does score store? '+(i+1),options:['23','99','0'],correctIndex:0,explanation:'score = 23 assigns the integer 23.'}));
const draft={revision:null,questions,reviewText:'score = 23 stores 23.'};
assert.equal((await other(check(l1.id),json('PUT',draft))).status,403);
assert.equal((await student(check(l1.id),json('PUT',draft))).status,403);
assert.equal((await teacher(check(l1.id),json('PUT',{...draft,questions:questions.slice(0,4)}))).status,400);
for(const lesson of [l1,l2,l3])assert.equal((await teacher(check(lesson.id),json('PUT',draft))).status,200);
let q=await ok(await student(check(l1.id)));
assert.equal(q.questions.length,5);assert.equal(q.questions[0].correctIndex,undefined);assert.equal(q.questions[0].explanation,undefined);
assert.equal((await student(check(l1.id),json('POST',{revision:q.revision,answers:[0,0]}))).status,400);
assert.equal((await student(check(l1.id),json('POST',{revision:q.revision,answers:[3,0,0,0,0]}))).status,409);
let result=await ok(await student(check(l1.id),json('POST',{revision:q.revision,answers:[0,0,1,1,1]})));
assert.equal(result.score,2);assert.equal(result.passed,false);assert.equal(result.questions[2].isCorrect,false);assert.equal(result.questions[2].explanation,questions[2].explanation);
assert.equal((await student(url(l2.id))).status,403);assert.equal((await student(url(l1.id)+'/complete',{method:'POST'})).status,403);
console.log('PASS 2/5 fails, next lesson and completion bypass blocked, no answer key before submission');
const snapshot=await db.lessonCheckAttempt.findFirst({where:{studentId:s.id,lessonId:l1.id}});
assert.equal(snapshot.score,2);
assert.equal((await teacher(check(l1.id),json('PUT',{...draft,revision:q.revision,questions:questions.map(x=>({...x,questionText:x.questionText+' revised'}))}))).status,200);
assert.equal((await student(check(l1.id),json('POST',{revision:q.revision,answers:[0,0,0,0,0]}))).status,409);
assert.equal((await teacher(check(l1.id),json('PUT',{...draft,revision:q.revision}))).status,409);
assert.deepEqual((await db.lessonCheckAttempt.findUnique({where:{id:snapshot.id}})).questions,snapshot.questions);
q=await ok(await student(check(l1.id)));
result=await ok(await student(check(l1.id),json('POST',{revision:q.revision,answers:[0,0,0,1,1]})));
assert.equal(result.score,3);assert.equal(result.passed,true);assert.equal((await student(url(l2.id))).status,200);assert.equal((await student(url(l3.id))).status,403);
console.log('PASS 3/5 passes and unlocks only 1.2, question edits preserve history and reject stale versions');
q=await ok(await student(check(l2.id)));await ok(await student(check(l2.id),json('POST',{revision:q.revision,answers:[0,0,0,0,0]})));
// The independent chapter exam can still contain ten questions and its own passing score.
let big=await ok(await teacher('/api/quizzes/manage?id='+c1.quiz.id));big.questions=Array.from({length:10},(_,i)=>({questionText:'Chapter question '+i,questionType:'MULTIPLE_CHOICE',points:1,explanation:'A',options:[{optionText:'A',isCorrect:true},{optionText:'B',isCorrect:false}]}));big.passingScore=70;
await ok(await teacher('/api/quizzes/manage',json('POST',big)));big=await ok(await teacher('/api/quizzes/manage?id='+c1.quiz.id));
const publicBig=await ok(await student('/api/quizzes/'+c1.quiz.id));assert.equal(publicBig.questions.length,10);assert.equal(publicBig.passingScore,70);
assert.equal((await student(url(l3.id))).status,403);
const submitBig=correct=>student('/api/quizzes/'+c1.quiz.id+'/submit',json('POST',{revision:big.revision,answers:big.questions.map((x,i)=>({questionId:x.id,selectedOptionId:x.options.find(o=>o.isCorrect===(i<correct)).id}))}));
assert.equal((await ok(await submitBig(6))).passed,false);assert.equal((await student(url(l3.id))).status,403);
assert.equal((await ok(await submitBig(7))).passed,true);assert.equal((await student(url(l3.id))).status,200);
console.log('PASS chapter exam stays 10 questions with independent 70% threshold; chapter two unlocks only after it passes');
const catalog=await ok(await student('/api/ai/conversation'));const llama=catalog.catalog.find(p=>p.provider==='ollama')?.models[0];
if(llama){assert.equal((await student('/api/ai/conversation',json('POST',{provider:'ollama',model:llama.id,message:'Explain',reviewLessonId:l3.id}))).status,403);}
if(process.env.RUN_LIVE_AI==='1'&&llama){const response=await student('/api/ai/conversation',json('POST',{provider:'ollama',model:llama.id,message:'Explain my checkpoint mistakes briefly in English. What value is stored?',reviewLessonId:l1.id,language:'en'}));assert.equal(response.status,200);const events=(await response.text()).trim().split('\n').map(x=>JSON.parse(x));assert.ok(events.some(e=>e.type==='done'),JSON.stringify(events));const reply=events.filter(e=>e.type==='delta').map(e=>e.text).join('');assert.match(reply,/23|variable|score/i);console.log('PASS live Ollama uses lesson and checkpoint answers');}
console.log('ALL LESSON CHECKPOINT CHECKS PASSED');
}finally{await db.aiConversation.deleteMany({where:{userId:{in:users}}});await db.aiRequest.deleteMany({where:{userId:{in:users}}});await db.quizAnswer.deleteMany({where:{attempt:{studentId:{in:users}}}});await db.quizAttempt.deleteMany({where:{studentId:{in:users}}});await db.certificate.deleteMany({where:{studentId:{in:users}}});await db.lessonCompletion.deleteMany({where:{studentId:{in:users}}});await db.studentProgress.deleteMany({where:{studentId:{in:users}}});await db.courseEnrollment.deleteMany({where:{studentId:{in:users}}});await db.course.deleteMany({where:{id:{in:courses}}});await db.notification.deleteMany({where:{userId:{in:users}}});await db.auditEvent.deleteMany({where:{OR:[{actorId:{in:users}},{entityId:{in:users}}]}});await db.loginEvent.deleteMany({where:{email:{startsWith:prefix}}});await db.user.deleteMany({where:{id:{in:users}}});await db.$disconnect();}})().catch(e=>{console.error(e);process.exitCode=1;});
