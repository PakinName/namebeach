/* eslint-disable @typescript-eslint/no-require-imports -- Public demo verification */
const assert=require('node:assert/strict'),fs=require('node:fs');
const root=process.env.DEMO_URL||'https://views-biology-neither-elections.trycloudflare.com';
const cookies=new Map();
async function req(path,options={}){const r=await fetch(root+path,{...options,headers:{...options.headers,cookie:[...cookies].map(([k,v])=>k+'='+v).join('; ')}});for(const c of r.headers.getSetCookie()){const[k,...v]=c.split(';')[0].split('=');cookies.set(k,v.join('='));}return r;}
function pdf(){const text='Python course reference: Variables store values. Use meaningful names. Teach integers, strings and print with short practice exercises.';const stream='BT /F1 12 Tf 30 750 Td ('+text+') Tj ET';const objs=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Length '+stream.length+' >>\nstream\n'+stream+'\nendstream'];let out='%PDF-1.4\n',offsets=[0];objs.forEach((s,i)=>{offsets.push(Buffer.byteLength(out));out+=(i+1)+' 0 obj\n'+s+'\nendobj\n';});const xref=Buffer.byteLength(out);out+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';return out;}
(async()=>{
 assert.match(await(await req('/')).text(),/Access code/);
 const access=JSON.parse(fs.readFileSync('.data/share/access.json','utf8'));
 const gate=await req('/_share/access',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code:access.code})});assert.equal(gate.status,303);
 const csrf=await(await req('/api/auth/csrf')).json();assert.ok(csrf.csrfToken);
 const auth=await req('/api/auth/callback/credentials',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrfToken:csrf.csrfToken,email:'teacher@ailms.com',password:'password123',json:'true',callbackUrl:root+'/dashboard'})});assert.equal(auth.status,200);
 const session=await(await req('/api/auth/session')).json();assert.equal(session.user.role,'TEACHER');console.log('PASS: public access gate and teacher login');
 const courses=await(await req('/api/courses')).json();assert.ok(courses.data.length);console.log('PASS: database and course library');
 const form=new FormData();form.set('title','พื้นฐานภาษา Python');form.set('description','คอร์สสำหรับนักเรียนเริ่มต้น');form.set('syllabus','บทที่ 1 ตัวแปรและชนิดข้อมูล บทที่ 2 การคำนวณและการแสดงผล ฝึกเขียนโปรแกรมสั้น ๆ');form.set('language','th');form.set('reference',new Blob([pdf()],{type:'application/pdf'}),'reference.pdf');
 const start=Date.now();const response=await req('/api/ai/generate-course',{method:'POST',body:form});assert.equal(response.status,200,await(response.status!==200?response.text():Promise.resolve('')));
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',draft,model;while(true){const {value,done}=await reader.read();buffer+=decoder.decode(value,{stream:!done});const lines=buffer.split('\n');buffer=lines.pop()||'';for(const line of lines){if(!line)continue;const event=JSON.parse(line);if(event.type==='error')throw new Error(event.error);if(event.type==='progress')console.log('Progress: '+event.completed+'/'+event.total+' '+event.title);if(event.type==='complete'){draft=event.data;model=event.model;}}if(done)break;}
 assert.equal(model,'qwen3:8b');assert.equal(draft.chapters.length,2);assert.equal(draft.chapters[0].lessons.length,2);assert.match(draft.chapters[0].lessons[0].content,/[ก-๙]/);
 fs.writeFileSync('.data/share/generated-course-verification.json',JSON.stringify(draft,null,2));
 console.log(JSON.stringify({success:true,model,seconds:Math.round((Date.now()-start)/1000),chapters:2,lessons:4,pdfReference:true}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
