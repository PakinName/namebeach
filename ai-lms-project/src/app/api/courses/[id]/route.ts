import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getStudentCourseProgress, initializeCourseProgress } from '@/lib/progression';

// GET /api/courses/[id] — Get course detail with chapters and progress
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

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true, avatar: true } },
        chapters: {
          orderBy: { orderIndex: 'asc' },
          include: {
            quiz: { select: { id: true } },
            lessons: {
              orderBy: { orderIndex: 'asc' },
              select: { id: true, title: true, orderIndex: true, estimatedTime: true },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Get student progress
    if (session.user.role === 'STUDENT') {
      // Initialize progress if not exists
      const existingProgress = await prisma.studentProgress.findFirst({
        where: { studentId: session.user.id, courseId: id },
      });

      if (!existingProgress) {
        await initializeCourseProgress(session.user.id, id);
      }

      const progress = await getStudentCourseProgress(session.user.id, id);

      // Get lesson completions
      const lessonCompletions = await prisma.lessonCompletion.findMany({
        where: { studentId: session.user.id },
        select: { lessonId: true },
      });
      const completedLessonIds = new Set(lessonCompletions.map((lc) => lc.lessonId));

      const chaptersWithProgress = progress.chapters.map((chapter) => ({
        ...chapter,
        lessons: chapter.lessons.map((lesson) => ({
          ...lesson,
          completed: completedLessonIds.has(lesson.id),
        })),
      }));

      return NextResponse.json({
        success: true,
        data: {
          ...course,
          chapters: chaptersWithProgress,
          progressPercent: progress.progressPercent,
          completedChapters: progress.completedChapters,
          totalChapters: progress.totalChapters,
        },
      });
    }

    return NextResponse.json({ success: true, data: course });
  } catch (error) {
    console.error('Course detail error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
