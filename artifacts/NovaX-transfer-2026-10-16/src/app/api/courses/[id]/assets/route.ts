import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { assetDirectory, assetPath, detectAsset } from '@/lib/course-assets';
export const runtime = 'nodejs';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getActiveSession();
  if (!session || !['TEACHER','ADMIN'].includes(session.user.role)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id }, select: { teacherId: true } });
  if (!course || (session.user.role !== 'ADMIN' && course.teacherId !== session.user.id)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  if (Number(request.headers.get('content-length')) > 16 * 1024 * 1024) return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 413 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || !file.size || file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 413 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const type = detectAsset(file.name, bytes);
    if (!type) return NextResponse.json({ error: 'INVALID_FILE' }, { status: 400 });
    const assetId = randomUUID();
    const fileUrl = `/api/courses/${id}/assets/${assetId}`;
    await mkdir(assetDirectory, { recursive: true });
    await writeFile(assetPath(assetId), bytes, { flag: 'wx' });
    try {
      const asset = await prisma.fileUpload.create({ data: { id: assetId, uploaderId: session.user.id, fileName: file.name.replace(/[\r\n/\\]/g, '_').slice(0, 200), fileUrl, fileType: type, fileSize: file.size } });
      return NextResponse.json({ success: true, data: asset }, { status: 201 });
    } catch { await unlink(assetPath(assetId)); throw new Error('UPLOAD_FAILED'); }
  } catch { return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 }); }
}
