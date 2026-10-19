import { issueEligibleCertificates } from '@/lib/student-overview';
import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessLesson } from '@/lib/progression';

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
    if (!await canAccessLesson(session.user.id,id)) return NextResponse.json({ success: false, error: 'Chapter locked' }, { status: 403 });

    const already=await prisma.lessonCompletion.findUnique({where:{studentId_lessonId:{studentId:session.user.id,lessonId:id}}});
    if(!already&&!await prisma.lessonCheckAttempt.count({where:{studentId:session.user.id,lessonId:id,passed:true}}))return NextResponse.json({success:false,error:'ต้องผ่านแบบทดสอบย่อย 3 จาก 5 ข้อก่อน / Pass the lesson checkpoint (3/5) first.'},{status:403});
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

    await issueEligibleCertificates(session.user.id).catch(() => console.warn('Certificate eligibility deferred; retry from certificates page.'));
    return NextResponse.json({ success: true, message: 'Lesson marked as complete' });
  } catch (error) {
    console.error('Lesson complete error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
