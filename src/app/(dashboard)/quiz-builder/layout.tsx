import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/auth';
export default async function QuizBuilderLayout({children}:{children:React.ReactNode}){const session=await getActiveSession();if(!session||session.user.role==='STUDENT')redirect('/dashboard');return children;}
