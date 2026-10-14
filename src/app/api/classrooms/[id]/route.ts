import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/classrooms/[id] — Get classroom detail
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

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true, avatar: true, email: true } },
        members: {
          include: {
            student: { select: { id: true, name: true, avatar: true, email: true } },
          },
          orderBy: { joinedAt: 'desc' },
        },
        announcements: {
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        fileUploads: {
          include: {
            uploader: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        lessons: {
          include: {
            lesson: {
              select: { id: true, title: true, description: true, estimatedTime: true },
            },
          },
        },
        _count: { select: { members: true } },
      },
    });

    if (!classroom) {
      return NextResponse.json({ success: false, error: 'Classroom not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: classroom });
  } catch (error) {
    console.error('Classroom detail error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/classrooms/[id] — Delete classroom
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const classroom = await prisma.classroom.findUnique({ where: { id } });
    if (!classroom || classroom.teacherId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    await prisma.classroom.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Classroom deleted' });
  } catch (error) {
    console.error('Classroom delete error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
