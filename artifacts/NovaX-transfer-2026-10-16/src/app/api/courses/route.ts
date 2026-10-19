import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { studentOverview, issueEligibleCertificates } from '@/lib/student-overview';
import { courseDraftSchema } from '@/lib/course-draft';

// GET /api/courses โ€” List all published courses
export async function GET() {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      where: session.user.role === 'ADMIN' ? {} : session.user.role === 'TEACHER' ? { teacherId: session.user.id } : { published: true },
      include: {
        teacher: { select: { id: true, name: true, avatar: true } },
        _count: { select: { chapters: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get progress for student
    if (session.user.role === 'STUDENT') {
      await issueEligibleCertificates(session.user.id);
      const overview = new Map((await studentOverview(session.user.id)).map(item=>[item.courseId,item]));
      const certificates = await prisma.certificate.findMany({where:{studentId:session.user.id,revokedAt:null},select:{courseId:true,verificationId:true}});
      const certificateMap = new Map(certificates.map(item=>[item.courseId,item.verificationId]));
      const memberships = await prisma.courseEnrollment.findMany({where:{studentId:session.user.id},select:{courseId:true}});
      const coursesWithProgress = courses.map(course=>({...course,joinCodeHash:undefined,requiresCode:!!course.joinCodeHash,enrolled:memberships.some(e=>e.courseId===course.id),progress:overview.get(course.id)?.progressPercent||0,certificateId:certificateMap.get(course.id)||null}));

      return NextResponse.json({ success: true, data: coursesWithProgress });
    }

    return NextResponse.json({ success: true, data: courses.map(course=>({...course,joinCodeHash:undefined,requiresCode:!!course.joinCodeHash})) });
  } catch (error) {
    console.error('Courses GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/courses โ€” Create a course (teacher only)
export async function POST(request: Request) {
  try {
    const session = await getActiveSession();
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const text = await request.text();
    if (text.length > 600000) return NextResponse.json({ success: false, error: 'INVALID_COURSE' }, { status: 413 });
    let body: unknown;
    try { body = JSON.parse(text); } catch { return NextResponse.json({ success: false, error: 'INVALID_COURSE' }, { status: 400 }); }
    const parsed = courseDraftSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: 'INVALID_COURSE' }, { status: 400 });
    const { chapters, ...details } = parsed.data;
    const published = typeof body === 'object' && body !== null && 'published' in body ? body.published === true : true;

    const course = await prisma.course.create({
      data: {
        ...details,
        estimatedTime: chapters.reduce((sum, chapter) => sum + chapter.lessons.reduce((total, lesson) => total + lesson.estimatedTime, 0), 0),
        teacherId: session.user.id,
        published,
        chapters: { create: chapters.map(({ lessons, ...chapter }, orderIndex) => ({ ...chapter, orderIndex,
          lessons: { create: lessons.map((lesson, index) => ({ ...lesson, orderIndex: index, imageUrls: [], resources: [] })) },
        })) },
      },
      include: {
        teacher: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ success: true, data: course }, { status: 201 });
  } catch (error) {
    console.error('Courses POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
