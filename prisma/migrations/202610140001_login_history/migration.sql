CREATE TABLE "LoginEvent" (
 "id" TEXT NOT NULL,
 "userId" TEXT,
 "email" TEXT NOT NULL,
 "outcome" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "LoginEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LoginEvent_createdAt_idx" ON "LoginEvent"("createdAt");
CREATE INDEX "LoginEvent_email_createdAt_idx" ON "LoginEvent"("email", "createdAt");
