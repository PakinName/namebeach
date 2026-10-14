import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
export async function GET(request:Request){
 const session=await getActiveSession();
 if(session?.user.role!=='ADMIN')return NextResponse.json({success:false,error:'Forbidden'},{status:403});
 const params=new URL(request.url).searchParams;
 const page=Math.max(1,Math.min(10000,Math.floor(Number(params.get('page')))||1));
 const q=(params.get('q')||'').trim().slice(0,100);
 const outcome=params.get('outcome');
 const where={...(q?{email:{contains:q,mode:'insensitive' as const}}:{}),...(['SUCCESS','FAILED','SIGN_OUT'].includes(outcome||'')?{outcome:outcome!}:{})};
 const [events,count,audit]=await Promise.all([
 prisma.loginEvent.findMany({where,orderBy:[{createdAt:'desc'},{id:'desc'}],take:25,skip:(page-1)*25,select:{id:true,email:true,outcome:true,createdAt:true}}),
 prisma.loginEvent.count({where}),
 prisma.auditEvent.findMany({orderBy:{createdAt:'desc'},take:50,select:{id:true,action:true,entityType:true,createdAt:true,actor:{select:{name:true}}}})
 ]);
 return NextResponse.json({success:true,data:{events,count,audit}},{headers:{'Cache-Control':'no-store'}});
}
