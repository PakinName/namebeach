import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessLesson } from '@/lib/progression';

// GET /api/lessons/[id] — Get lesson detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            quiz:{select:{id:true}},
            course: { select: { id: true, title: true, published: true, teacherId: true } },
          },
        },
      },
    });

    if (!lesson || (!lesson.chapter.course.published && session.user.role !== 'ADMIN' && lesson.chapter.course.teacherId !== session.user.id)) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

    // Security: Check chapter access for students
    if (session.user.role === 'STUDENT') {
      const hasAccess = await canAccessLesson(session.user.id,id);

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'กรุณาเข้าร่วมคอร์สและเรียนเรื่องก่อนหน้าให้จบ / Join the course and complete previous lessons first.' },
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

    const nextLesson=await prisma.lesson.findFirst({where:{chapterId:lesson.chapterId,orderIndex:{gt:lesson.orderIndex}},orderBy:{orderIndex:'asc'},select:{id:true,title:true}});
    const files = await prisma.fileUpload.findMany({ where: { fileUrl: { in: lesson.resources } }, select: { fileUrl: true, fileName: true } });
    return NextResponse.json({
      success: true,
      data: { ...lesson, nextLesson, checkpointId:lesson.chapter.quiz?.id, completed, canComplete: session.user.role === 'STUDENT', canManage: session.user.role === 'ADMIN' || lesson.chapter.course.teacherId === session.user.id, resourceNames: Object.fromEntries(files.map(file => [file.fileUrl, file.fileName])) },
    });
  } catch (error) {
    console.error('Lesson GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
