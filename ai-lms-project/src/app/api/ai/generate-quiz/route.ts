import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// AI Generate Quiz endpoint
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { topic, numQuestions = 5, difficulty = 'medium' } = await request.json();

    if (!topic) {
      return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 });
    }

    const prompt = `Generate ${numQuestions} quiz questions about "${topic}" at ${difficulty} difficulty level.
Return a JSON array of questions. Each question should have:
- questionText: the question
- questionType: "MULTIPLE_CHOICE" or "TRUE_FALSE"
- options: array of {optionText, isCorrect} (4 options for MC, 2 for TF)
- explanation: brief explanation of the correct answer

Return ONLY valid JSON array, no markdown.`;

    let questions = [];

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2000 },
          }),
        }
      );

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      try {
        const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        questions = JSON.parse(cleaned);
      } catch {
        questions = [];
      }
    } else {
      // Demo questions
      questions = Array.from({ length: numQuestions }, (_, i) => ({
        questionText: `Sample question ${i + 1} about ${topic}?`,
        questionType: i % 3 === 0 ? 'TRUE_FALSE' : 'MULTIPLE_CHOICE',
        options: i % 3 === 0
          ? [
              { optionText: 'True', isCorrect: true },
              { optionText: 'False', isCorrect: false },
            ]
          : [
              { optionText: `Option A`, isCorrect: true },
              { optionText: `Option B`, isCorrect: false },
              { optionText: `Option C`, isCorrect: false },
              { optionText: `Option D`, isCorrect: false },
            ],
        explanation: `This is the explanation for question ${i + 1} about ${topic}.`,
      }));
    }

    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error('AI Generate Quiz error:', error);
    return NextResponse.json({ success: false, error: 'AI service error' }, { status: 500 });
  }
}
