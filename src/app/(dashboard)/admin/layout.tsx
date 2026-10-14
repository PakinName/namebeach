import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/auth';
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getActiveSession();
  if (session?.user.role !== 'ADMIN') redirect('/dashboard');
  return children;
}
