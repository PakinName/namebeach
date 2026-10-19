import { z } from 'zod';
export const checkpointQuestions = z.array(z.object({
  questionText:z.string().trim().min(5).max(2000),
  options:z.array(z.string().trim().min(1).max(1000)).min(2).max(4),
  correctIndex:z.number().int().min(0).max(3),
  explanation:z.string().trim().min(1).max(2000),
}).refine(q=>q.correctIndex<q.options.length && new Set(q.options).size===q.options.length)).length(5);
export type CheckQuestion = z.infer<typeof checkpointQuestions>[number];
export function publicQuestions(questions:CheckQuestion[]) {
  return questions.map(({questionText,options})=>({questionText,options}));
}
