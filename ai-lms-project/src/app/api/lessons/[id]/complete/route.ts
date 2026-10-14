import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/lessons/[id]/complete — Mark lesson as complete
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!lesson) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

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

    return NextResponse.json({ success: true, message: 'Lesson marked as complete' });
  } catch (error) {
    console.error('Lesson complete error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
