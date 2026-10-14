/* eslint-disable @typescript-eslint/no-require-imports -- Real HTTP/database integration fixtures */
const assert=require('node:assert/strict');
require('dotenv').config({path:'.env.local',quiet:true});
const{PrismaClient}=require('@prisma/client');const db=new PrismaClient();
const root=process.env.LMS_TEST_URL||'http://127.0.0.1:3000';
const prefix=`platform-test-${Date.now()}`,users=[],tickets=[],courses=[];let conversation;
async function login(email,password='password123'){const jar=new Map();const request=async(path,options={})=>{const r=await fetch(root+path,{...options,headers:{...options.headers,cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')}});for(const c of r.headers.getSetCookie()){const[k,...v]=c.split(';')[0].split('=');jar.set(k,v.join('='));}return r;};const csrf=await(await request('/api/auth/csrf')).json();await request('/api/auth/callback/credentials',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrfToken:csrf.csrfToken,email,password,json:'true'})});return request;}
const json=(method,body)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
async function ok(r){const result=await r.json();assert.ok(r.ok,JSON.stringify(result));return result.data;}
(async()=>{try{
  const admin=await login('admin@ailms.com');assert.equal((await admin('/api/admin')).status,200);
  for(const role of ['STUDENT','TEACHER','TEACHER']){const index=users.length;const user=await ok(await admin('/api/admin',json('POST',{action:'create',name:prefix+' '+index,email:`${prefix}-${index}@example.test`,role,active:true,password:'Test-only-12345'})));assert.equal(user.password,undefined);users.push(user);}
  const student=await login(users[0].email,'Test-only-12345'),teacher=await login(users[1].email,'Test-only-12345'),other=await login(users[2].email,'Test-only-12345');
  assert.equal((await student('/join')).status,200);
  assert.equal((await teacher('/join',{redirect:'manual'})).status,307);
  assert.equal((await student('/api/admin/activity')).status,403);
  assert.equal((await teacher('/api/admin/activity')).status,403);
  const failedLogin=await login(users[0].email,'incorrect-test-password');
  assert.equal((await failedLogin('/api/courses')).status,401);
  const log=await ok(await admin('/api/admin/activity?q='+encodeURIComponent(users[0].email)));
  assert.ok(log.events.some(e=>e.outcome==='SUCCESS'));assert.ok(log.events.some(e=>e.outcome==='FAILED'));
  assert.ok(log.events.every(e=>e.email===users[0].email));assert.ok(!JSON.stringify(log).includes('Test-only-12345'));
  const failedOnly=await ok(await admin('/api/admin/activity?outcome=FAILED&q='+encodeURIComponent(users[0].email)));
  assert.ok(failedOnly.events.every(e=>e.outcome==='FAILED'));
  assert.equal((await student('/api/admin')).status,403);assert.equal((await teacher('/api/admin',json('POST',{action:'settings',announcement:'not allowed'}))).status,403);
  await ok(await admin('/api/admin',json('POST',{...users[0],action:'update',active:false})));
  assert.equal((await student('/api/courses')).status,401);
  await ok(await admin('/api/admin',json('POST',{...users[0],action:'update',active:true})));
  assert.equal((await student('/api/courses')).status,200);
  const admins=await db.user.findMany({where:{role:'ADMIN',active:true},select:{id:true,name:true,email:true,role:true,active:true}});if(admins.length===1)assert.equal((await admin('/api/admin',json('POST',{...admins[0],action:'update',active:false}))).status,409);
  const ticket=await ok(await student('/api/support',json('POST',{subject:prefix,message:'Integration test request to verify isolation.'})));tickets.push(ticket.id);
  assert.equal((await other('/api/support?id='+ticket.id)).status,404);
  assert.equal((await student('/api/support',json('PATCH',{id:ticket.id,status:'CLOSED'}))).status,403);
  await ok(await admin('/api/support',json('PATCH',{id:ticket.id,message:'Administrator test response',status:'IN_PROGRESS'})));
  const thread=await ok(await student('/api/support?id='+ticket.id));assert.equal(thread.tickets[0].replies.length,1);
  await ok(await admin('/api/support',json('PATCH',{id:ticket.id,status:'CLOSED'})));
  assert.equal((await student('/api/support',json('PATCH',{id:ticket.id,message:'Closed reply'}))).status,409);
  assert.ok(await db.notification.count({where:{userId:users[0].id,link:'/support?ticket='+ticket.id}})>0);
  const course=await db.course.create({data:{teacherId:users[1].id,title:prefix,description:'Integration course',category:'Testing',difficulty:'BEGINNER',published:true,chapters:{create:[{title:'First',orderIndex:0,lessons:{create:{title:'Lesson 1',content:'Test reference',orderIndex:0,imageUrls:[],resources:[],objectives:[]}}},{title:'Second',orderIndex:1,lessons:{create:{title:'Lesson 2',content:'Test reference',orderIndex:0,imageUrls:[],resources:[],objectives:[]}}}]}},include:{chapters:{orderBy:{orderIndex:'asc'},include:{lessons:true}}}});courses.push(course.id);
  const access='/api/courses/'+course.id+'/access';
  assert.equal((await other(access,json('POST',{code:'Course-123'}))).status,403);
  await ok(await teacher(access,json('POST',{code:'Course-123',published:false})));
  assert.equal((await student('/api/courses/'+course.id)).status,404);
  assert.equal((await student(access,json('POST',{code:'Course-123'}))).status,404);
  await ok(await teacher(access,json('POST',{published:true})));
  const lockedLibrary=await ok(await student('/api/courses'));const lockedCourse=lockedLibrary.find(c=>c.id===course.id);
  assert.equal(lockedCourse.requiresCode,true);assert.equal(lockedCourse.joinCodeHash,undefined);
  assert.equal((await student('/api/courses/'+course.id)).status,403);
  assert.equal((await student('/api/lessons/'+course.chapters[0].lessons[0].id)).status,403);
  assert.equal((await student(access,json('POST',{code:'incorrect'}))).status,403);
  await ok(await student(access,json('POST',{code:'Course-123'})));await ok(await student(access,json('POST',{code:'Course-123'})));
  assert.equal(await db.courseEnrollment.count({where:{courseId:course.id,studentId:users[0].id}}),1);
  await ok(await teacher(access,json('POST',{code:'Changed-456'})));
  assert.equal((await student('/api/courses/'+course.id)).status,200);
  const body={chapterId:course.chapters[0].id,title:'Test quiz',description:'Test',passingScore:75,timeLimit:null,questions:[{questionText:'One plus one?',questionType:'MULTIPLE_CHOICE',points:2,explanation:'Two',options:[{optionText:'2',isCorrect:true},{optionText:'3',isCorrect:false}]}]};
  assert.equal((await other('/api/quizzes/manage',json('POST',body))).status,409);
  const quiz=await ok(await teacher('/api/quizzes/manage',json('POST',body)));
  assert.equal((await other('/api/quizzes/manage?id='+quiz.id)).status,404);
  const managed=await ok(await teacher('/api/quizzes/manage?id='+quiz.id));
  const overview=await ok(await student('/api/learning-overview'));assert.equal(overview.find(c=>c.courseId===course.id).status,'NOT_STARTED');
  await ok(await student('/api/certificates',{method:'POST'}));assert.equal(await db.certificate.count({where:{studentId:users[0].id,courseId:course.id}}),0);
  // Passing a chapter assessment is sufficient; no lesson-click fixture for chapter one.
  assert.equal((await student(`/api/quizzes/${quiz.id}/submit`,json('POST',{answers:[{questionId:managed.questions[0].id,selectedOptionId:'invalid-option'}]}))).status,400);
  await ok(await student(`/api/quizzes/${quiz.id}/submit`,json('POST',{answers:[{questionId:managed.questions[0].id,selectedOptionId:managed.questions[0].options.find(o=>o.isCorrect).id}]})));
  const partial=await ok(await student('/api/courses'));assert.equal(partial.find(c=>c.id===course.id).progress,50);assert.equal(await db.certificate.count({where:{studentId:users[0].id,courseId:course.id}}),0);
  await ok(await student(`/api/lessons/${course.chapters[1].lessons[0].id}/complete`,{method:'POST'}));
  const finished=await ok(await student('/api/courses'));assert.equal(finished.find(c=>c.id===course.id).progress,100);assert.ok(finished.find(c=>c.id===course.id).certificateId);
  await ok(await student('/api/certificates',{method:'POST'}));await ok(await student('/api/certificates',{method:'POST'}));
  assert.equal(await db.certificate.count({where:{studentId:users[0].id,courseId:course.id}}),1);
  const cert=await db.certificate.findFirst({where:{studentId:users[0].id,courseId:course.id}});assert.equal((await fetch(root+'/verify/'+cert.verificationId)).status,200);
  const completed=await ok(await student('/api/learning-overview'));assert.equal(completed.find(c=>c.courseId===course.id).status,'COMPLETED');
  const changed={...body,id:quiz.id,passingScore:80};await ok(await teacher('/api/quizzes/manage',json('POST',changed)));
  changed.questions=[{...body.questions[0],questionText:'Changed after attempt'}];assert.equal((await teacher('/api/quizzes/manage',json('POST',changed))).status,409);
  assert.equal((await teacher('/api/quizzes/manage?id='+quiz.id,{method:'DELETE'})).status,409);
  assert.equal((await student('/api/certificates',json('PATCH',{id:cert.id,reason:'Not allowed'}))).status,403);
  await ok(await admin('/api/certificates',json('PATCH',{id:cert.id,reason:'Integration test revocation'})));
  assert.ok((await(await fetch(root+'/verify/'+cert.verificationId)).text()).includes('REVOKED'));
  const catalog=await ok(await student('/api/ai/conversation'));assert.deepEqual(catalog.catalog.map(p=>p.provider),['ollama','gemini']);
  assert.equal((await student('/api/ai/conversation',json('POST',{provider:'ollama',model:'not-installed',message:'Hi'}))).status,503);
  if(process.env.RUN_LIVE_AI==='1'){
    const choices=catalog.catalog.find(p=>p.provider==='ollama').models.map(m=>({...m,provider:'ollama'}));
    if(process.env.RUN_GEMINI==='1'){const gemini=catalog.catalog.find(p=>p.provider==='gemini')?.models[0];assert.ok(gemini,'Gemini catalog unavailable');choices.push({...gemini,provider:'gemini'});}
    for(const model of choices){
      console.log('Testing conversation:',model.provider,model.id);
      const r=await student('/api/ai/conversation',json('POST',{provider:model.provider,model:model.id,message:'ตอบเป็นภาษาไทยสั้น ๆ ว่า ตัวแปรคืออะไร',language:'th'}));assert.equal(r.status,200);const events=(await r.text()).trim().split('\n').map(JSON.parse);assert.ok(events.some(e=>e.type==='done'),JSON.stringify(events.filter(e=>e.type==='error')));conversation=events.find(e=>e.type==='conversation').id;assert.ok(/[ก-๙]/.test(events.filter(e=>e.type==='delta').map(e=>e.text).join('')));assert.equal((await other('/api/ai/conversation?id='+conversation)).status,404);const saved=await ok(await student('/api/ai/conversation?id='+conversation));assert.equal(saved.messages.length,2);console.log('PASS: real streamed Thai response and private history:',model.id);
    }
  }
  const signoutCsrf=await(await other('/api/auth/csrf')).json();await other('/api/auth/signout',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrfToken:signoutCsrf.csrfToken,json:'true'})});assert.ok(await db.loginEvent.count({where:{userId:users[2].id,outcome:'SIGN_OUT'}}));
  console.log('PASS: Login history, failed login, logout, admin-only activity, Admin RBAC, immediate account disable, last-admin protection, ticket isolation/replies/notifications, teacher quiz ownership/editing, student progress, certificate eligibility/uniqueness/revocation, provider configuration.');
}finally{
  const ids=users.map(u=>u.id);
  await db.loginEvent.deleteMany({where:{userId:{in:ids}}});
  await db.aiConversation.deleteMany({where:{userId:{in:ids}}});await db.aiRequest.deleteMany({where:{userId:{in:ids}}});
  await db.supportReply.deleteMany({where:{ticketId:{in:tickets}}});await db.contactSupport.deleteMany({where:{id:{in:tickets}}});
  await db.notification.deleteMany({where:{OR:[{userId:{in:ids}},{link:{in:tickets.map(id=>'/support?ticket='+id)}}]}});
  const certs=await db.certificate.findMany({where:{courseId:{in:courses}},select:{id:true}});await db.auditEvent.deleteMany({where:{OR:[{actorId:{in:ids}},{entityId:{in:[...ids,...tickets,...certs.map(c=>c.id)]}}]}});
  await db.certificate.deleteMany({where:{courseId:{in:courses}}});await db.quizAnswer.deleteMany({where:{attempt:{studentId:{in:ids}}}});await db.quizAttempt.deleteMany({where:{studentId:{in:ids}}});await db.studentProgress.deleteMany({where:{studentId:{in:ids}}});await db.lessonCompletion.deleteMany({where:{studentId:{in:ids}}});await db.course.deleteMany({where:{id:{in:courses}}});await db.user.deleteMany({where:{id:{in:ids}}});await db.$disconnect();
}})().catch(error=>{console.error(error);process.exitCode=1;});

