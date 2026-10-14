/* eslint-disable @typescript-eslint/no-require-imports -- Integration runner */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');const path=require('node:path');
require('dotenv').config({path:'.env.local',quiet:true});
const {PrismaClient}=require('@prisma/client');const db=new PrismaClient();
const root='http://127.0.0.1:3000';
async function login(email){const cookies=new Map();const req=async(p,o={})=>{const r=await fetch(root+p,{...o,headers:{...o.headers,cookie:[...cookies].map(([k,v])=>k+'='+v).join('; ')}});for(const c of r.headers.getSetCookie()){const[k,...v]=c.split(';')[0].split('=');cookies.set(k,v.join('='));}return r;};const csrf=await(await req('/api/auth/csrf')).json();await req('/api/auth/callback/credentials',{method:'POST',redirect:'manual',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrfToken:csrf.csrfToken,email,password:'password123',json:'true'})});return req;}
const json=(method,body)=>({method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});
(async()=>{let id,otherId;const assetIds=[];try{
const teacher=await login('teacher@ailms.com'),student=await login('student@ailms.com');
const template=await db.user.findUnique({where:{email:'teacher@ailms.com'}});
const other=await db.user.create({data:{name:'Editor test only',email:'editor-fixture-'+Date.now()+'@example.test',password:template.password,role:'TEACHER'}});otherId=other.id;
const outsider=await login(other.email);
const lesson={title:'Lesson',content:'Original content',objectives:['Learn'],estimatedTime:10};
const created=await teacher('/api/courses',json('POST',{title:'Editor integration fixture',description:'Disposable editor verification',category:'Test',difficulty:'BEGINNER',chapters:[{title:'First',description:'',lessons:[lesson]},{title:'Second',description:'',lessons:[lesson]}]}));assert.equal(created.status,201);id=(await created.json()).data.id;
const manage='/api/courses/'+id+'/manage';const assets='/api/courses/'+id+'/assets';
assert.equal((await student(manage)).status,403);assert.equal((await outsider(manage)).status,403);
let loaded=await(await teacher(manage)).json();let draft=loaded.data;
assert.equal((await outsider(manage,json('PUT',draft))).status,403);
assert.equal((await student(assets,{method:'POST'})).status,403);
const spoof={...draft,chapters:[{...draft.chapters[0],id:'invalid-foreign-id'}]};assert.equal((await teacher(manage,json('PUT',spoof))).status,400);
const invalid=new FormData();invalid.set('file',new Blob(['<script>bad</script>'],{type:'image/png'}),'fake.png');assert.equal((await teacher(assets,{method:'POST',body:invalid})).status,400);
async function upload(name,bytes,type){const form=new FormData();form.set('file',new Blob([bytes],{type}),name);const r=await teacher(assets,{method:'POST',body:form});assert.equal(r.status,201);const asset=(await r.json()).data;assetIds.push(asset.id);return asset;}
const image=await upload('test.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==','base64'),'image/png');
const file=await upload('lesson-notes.txt','Teacher authored attachment','text/plain');
assert.equal((await student(file.fileUrl)).status,403);
draft.thumbnail=image.fileUrl;draft.chapters[0].lessons[0].imageUrls=[image.fileUrl];draft.chapters[0].lessons[0].content='## Expanded article\n'+'Long lesson content. '.repeat(1000);draft.chapters[1].lessons[0].resources=[file.fileUrl];
const saved=await teacher(manage,json('PUT',draft));assert.equal(saved.status,200);let next=(await saved.json()).data;
assert.equal(next.chapters[0].lessons[0].id,draft.chapters[0].lessons[0].id);assert.ok(next.chapters[0].lessons[0].content.length>12000);
assert.equal((await teacher(manage,json('PUT',draft))).status,409);
assert.equal((await student(image.fileUrl)).status,200);assert.equal((await student(file.fileUrl)).status,403);
assert.equal((await fetch(root+file.fileUrl)).status,401);
await student('/api/courses/'+id);
const first=next.chapters[0].lessons[0].id;assert.equal((await student('/api/lessons/'+first+'/complete',{method:'POST'})).status,200);
assert.equal((await student(file.fileUrl)).status,200);
next.chapters[0].lessons[0].title='Edited after completion';let r=await teacher(manage,json('PUT',next));assert.equal(r.status,200);next=(await r.json()).data;
assert.equal((await db.lessonCompletion.count({where:{lessonId:first}})),1);
const remove={...next,chapters:[next.chapters[1]]};assert.equal((await teacher(manage,json('PUT',remove))).status,409);
next.published=false;r=await teacher(manage,json('PUT',next));assert.equal(r.status,200);next=(await r.json()).data;assert.equal((await student(file.fileUrl)).status,404);assert.equal((await student('/api/courses/'+id)).status,404);
next.published=true;next.chapters.reverse();r=await teacher(manage,json('PUT',next));assert.equal(r.status,200);next=(await r.json()).data;assert.equal(next.chapters[0].title,'Second');
console.log('PASS: owner-only editor, input validation, uploads and signatures, long content, retained IDs and progress, conflict detection, protected deletion, draft visibility, file authorization and reordering.');
}finally{if(id){await db.$transaction([db.certificate.deleteMany({where:{courseId:id}}),db.lessonCompletion.deleteMany({where:{lesson:{chapter:{courseId:id}}}}),db.studentProgress.deleteMany({where:{courseId:id}}),db.fileUpload.deleteMany({where:{id:{in:assetIds}}}),db.course.delete({where:{id}})]);}for(const assetId of assetIds)await fs.unlink(path.join(process.cwd(),'.data','course-assets',assetId));if(otherId){await db.loginEvent.deleteMany({where:{userId:otherId}});await db.user.delete({where:{id:otherId}});}await db.$disconnect();}})().catch(e=>{console.error(e);process.exitCode=1;});
