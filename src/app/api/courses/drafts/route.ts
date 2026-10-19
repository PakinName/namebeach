import { miniQuiz } from '@/lib/mini-quiz';
import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { courseDraftSchema } from '@/lib/course-draft';
export async function POST(request: Request) {
  const session = await getActiveSession();
  if (!session || !['TEACHER','ADMIN'].includes(session.user.role)) return NextResponse.json({ success: false, error: 'FORBIDDEN' }, { status: 403 });
  try {
    const text = await request.text();
    if (text.length > 600000) return NextResponse.json({ success: false, error: 'INVALID_DRAFT' }, { status: 413 });
    const parsed = courseDraftSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'INVALID_DRAFT' }, { status: 400 });
    const { chapters, ...course } = parsed.data;
    const saved = await prisma.course.create({ data: { ...course, teacherId: session.user.id, published: false,
      estimatedTime: chapters.reduce((sum, chapter) => sum + chapter.lessons.reduce((total, lesson) => total + lesson.estimatedTime,0),0),
      chapters: { create: chapters.map(({ lessons, ...chapter }, index) => ({ ...chapter, orderIndex: index, quiz:{create:miniQuiz(chapter.title)}, lessons: { create: lessons.map((lesson, orderIndex) => ({ ...lesson, orderIndex, imageUrls: [], resources: [] })) } })) },
    }, select: { id: true } });
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: 'SAVE_FAILED' }, { status: 500 }); }
}
