import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessChapter } from '@/lib/progression';

// GET /api/lessons/[id] — Get lesson detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

    // Security: Check chapter access for students
    if (session.user.role === 'STUDENT') {
      const hasAccess = await canAccessChapter(
        session.user.id,
        lesson.chapter.courseId,
        lesson.chapterId
      );

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Chapter is locked. Complete the previous chapter first.' },
          { status: 403 }
        );
      }
    }

    // Check if lesson is completed by student
    let completed = false;
    if (session.user.role === 'STUDENT') {
      const completion = await prisma.lessonCompletion.findUnique({
        where: {
          studentId_lessonId: {
            studentId: session.user.id,
            lessonId: id,
          },
        },
      });
      completed = !!completion;
    }

    return NextResponse.json({
      success: true,
      data: { ...lesson, completed },
    });
  } catch (error) {
    console.error('Lesson GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
