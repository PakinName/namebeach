import { getActiveSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
export default async function JoinLayout({children}:{children:React.ReactNode}){const session=await getActiveSession();if(!session)redirect('/login');if(session.user.role!=='STUDENT')redirect('/courses');return children;}
