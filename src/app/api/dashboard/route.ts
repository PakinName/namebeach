import { studentCourseFilter } from '@/lib/course-access';
import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role === 'STUDENT') {
      // Student dashboard stats
      const [courses, progress, attempts, announcements, notifications] = await Promise.all([
        prisma.course.findMany({
          where: studentCourseFilter(session.user.id),
          select: { id: true, title: true, thumbnail: true, category: true, _count: { select: { chapters: true } } },
        }),
        prisma.studentProgress.findMany({
          where: { studentId: session.user.id },
        }),
        prisma.quizAttempt.findMany({
          where: { studentId: session.user.id },
          orderBy: { startedAt: 'desc' },
          take: 5,
          include: { quiz: { select: { title: true } } },
        }),
        prisma.announcement.findMany({
          where: {
            classroom: { members: { some: { studentId: session.user.id } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { author: { select: { name: true } } },
        }),
        prisma.notification.findMany({
          where: { userId: session.user.id, read: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      const completedChapters = progress.filter((p) => p.completed).length;
      const lockedChapters = progress.filter((p) => !p.unlocked).length;
      const totalScore = attempts.reduce((sum, a) => sum + a.percentage, 0);
      const averageScore = attempts.length > 0 ? totalScore / attempts.length : 0;

      // Calculate per-course progress
      const courseProgressMap = new Map<string, { completed: number; total: number }>();
      for (const p of progress) {
        const existing = courseProgressMap.get(p.courseId) || { completed: 0, total: 0 };
        existing.total++;
        if (p.completed) existing.completed++;
        courseProgressMap.set(p.courseId, existing);
      }

      const courseProgress = courses.map((course) => {
        const cp = courseProgressMap.get(course.id);
        return {
          courseId: course.id,
          courseTitle: course.title,
          thumbnail: course.thumbnail,
          category: course.category,
          totalChapters: course._count.chapters,
          completedChapters: cp?.completed || 0,
          progressPercent: cp ? Math.round((cp.completed / cp.total) * 100) : 0,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          role: 'STUDENT',
          totalCourses: courses.length,
          completedChapters,
          lockedChapters,
          averageScore: Math.round(averageScore),
          recentQuizzes: attempts,
          announcements,
          notifications,
          courseProgress,
        },
      });
    } else {
      // Teacher dashboard stats
      const [totalStudents, totalCourses, activeClassrooms, quizAttempts] = await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.course.count({ where: { teacherId: session.user.id } }),
        prisma.classroom.count({ where: { teacherId: session.user.id } }),
        prisma.quizAttempt.findMany({
          where: {
            quiz: { chapter: { course: { teacherId: session.user.id } } },
          },
          orderBy: { startedAt: 'desc' },
          take: 10,
          include: {
            student: { select: { name: true } },
            quiz: { select: { title: true } },
          },
        }),
      ]);

      const avgScore = quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length)
        : 0;

      return NextResponse.json({
        success: true,
        data: {
          role: 'TEACHER',
          totalStudents,
          totalCourses,
          activeClassrooms,
          averageQuizScore: avgScore,
          recentActivities: quizAttempts.map((a) => ({
            type: a.passed ? 'quiz_passed' : 'quiz_failed',
            message: `${a.student.name} scored ${a.percentage.toFixed(0)}% on ${a.quiz.title}`,
            createdAt: a.startedAt,
          })),
        },
      });
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
