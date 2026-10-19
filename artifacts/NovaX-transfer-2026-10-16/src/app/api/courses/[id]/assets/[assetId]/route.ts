import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { assetPath } from '@/lib/course-assets';
import { canAccessChapter } from '@/lib/progression';
export const runtime = 'nodejs';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; assetId: string }> }) {
  const session = await getActiveSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { id, assetId } = await params;
  const [course, asset] = await Promise.all([
    prisma.course.findUnique({ where: { id }, select: { teacherId: true, published: true, thumbnail: true } }),
    prisma.fileUpload.findUnique({ where: { id: assetId } }),
  ]);
  if (!course || !asset || asset.fileUrl !== `/api/courses/${id}/assets/${assetId}`) return new NextResponse(null, { status: 404 });
  const manages = session.user.role === 'ADMIN' || course.teacherId === session.user.id;
  if (!manages) {
    if (!course.published) return new NextResponse(null, { status: 404 });
    if (course.thumbnail !== asset.fileUrl) {
      const lessons = await prisma.lesson.findMany({ where: { chapter: { courseId: id }, OR: [{ imageUrls: { has: asset.fileUrl } }, { resources: { has: asset.fileUrl } }, { pdfUrl: asset.fileUrl }, { slideUrl: asset.fileUrl }, { videoUrl: asset.fileUrl }] }, select: { chapterId: true } });
      let permitted = false;
      for (const lesson of lessons) if (session.user.role !== 'STUDENT' || await canAccessChapter(session.user.id, id, lesson.chapterId)) { permitted = true; break; }
      if (!permitted) return new NextResponse(null, { status: 403 });
    }
  }
  try {
    const bytes = await readFile(assetPath(assetId));
    const inline = asset.fileType.startsWith('image/') || asset.fileType === 'application/pdf';
    return new NextResponse(bytes, { headers: { 'Content-Type': asset.fileType, 'Content-Length': String(bytes.length), 'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(asset.fileName)}`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store', 'Content-Security-Policy': "default-src 'none'; sandbox" } });
  } catch { return new NextResponse(null, { status: 404 }); }
}
