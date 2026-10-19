import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import { studentOverview } from '@/lib/student-overview';
export async function GET(){const session=await getActiveSession();if(session?.user.role!=='STUDENT')return NextResponse.json({success:false,error:'Forbidden'},{status:403});return NextResponse.json({success:true,data:await studentOverview(session.user.id)});}
