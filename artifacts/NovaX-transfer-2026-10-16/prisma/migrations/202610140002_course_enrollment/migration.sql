ALTER TABLE "Course" ADD COLUMN "joinCodeHash" TEXT;
CREATE TABLE "CourseEnrollment" ("id" TEXT NOT NULL,"studentId" TEXT NOT NULL,"courseId" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "CourseEnrollment_studentId_courseId_key" ON "CourseEnrollment"("studentId","courseId");
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
