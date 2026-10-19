CREATE TABLE "LessonCheckpoint" (
"id" TEXT PRIMARY KEY, "lessonId" TEXT NOT NULL UNIQUE, "questions" JSONB NOT NULL,
"reviewText" TEXT NOT NULL DEFAULT '', "updatedAt" TIMESTAMP(3) NOT NULL,
CONSTRAINT "LessonCheckpoint_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE "LessonCheckAttempt" (
"id" TEXT PRIMARY KEY, "lessonId" TEXT NOT NULL, "studentId" TEXT NOT NULL,
"score" INTEGER NOT NULL CHECK ("score" BETWEEN 0 AND 5), "passed" BOOLEAN NOT NULL,
"questions" JSONB NOT NULL, "answers" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "LessonCheckAttempt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE,
CONSTRAINT "LessonCheckAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE INDEX "LessonCheckAttempt_studentId_lessonId_createdAt_idx" ON "LessonCheckAttempt"("studentId","lessonId","createdAt");
