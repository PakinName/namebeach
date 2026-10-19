import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
export async function GET() {
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const files = await prisma.fileUpload.findMany({
      where: { OR: [{ uploaderId: session.user.id }, { classroom: { teacherId: session.user.id } }, { classroom: { members: { some: { studentId: session.user.id } } } }] },
      select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSize: true, classroom: { select: { name: true } }, uploader: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: files });
  } catch { return NextResponse.json({ success: false, error: 'Unable to load resources' }, { status: 500 }); }
}

