import { issueEligibleCertificates } from '@/lib/student-overview';
import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessChapter } from '@/lib/progression';

// POST /api/lessons/[id]/complete — Mark lesson as complete
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { chapter: { include: { course: { select: { published: true } }, quiz: { select: { id: true } }, lessons: { select: { id: true } } } } },
    });

    if (!lesson || !lesson.chapter.course.published) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }
    if (!await canAccessChapter(session.user.id, lesson.chapter.courseId, lesson.chapterId)) return NextResponse.json({ success: false, error: 'Chapter locked' }, { status: 403 });

    await prisma.lessonCompletion.upsert({
      where: {
        studentId_lessonId: {
          studentId: session.user.id,
          lessonId: id,
        },
      },
      update: { completedAt: new Date() },
      create: {
        studentId: session.user.id,
        lessonId: id,
      },
    });

    // Courses authored without quizzes advance after every lesson in the chapter is complete.
    if (!lesson.chapter.quiz) {
      const lessonIds = lesson.chapter.lessons.map(item => item.id);
      const count = await prisma.lessonCompletion.count({ where: { studentId: session.user.id, lessonId: { in: lessonIds } } });
      if (count === lessonIds.length) {
        const next = await prisma.chapter.findFirst({ where: { courseId: lesson.chapter.courseId, orderIndex: { gt: lesson.chapter.orderIndex } }, orderBy: { orderIndex: 'asc' } });
        const identity = { studentId: session.user.id, courseId: lesson.chapter.courseId, chapterId: lesson.chapterId };
        await prisma.$transaction([
          prisma.studentProgress.upsert({ where: { studentId_courseId_chapterId: identity }, create: { ...identity, unlocked: true, completed: true, completedAt: new Date() }, update: { unlocked: true, completed: true, completedAt: new Date() } }),
          ...(next ? [prisma.studentProgress.upsert({ where: { studentId_courseId_chapterId: { ...identity, chapterId: next.id } }, create: { ...identity, chapterId: next.id, unlocked: true }, update: { unlocked: true } })] : []),
        ]);
      }
    }

    await issueEligibleCertificates(session.user.id).catch(() => console.warn('Certificate eligibility deferred; retry from certificates page.'));
    return NextResponse.json({ success: true, message: 'Lesson marked as complete' });
  } catch (error) {
    console.error('Lesson complete error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
