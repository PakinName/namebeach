import { z } from 'zod';
export const courseDraftSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(1).max(5000),
  category: z.string().trim().min(1).max(100),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  chapters: z.array(z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(2000),
    lessons: z.array(z.object({
      title: z.string().trim().min(1).max(200),
      content: z.string().trim().min(1).max(12000),
      objectives: z.array(z.string().min(1).max(500)).min(1).max(8),
      estimatedTime: z.number().int().min(1).max(240),
    })).min(1).max(5),
  })).min(1).max(8),
});
export type CourseDraft = z.infer<typeof courseDraftSchema>;
