import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { initializeCourseProgress } from '@/lib/progression';

// GET /api/courses — List all published courses
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      where: { published: true },
      include: {
        teacher: { select: { id: true, name: true, avatar: true } },
        _count: { select: { chapters: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get progress for student
    if (session.user.role === 'STUDENT') {
      const progressData = await prisma.studentProgress.findMany({
        where: { studentId: session.user.id },
      });

      const courseProgress = new Map<string, { completed: number; total: number }>();
      for (const p of progressData) {
        const existing = courseProgress.get(p.courseId) || { completed: 0, total: 0 };
        existing.total++;
        if (p.completed) existing.completed++;
        courseProgress.set(p.courseId, existing);
      }

      const coursesWithProgress = courses.map((course) => {
        const progress = courseProgress.get(course.id);
        return {
          ...course,
          progress: progress
            ? Math.round((progress.completed / progress.total) * 100)
            : 0,
        };
      });

      return NextResponse.json({ success: true, data: coursesWithProgress });
    }

    return NextResponse.json({ success: true, data: courses });
  } catch (error) {
    console.error('Courses GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/courses — Create a course (teacher only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, difficulty, estimatedTime, thumbnail } = body;

    if (!title || !description || !category) {
      return NextResponse.json({ success: false, error: 'Title, description, and category are required' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        category,
        difficulty: difficulty || 'BEGINNER',
        estimatedTime: estimatedTime || null,
        thumbnail: thumbnail || null,
        teacherId: session.user.id,
        published: true,
      },
      include: {
        teacher: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ success: true, data: course }, { status: 201 });
  } catch (error) {
    console.error('Courses POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
