import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

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
