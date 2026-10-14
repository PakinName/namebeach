import prisma from './prisma';

/**
 * Progression Engine — handles mastery-based chapter progression
 * Students must score >= 50% on a chapter's quiz to unlock the next chapter
 */

/**
 * Check if a student can access a specific chapter
 */
export async function canAccessChapter(
  studentId: string,
  courseId: string,
  chapterId: string
): Promise<boolean> {
  // Get the chapter and its order
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { orderIndex: true, courseId: true },
  });

  if (!chapter || chapter.courseId !== courseId) return false;

  // First chapter is always accessible
  if (chapter.orderIndex === 0) return true;

  // Check if this chapter is explicitly unlocked
  const progress = await prisma.studentProgress.findUnique({
    where: {
      studentId_courseId_chapterId: {
        studentId,
        courseId,
        chapterId,
      },
    },
  });

  return progress?.unlocked === true;
}

/**
 * Initialize progress for a student enrolling in a course
 * Unlocks only the first chapter
 */
export async function initializeCourseProgress(
  studentId: string,
  courseId: string
): Promise<void> {
  const chapters = await prisma.chapter.findMany({
    where: { courseId },
    orderBy: { orderIndex: 'asc' },
  });

  if (chapters.length === 0) return;

  // Create progress entries for all chapters
  for (const chapter of chapters) {
    await prisma.studentProgress.upsert({
      where: {
        studentId_courseId_chapterId: {
          studentId,
          courseId,
          chapterId: chapter.id,
        },
      },
      update: {},
      create: {
        studentId,
        courseId,
        chapterId: chapter.id,
        unlocked: chapter.orderIndex === 0, // Only first chapter unlocked
        completed: false,
        highestScore: 0,
      },
    });
  }
}

/**
 * Process quiz completion and handle chapter progression
 * Returns whether the student passed and what happened
 */
export async function processQuizCompletion(
  studentId: string,
  quizId: string,
  score: number,
  percentage: number
): Promise<{
  passed: boolean;
  nextChapterUnlocked: boolean;
  nextChapterId: string | null;
  message: string;
}> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      chapter: {
        include: {
          course: {
            include: {
              chapters: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!quiz) throw new Error('Quiz not found');

  const { chapter } = quiz;
  const passed = percentage >= quiz.passingScore;

  // Update progress with highest score
  const existingProgress = await prisma.studentProgress.findUnique({
    where: {
      studentId_courseId_chapterId: {
        studentId,
        courseId: chapter.courseId,
        chapterId: chapter.id,
      },
    },
  });

  const highestScore = Math.max(existingProgress?.highestScore || 0, percentage);

  await prisma.studentProgress.upsert({
    where: {
      studentId_courseId_chapterId: {
        studentId,
        courseId: chapter.courseId,
        chapterId: chapter.id,
      },
    },
    update: {
      highestScore,
      completed: passed || existingProgress?.completed || false,
      completedAt: passed && !existingProgress?.completed ? new Date() : existingProgress?.completedAt,
    },
    create: {
      studentId,
      courseId: chapter.courseId,
      chapterId: chapter.id,
      unlocked: true,
      completed: passed,
      highestScore,
      completedAt: passed ? new Date() : null,
    },
  });

  let nextChapterUnlocked = false;
  let nextChapterId: string | null = null;

  if (passed) {
    // Find the next chapter
    const courseChapters = chapter.course.chapters;
    const currentIndex = courseChapters.findIndex((c) => c.id === chapter.id);
    const nextChapter = courseChapters[currentIndex + 1];

    if (nextChapter) {
      // Unlock the next chapter
      await prisma.studentProgress.upsert({
        where: {
          studentId_courseId_chapterId: {
            studentId,
            courseId: chapter.courseId,
            chapterId: nextChapter.id,
          },
        },
        update: { unlocked: true },
        create: {
          studentId,
          courseId: chapter.courseId,
          chapterId: nextChapter.id,
          unlocked: true,
          completed: false,
          highestScore: 0,
        },
      });

      nextChapterUnlocked = true;
      nextChapterId = nextChapter.id;

      // Create notification
      await prisma.notification.create({
        data: {
          userId: studentId,
          type: 'CHAPTER_UNLOCKED',
          title: 'Chapter Unlocked! 🔓',
          message: `You've unlocked "${nextChapter.title}" in ${chapter.course.title}`,
          link: `/courses/${chapter.courseId}`,
        },
      });
    }

    // Quiz passed notification
    await prisma.notification.create({
      data: {
        userId: studentId,
        type: 'QUIZ_PASSED',
        title: 'Quiz Passed! ✅',
        message: `You scored ${percentage.toFixed(0)}% on "${quiz.title}"`,
        link: `/quizzes/${quizId}`,
      },
    });
  } else {
    // Quiz failed notification
    await prisma.notification.create({
      data: {
        userId: studentId,
        type: 'QUIZ_FAILED',
        title: 'Quiz Not Passed',
        message: `You scored ${percentage.toFixed(0)}% on "${quiz.title}". Need ${quiz.passingScore}% to pass.`,
        link: `/quizzes/${quizId}`,
      },
    });
  }

  return {
    passed,
    nextChapterUnlocked,
    nextChapterId,
    message: passed
      ? `🎉 Congratulations! You passed with ${percentage.toFixed(0)}%!`
      : `You scored ${percentage.toFixed(0)}%. You need at least ${quiz.passingScore}% to pass. (ขั้นต่ำ ${quiz.passingScore}%) Try again!`,
  };
}

/**
 * Get complete progress data for a student in a course
 */
export async function getStudentCourseProgress(
  studentId: string,
  courseId: string
) {
  const chapters = await prisma.chapter.findMany({
    where: { courseId },
    orderBy: { orderIndex: 'asc' },
    include: {
      quiz: { select: { id: true } },
      lessons: { select: { id: true } },
    },
  });

  const progressRecords = await prisma.studentProgress.findMany({
    where: { studentId, courseId },
  });

  const progressMap = new Map(
    progressRecords.map((p) => [p.chapterId, p])
  );

  const chaptersWithProgress = chapters.map((chapter, index) => {
    const progress = progressMap.get(chapter.id);
    return {
      ...chapter,
      progress: progress
        ? {
            completed: progress.completed,
            unlocked: progress.unlocked,
            highestScore: progress.highestScore,
          }
        : {
            completed: false,
            unlocked: index === 0, // First chapter always unlocked
            highestScore: 0,
          },
    };
  });

  const completedCount = chaptersWithProgress.filter(
    (c) => c.progress.completed
  ).length;

  return {
    chapters: chaptersWithProgress,
    totalChapters: chapters.length,
    completedChapters: completedCount,
    progressPercent:
      chapters.length > 0
        ? Math.round((completedCount / chapters.length) * 100)
        : 0,
  };
}
