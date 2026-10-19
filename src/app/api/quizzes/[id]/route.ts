import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canTakeQuiz } from '@/lib/progression';

// GET /api/quizzes/[id] — Get quiz with questions and options
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

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            course: { select: { id: true, title: true, teacherId:true, published:true } },
          },
        },
        questions: {
          where:{active:true},
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

    if(session.user.role==='TEACHER'&&quiz.chapter.course.teacherId!==session.user.id)return NextResponse.json({success:false,error:'Forbidden'},{status:403});
    if(session.user.role==='STUDENT'&&!quiz.chapter.course.published)return NextResponse.json({success:false,error:'Not found'},{status:404});

    // Security: Check chapter access for students
    if (session.user.role === 'STUDENT') {
      const hasAccess = await canTakeQuiz(
        session.user.id,
        quiz.chapterId
      );

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'กรุณาเข้าร่วมคอร์สและเรียนทุกเรื่องในบทนี้ให้จบก่อนทำแบบทดสอบ / Join and complete every lesson in this chapter first.' },
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
        include:{answers:{select:{id:true,textAnswer:true,awardedPoints:true,feedback:true,question:{select:{questionText:true,points:true}}}}},
      });
    }

    return NextResponse.json({
      success: true,
      data: { ...quiz, revision:quiz.updatedAt.toISOString(), questions:quiz.questions.map(question=>({id:question.id,questionText:question.questionText,questionType:question.questionType,points:question.points,orderIndex:question.orderIndex,options:question.options})), attempts },
    });
  } catch (error) {
    console.error('Quiz GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
