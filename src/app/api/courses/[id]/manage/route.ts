import { NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { courseEditorSchema } from '@/lib/course-editor';

type Context = { params: Promise<{ id: string }> };
const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status });
export async function GET(_request: Request, { params }: Context) {
  const session = await getActiveSession();
  if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) return fail('FORBIDDEN', 403);
  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id }, include: { chapters: { orderBy: { orderIndex: 'asc' }, include: { lessons: { orderBy: { orderIndex: 'asc' } } } } } });
  if (!course || (session.user.role !== 'ADMIN' && course.teacherId !== session.user.id)) return fail('FORBIDDEN', 403);
  const assets = await prisma.fileUpload.findMany({ where: { fileUrl: { startsWith: `/api/courses/${id}/assets/` } }, select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSize: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ success: true, data: { ...course, joinCodeHash:undefined, thumbnail: course.thumbnail || '', chapters: course.chapters.map(chapter => ({ ...chapter, description: chapter.description || '', lessons: chapter.lessons.map(lesson => ({ ...lesson, description: lesson.description || '', content: lesson.content || '', estimatedTime: lesson.estimatedTime || 15, videoUrl: lesson.videoUrl || '', pdfUrl: lesson.pdfUrl || '', slideUrl: lesson.slideUrl || '', codeExample: lesson.codeExample || '' })) })) }, assets });
}

export async function PUT(request: Request, { params }: Context) {
  const session = await getActiveSession();
  if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) return fail('FORBIDDEN', 403);
  const { id } = await params;
  const text = await request.text();
  if (text.length > 5000000) return fail('TOO_LARGE', 413);
  let body: unknown;
  try { body = JSON.parse(text); } catch { return fail('INVALID_COURSE', 400); }
  const parsed = courseEditorSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'INVALID_COURSE', details: parsed.error.issues.map(issue => issue.path.join('.') + ': ' + issue.message).slice(0, 5) }, { status: 400 });
  const { chapters, updatedAt, ...fields } = parsed.data;
  try {
    await prisma.$transaction(async tx => {
      const old = await tx.course.findUnique({ where: { id }, include: { chapters: { include: { quiz: true, lessons: true } } } });
      if (!old || (session.user.role !== 'ADMIN' && old.teacherId !== session.user.id)) throw new Error('FORBIDDEN');
      // Compare-and-swap also serializes concurrent saves to this course.
      const changed = await tx.course.updateMany({ where: { id, updatedAt: new Date(updatedAt) }, data: { ...fields, updatedAt: new Date(), estimatedTime: chapters.reduce((sum, ch) => sum + ch.lessons.reduce((s, l) => s + l.estimatedTime, 0), 0) } });
      if (!changed.count) throw new Error('CONFLICT');
      const chapterIds = chapters.flatMap(ch => ch.id ? [ch.id] : []);
      const lessonIds = chapters.flatMap(ch => ch.lessons.flatMap(l => l.id ? [l.id] : []));
      if (new Set(chapterIds).size !== chapterIds.length || new Set(lessonIds).size !== lessonIds.length) throw new Error('INVALID_COURSE');
      for (const ch of chapters) {
        const original = old.chapters.find(item => item.id === ch.id);
        if (ch.id && !original) throw new Error('INVALID_COURSE');
        for (const l of ch.lessons) if (l.id && !original?.lessons.some(item => item.id === l.id)) throw new Error('INVALID_COURSE');
      }
      const urls = [fields.thumbnail, ...chapters.flatMap(ch => ch.lessons.flatMap(l => [l.videoUrl, l.pdfUrl, l.slideUrl, ...l.imageUrls, ...l.resources]))];
      const internal = [...new Set(urls.filter(url => url.startsWith('/api/')))];
      if (internal.some(url => !url.startsWith(`/api/courses/${id}/assets/`))) throw new Error('INVALID_COURSE');
      if (internal.length && await tx.fileUpload.count({ where: { fileUrl: { in: internal } } }) !== internal.length) throw new Error('INVALID_COURSE');
      const removedChapters = old.chapters.filter(ch => !chapterIds.includes(ch.id));
      const removedLessons = old.chapters.flatMap(ch => ch.lessons).filter(l => !lessonIds.includes(l.id)).map(l => l.id);
      // Never silently erase student history, scheduled lessons, or quizzes.
      if (removedChapters.some(ch => ch.quiz) || await tx.studentProgress.count({ where: { chapterId: { in: removedChapters.map(ch => ch.id) } } }) || await tx.lessonCompletion.count({ where: { lessonId: { in: removedLessons } } }) || await tx.classroomLesson.count({ where: { lessonId: { in: removedLessons } } })) throw new Error('CONTENT_IN_USE');
      await tx.lesson.deleteMany({ where: { id: { in: removedLessons } } });
      await tx.chapter.deleteMany({ where: { id: { in: removedChapters.map(ch => ch.id) } } });
      for (const [orderIndex, ch] of chapters.entries()) {
        const chapter = ch.id ? await tx.chapter.update({ where: { id: ch.id }, data: { title: ch.title, description: ch.description, orderIndex } }) : await tx.chapter.create({ data: { courseId: id, title: ch.title, description: ch.description, orderIndex } });
        for (const [index, { id: lessonId, ...lesson }] of ch.lessons.entries()) {
          if (lessonId) await tx.lesson.update({ where: { id: lessonId }, data: { ...lesson, orderIndex: index } });
          else await tx.lesson.create({ data: { ...lesson, chapterId: chapter.id, orderIndex: index } });
        }
        if (orderIndex === 0) await tx.studentProgress.updateMany({ where: { chapterId: chapter.id }, data: { unlocked: true } });
      }
    }, { timeout: 30000 });
    return GET(request, { params: Promise.resolve({ id }) });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    return fail(['FORBIDDEN','CONFLICT','INVALID_COURSE','CONTENT_IN_USE'].includes(code) ? code : 'SAVE_FAILED', code === 'FORBIDDEN' ? 403 : ['CONFLICT','CONTENT_IN_USE'].includes(code) ? 409 : code === 'INVALID_COURSE' ? 400 : 500);
  }
}
