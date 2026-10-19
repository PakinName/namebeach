ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'SHORT_ANSWER';
ALTER TABLE "User" ADD COLUMN "fullName" TEXT, ADD COLUMN "nickname" TEXT, ADD COLUMN "teacherApproval" TEXT NOT NULL DEFAULT 'APPROVED', ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "QuizQuestion" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "QuizAttempt" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'GRADED', ADD COLUMN "totalPoints" DOUBLE PRECISION NOT NULL DEFAULT 0, ADD COLUMN "passingScore" DOUBLE PRECISION NOT NULL DEFAULT 50;
UPDATE "QuizAttempt" a SET "passingScore"=q."passingScore", "totalPoints"=(SELECT COALESCE(SUM(qq.points),0) FROM "QuizQuestion" qq WHERE qq."quizId"=q.id) FROM "Quiz" q WHERE a."quizId"=q.id;
ALTER TABLE "QuizAnswer" ALTER COLUMN "selectedOptionId" DROP NOT NULL, ADD COLUMN "textAnswer" TEXT, ADD COLUMN "awardedPoints" DOUBLE PRECISION, ADD COLUMN "feedback" TEXT;
UPDATE "QuizAnswer" a SET "awardedPoints"=CASE WHEN a."isCorrect" THEN q.points ELSE 0 END FROM "QuizQuestion" q WHERE a."questionId"=q.id;
INSERT INTO "CourseEnrollment" (id,"studentId","courseId","createdAt") SELECT md5(x."studentId"||x."courseId"),x."studentId",x."courseId",CURRENT_TIMESTAMP FROM (SELECT "studentId","courseId" FROM "StudentProgress" UNION SELECT lc."studentId",c."courseId" FROM "LessonCompletion" lc JOIN "Lesson" l ON l.id=lc."lessonId" JOIN "Chapter" c ON c.id=l."chapterId" UNION SELECT a."studentId",c."courseId" FROM "QuizAttempt" a JOIN "Quiz" q ON q.id=a."quizId" JOIN "Chapter" c ON c.id=q."chapterId") x ON CONFLICT ("studentId","courseId") DO NOTHING;
