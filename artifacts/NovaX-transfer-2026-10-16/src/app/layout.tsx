import type { Metadata } from 'next';
import SessionProvider from '@/components/providers/SessionProvider';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'NovaX — Learning Management System',
  description:
    'AI-powered Learning Management System with mastery-based progression, intelligent quizzes, and interactive classrooms.',
  keywords: ['LMS', 'Learning', 'AI', 'Education', 'Quiz', 'Classroom'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>
        <LanguageProvider><SessionProvider>{children}</SessionProvider></LanguageProvider>
      </body>
    </html>
  );
}
