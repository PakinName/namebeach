import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessChapter } from '@/lib/progression';

// GET /api/quizzes/[id] — Get quiz with questions and options
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

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: {
              select: { id: true, optionText: true },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }

    // Security: Check chapter access for students
    if (session.user.role === 'STUDENT') {
      const hasAccess = await canAccessChapter(
        session.user.id,
        quiz.chapter.courseId,
        quiz.chapterId
      );

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Chapter is locked. Complete the previous chapter first.' },
          { status: 403 }
        );
      }
    }

    // Get previous attempts for student
    let attempts: unknown[] = [];
    if (session.user.role === 'STUDENT') {
      attempts = await prisma.quizAttempt.findMany({
        where: { quizId: id, studentId: session.user.id },
        orderBy: { startedAt: 'desc' },
        take: 5,
      });
    }

    return NextResponse.json({
      success: true,
      data: { ...quiz, attempts },
    });
  } catch (error) {
    console.error('Quiz GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
