import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/classrooms/[id]/announcements — Create announcement
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Only teachers can post announcements' }, { status: 403 });
    }

    const { id } = await params;
    const { title, content, pinned } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Title and content are required' }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        classroomId: id,
        authorId: session.user.id,
        title,
        content,
        pinned: pinned || false,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Notify all classroom members
    const members = await prisma.classroomMember.findMany({
      where: { classroomId: id },
      select: { studentId: true },
    });

    if (members.length > 0) {
      await prisma.notification.createMany({
        data: members.map((m) => ({
          userId: m.studentId,
          type: 'ANNOUNCEMENT' as const,
          title: 'New Announcement',
          message: `${title} — in your classroom`,
          link: `/classrooms/${id}`,
        })),
      });
    }

    return NextResponse.json({ success: true, data: announcement }, { status: 201 });
  } catch (error) {
    console.error('Announcement error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
