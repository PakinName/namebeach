import { z } from 'zod';

export const safeResourceUrl = z.string().max(2000).refine(value => {
  if (!value) return true;
  if (/^\/api\/courses\/[a-zA-Z0-9_-]+\/assets\/[a-zA-Z0-9_-]+$/.test(value)) return true;
  try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; }
}, 'Use an HTTP or HTTPS URL.');
const lesson = z.object({
  id: z.string().optional(), title: z.string().trim().min(1).max(200),
  description: z.string().max(5000), content: z.string().max(100000),
  objectives: z.array(z.string().trim().min(1).max(500)).max(20),
  estimatedTime: z.number().int().min(1).max(1440),
  videoUrl: safeResourceUrl, pdfUrl: safeResourceUrl, slideUrl: safeResourceUrl,
  imageUrls: z.array(safeResourceUrl).max(30), resources: z.array(safeResourceUrl).max(50),
  codeExample: z.string().max(30000),
});
export const courseEditorSchema = z.object({
  updatedAt: z.string().datetime(), title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(1).max(5000), category: z.string().trim().min(1).max(100),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']), thumbnail: safeResourceUrl,
  published: z.boolean(), chapters: z.array(z.object({
    id: z.string().optional(), title: z.string().trim().min(1).max(200), description: z.string().max(2000),
    lessons: z.array(lesson).min(1).max(50),
  })).min(1).max(40),
}).superRefine((course, ctx) => {
  if (course.chapters.reduce((count, chapter) => count + chapter.lessons.length, 0) > 200) ctx.addIssue({ code: 'custom', message: 'Maximum 200 lessons per course.' });
  if (course.published && course.chapters.some(chapter => chapter.lessons.some(item => !item.content.trim() && !item.videoUrl && !item.pdfUrl && !item.resources.length && !item.imageUrls.length))) ctx.addIssue({ code: 'custom', message: 'Published lessons need content or learning media.' });
});
export type EditableCourse = z.infer<typeof courseEditorSchema>;
export type EditableLesson = EditableCourse['chapters'][number]['lessons'][number];
export const blankLesson = (): EditableLesson => ({ title: '', description: '', content: '', objectives: [], estimatedTime: 15, videoUrl: '', pdfUrl: '', slideUrl: '', imageUrls: [], resources: [], codeExample: '' });
