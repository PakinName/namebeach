import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/classrooms — List classrooms
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let classrooms;

    if (session.user.role === 'TEACHER' || session.user.role === 'ADMIN') {
      classrooms = await prisma.classroom.findMany({
        where: { teacherId: session.user.id },
        include: {
          teacher: { select: { id: true, name: true, avatar: true } },
          _count: { select: { members: true, lessons: true, announcements: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Students see classrooms they are members of
      classrooms = await prisma.classroom.findMany({
        where: {
          members: { some: { studentId: session.user.id } },
        },
        include: {
          teacher: { select: { id: true, name: true, avatar: true } },
          _count: { select: { members: true, lessons: true, announcements: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ success: true, data: classrooms });
  } catch (error) {
    console.error('Classrooms GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/classrooms — Create classroom (teacher) or Join (student)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Student joining with code
    if (body.code) {
      const classroom = await prisma.classroom.findUnique({
        where: { code: body.code },
      });

      if (!classroom) {
        return NextResponse.json({ success: false, error: 'Invalid classroom code' }, { status: 404 });
      }

      // Check if already a member
      const existing = await prisma.classroomMember.findUnique({
        where: {
          classroomId_studentId: {
            classroomId: classroom.id,
            studentId: session.user.id,
          },
        },
      });

      if (existing) {
        return NextResponse.json({ success: false, error: 'Already a member' }, { status: 409 });
      }

      await prisma.classroomMember.create({
        data: {
          classroomId: classroom.id,
          studentId: session.user.id,
        },
      });

      return NextResponse.json({ success: true, data: classroom, message: 'Joined classroom!' });
    }

    // Teacher creating classroom
    if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Only teachers can create classrooms' }, { status: 403 });
    }

    const { name, description } = body;
    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    // Generate unique invite code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const classroom = await prisma.classroom.create({
      data: {
        name,
        description: description || null,
        code,
        teacherId: session.user.id,
      },
      include: {
        teacher: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ success: true, data: classroom }, { status: 201 });
  } catch (error) {
    console.error('Classrooms POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
