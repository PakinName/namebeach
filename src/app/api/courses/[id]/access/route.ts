import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
const attempts=new Map<string,{count:number;until:number}>();
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const session=await getActiveSession();if(!session)return NextResponse.json({success:false},{status:401});
 const {id}=await params;const course=await prisma.course.findUnique({where:{id},include:{chapters:{include:{lessons:true}}}});
 if(!course)return NextResponse.json({success:false},{status:404});
 const input=z.object({code:z.string().trim().max(72).optional(),published:z.boolean().optional()}).safeParse(await request.json().catch(()=>null));
 if(!input.success)return NextResponse.json({success:false,error:'ข้อมูลไม่ถูกต้อง / Invalid input'},{status:400});
 if(session.user.role==='STUDENT'){
  if(!course.published)return NextResponse.json({success:false},{status:404});
  const key=session.user.id+':'+id;const now=Date.now();if(attempts.size>10000)for(const[k,v]of attempts)if(v.until<now)attempts.delete(k);
  const limit=attempts.get(key);if(limit&&limit.until>now&&limit.count>=10)return NextResponse.json({success:false,error:'ลองใหม่ใน 10 นาที / Retry in 10 minutes'},{status:429});
  if(course.joinCodeHash&&!await bcrypt.compare(input.data.code||'',course.joinCodeHash)){attempts.set(key,{count:limit&&limit.until>now?limit.count+1:1,until:limit&&limit.until>now?limit.until:now+600000});return NextResponse.json({success:false,error:'รหัสเข้าคอร์สไม่ถูกต้อง / Incorrect course code'},{status:403});}
  await prisma.courseEnrollment.upsert({where:{studentId_courseId:{studentId:session.user.id,courseId:id}},update:{},create:{studentId:session.user.id,courseId:id}});attempts.delete(key);
 }else{
  if(session.user.role!=='ADMIN'&&course.teacherId!==session.user.id)return NextResponse.json({success:false},{status:403});
  if(input.data.code!==undefined&&input.data.code.length<6)return NextResponse.json({success:false,error:'รหัสอย่างน้อย 6 ตัวอักษร / Use at least 6 characters'},{status:400});
  if(input.data.published&&(!course.chapters.length||course.chapters.some(c=>!c.lessons.length||c.lessons.some(l=>!l.content?.trim()&&!l.videoUrl&&!l.pdfUrl&&!l.imageUrls.length&&!l.resources.length))))return NextResponse.json({success:false,error:'เพิ่มเนื้อหาให้ครบทุกบทก่อนเผยแพร่ / Complete lesson content first'},{status:400});
  await prisma.course.update({where:{id},data:{...(input.data.published!==undefined?{published:input.data.published}:{}),...(input.data.code!==undefined?{joinCodeHash:await bcrypt.hash(input.data.code,12)}:{})}});
 }
 return NextResponse.json({success:true});
}
