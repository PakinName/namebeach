/* eslint-disable @typescript-eslint/no-require-imports -- Integration runner */
const assert = require('node:assert/strict');
require('dotenv').config({path:'.env.local',quiet:true});
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient();
const root=process.env.LMS_TEST_URL || 'http://127.0.0.1:3000';
async function login(email) {
  const jar=new Map();
  const request=async(path,options={})=>{
    const response=await fetch(root+path,{...options,headers:{...options.headers,cookie:[...jar].map(([key,value])=>key+'='+value).join('; ')}});
    for(const cookie of response.headers.getSetCookie()){const[key,...value]=cookie.split(';')[0].split('=');jar.set(key,value.join('='));} return response;
  };
  const csrf=await(await request('/api/auth/csrf')).json();
  await request('/api/auth/callback/credentials',{method:'POST',redirect:'manual',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrfToken:csrf.csrfToken,email,password:'password123',json:'true'})});
  return request;
}
(async()=>{
  let courseId;
  try {
    const teacher=await login('teacher@ailms.com'),student=await login('student@ailms.com');
    const post=body=>({method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    assert.equal((await student('/api/courses',post({}))).status,403);
    assert.equal((await teacher('/api/courses',{method:'POST',body:'{'})).status,400);
    assert.equal((await teacher('/api/courses',post({title:'Incomplete'}))).status,400);
    const lesson={title:'Example lesson',content:'A variable stores a value.',objectives:['Assign a value'],estimatedTime:15};
    const payload={title:'Manual course integration fixture',description:'Temporary course for validation only',category:'Programming',difficulty:'BEGINNER',teacherId:'spoofed',chapters:[{title:'Basics',description:'',lessons:[lesson,{...lesson,title:'Practice'}]},{title:'Next chapter',description:'',lessons:[lesson]}]};
    const response=await teacher('/api/courses',post(payload));const saved=await response.json();assert.equal(response.status,201);courseId=saved.data.id;
    const stored=await db.course.findUnique({where:{id:courseId},include:{teacher:true,chapters:{orderBy:{orderIndex:'asc'},include:{lessons:{orderBy:{orderIndex:'asc'}}}}}});
    assert.equal(stored.teacher.email,'teacher@ailms.com');assert.equal(stored.published,true);assert.equal(stored.estimatedTime,45);
    assert.deepEqual(stored.chapters.map(c=>c.orderIndex),[0,1]);assert.deepEqual(stored.chapters[0].lessons.map(l=>l.orderIndex),[0,1]);
    const library=await(await student('/api/courses')).json();assert.ok(library.data.some(c=>c.id===courseId));
    assert.equal((await student('/api/courses/'+courseId)).status,200);
    const [first,second]=stored.chapters;
    assert.equal((await student('/api/lessons/'+second.lessons[0].id+'/complete',{method:'POST'})).status,403);
    assert.equal((await student('/api/lessons/'+first.lessons[0].id+'/complete',{method:'POST'})).status,200);
    assert.equal((await student('/api/lessons/'+second.lessons[0].id+'/complete',{method:'POST'})).status,403);
    assert.equal((await student('/api/lessons/'+first.lessons[1].id+'/complete',{method:'POST'})).status,200);
    assert.equal((await student('/api/lessons/'+second.lessons[0].id)).status,200);
    assert.equal((await student('/api/lessons/'+second.lessons[0].id+'/complete',{method:'POST'})).status,200);
    const progress=await(await student('/api/courses/'+courseId)).json();assert.equal(progress.data.progressPercent,100);
    console.log('PASS: teacher creation, validation, ownership, published library, lesson order, locked lesson protection, completion and next chapter access.');
  } finally {
    if(courseId) {
      await db.$transaction([
        db.certificate.deleteMany({where:{courseId}}),
        db.lessonCompletion.deleteMany({where:{lesson:{chapter:{courseId}}}}),
        db.studentProgress.deleteMany({where:{courseId}}),
        db.course.delete({where:{id:courseId}})
      ]);
    }
    await db.$disconnect();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
