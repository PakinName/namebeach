import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { processQuizCompletion } from '@/lib/progression';

// POST /api/quizzes/[id]/submit — Submit quiz answers
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { answers } = body as {
      answers: { questionId: string; selectedOptionId: string }[];
    };

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Answers are required' },
        { status: 400 }
      );
    }

    // Get quiz with questions and correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }

    // Grade the quiz
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers: {
      questionId: string;
      selectedOptionId: string;
      isCorrect: boolean;
      correctOptionId: string;
      explanation: string | null;
    }[] = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;

      const studentAnswer = answers.find((a) => a.questionId === question.id);
      const correctOption = question.options.find((o) => o.isCorrect);

      if (studentAnswer && correctOption) {
        const isCorrect = studentAnswer.selectedOptionId === correctOption.id;
        if (isCorrect) earnedPoints += question.points;

        gradedAnswers.push({
          questionId: question.id,
          selectedOptionId: studentAnswer.selectedOptionId,
          isCorrect,
          correctOptionId: correctOption.id,
          explanation: question.explanation,
        });
      }
    }

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentage >= quiz.passingScore;

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: id,
        studentId: session.user.id,
        score: earnedPoints,
        percentage,
        passed,
        completedAt: new Date(),
        answers: {
          create: gradedAnswers.map((a) => ({
            questionId: a.questionId,
            selectedOptionId: a.selectedOptionId,
            isCorrect: a.isCorrect,
          })),
        },
      },
    });

    // Process progression
    const progressionResult = await processQuizCompletion(
      session.user.id,
      id,
      earnedPoints,
      percentage
    );

    // Get full questions with correct answers for results display
    const questionsWithAnswers = quiz.questions.map((q) => {
      const graded = gradedAnswers.find((a) => a.questionId === q.id);
      return {
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        explanation: q.explanation,
        options: q.options.map((o) => ({
          id: o.id,
          optionText: o.optionText,
          isCorrect: o.isCorrect,
        })),
        selectedOptionId: graded?.selectedOptionId || null,
        isCorrect: graded?.isCorrect || false,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        attemptId: attempt.id,
        score: earnedPoints,
        totalPoints,
        percentage: Math.round(percentage * 10) / 10,
        passed,
        message: progressionResult.message,
        nextChapterUnlocked: progressionResult.nextChapterUnlocked,
        nextChapterId: progressionResult.nextChapterId,
        questions: questionsWithAnswers,
      },
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
