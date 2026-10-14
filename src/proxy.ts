import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (token && (pathname === '/classrooms' || pathname.startsWith('/classrooms/'))) {
      const destination = token.role === 'STUDENT' ? '/courses' : '/course-builder';
      return NextResponse.redirect(new URL(destination, req.url));
    }
    if ((pathname.startsWith('/course-builder') || pathname === '/courses/new') && token && !['TEACHER','ADMIN'].includes(String(token.role))) return NextResponse.redirect(new URL('/courses', req.url));

    // Redirect authenticated users away from auth pages
    if (token && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow auth pages and public routes
        if (
          pathname === '/login' ||
          pathname === '/register' ||
          pathname === '/' ||
          pathname.startsWith('/api/auth')
        ) {
          return true;
        }

        // Protected routes require auth
        if (
          pathname.startsWith('/dashboard') ||
          pathname.startsWith('/course-builder') ||
          pathname.startsWith('/assistant') ||
          pathname.startsWith('/courses') ||
          pathname.startsWith('/classrooms') ||
          pathname.startsWith('/quizzes') ||
          pathname.startsWith('/lessons') ||
          pathname.startsWith('/progress') ||
          pathname.startsWith('/support') ||
          pathname.startsWith('/profile') ||
          pathname.startsWith('/announcements') ||
          pathname.startsWith('/files')
        ) {
          return !!token;
        }

        return true;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/course-builder/:path*',
    '/assistant/:path*',
    '/courses/:path*',
    '/classrooms/:path*',
    '/quizzes/:path*',
    '/lessons/:path*',
    '/progress/:path*',
    '/support/:path*',
    '/profile/:path*',
    '/announcements/:path*',
    '/files/:path*',
    '/login',
    '/register',
  ],
};
