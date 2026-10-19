--
-- PostgreSQL database dump
--

\restrict p2nqJYo31Ippm2opdrPygZD7VrfrWqiT2nmmcbd5iXGfDnW5abW0qQVtAa7vAGj

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: Difficulty; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Difficulty" AS ENUM (
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'NEW_LESSON',
    'QUIZ_AVAILABLE',
    'QUIZ_PASSED',
    'QUIZ_FAILED',
    'CHAPTER_UNLOCKED',
    'ANNOUNCEMENT',
    'GENERAL'
);


--
-- Name: QuestionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuestionType" AS ENUM (
    'MULTIPLE_CHOICE',
    'TRUE_FALSE'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'STUDENT',
    'TEACHER',
    'ADMIN'
);


--
-- Name: SupportStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SupportStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AiConversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AiConversation" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    provider text NOT NULL,
    model text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AiMessage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AiMessage" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: AiRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AiRequest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    provider text NOT NULL,
    model text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Announcement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Announcement" (
    id text NOT NULL,
    "classroomId" text NOT NULL,
    "authorId" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AuditEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditEvent" (
    id text NOT NULL,
    "actorId" text NOT NULL,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Certificate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Certificate" (
    id text NOT NULL,
    "verificationId" text NOT NULL,
    "studentId" text NOT NULL,
    "courseId" text NOT NULL,
    "studentName" text NOT NULL,
    "courseTitle" text NOT NULL,
    "issuedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "revokeReason" text,
    criteria jsonb NOT NULL
);


--
-- Name: Chapter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Chapter" (
    id text NOT NULL,
    "courseId" text NOT NULL,
    title text NOT NULL,
    description text,
    "orderIndex" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Classroom; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Classroom" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    code text NOT NULL,
    thumbnail text,
    "teacherId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ClassroomLesson; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ClassroomLesson" (
    id text NOT NULL,
    "classroomId" text NOT NULL,
    "lessonId" text NOT NULL,
    "scheduledAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ClassroomMember; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ClassroomMember" (
    id text NOT NULL,
    "classroomId" text NOT NULL,
    "studentId" text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ContactSupport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ContactSupport" (
    id text NOT NULL,
    "userId" text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status public."SupportStatus" NOT NULL,
    response text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Course; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Course" (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    thumbnail text,
    category text NOT NULL,
    difficulty public."Difficulty" NOT NULL,
    "estimatedTime" integer,
    published boolean DEFAULT false NOT NULL,
    "teacherId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "joinCodeHash" text
);


--
-- Name: CourseEnrollment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CourseEnrollment" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "courseId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: FileUpload; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FileUpload" (
    id text NOT NULL,
    "classroomId" text,
    "uploaderId" text NOT NULL,
    "fileName" text NOT NULL,
    "fileUrl" text NOT NULL,
    "fileType" text NOT NULL,
    "fileSize" integer NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Lesson; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Lesson" (
    id text NOT NULL,
    "chapterId" text NOT NULL,
    title text NOT NULL,
    description text,
    content text,
    "videoUrl" text,
    "pdfUrl" text,
    "slideUrl" text,
    "imageUrls" text[],
    "codeExample" text,
    "estimatedTime" integer,
    objectives text[],
    resources text[],
    "orderIndex" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LessonCompletion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LessonCompletion" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "lessonId" text NOT NULL,
    "completedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: LoginEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LoginEvent" (
    id text NOT NULL,
    "userId" text,
    email text NOT NULL,
    outcome text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    link text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Quiz; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Quiz" (
    id text NOT NULL,
    "chapterId" text NOT NULL,
    title text NOT NULL,
    description text,
    "passingScore" double precision DEFAULT 50 NOT NULL,
    "timeLimit" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: QuizAnswer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QuizAnswer" (
    id text NOT NULL,
    "attemptId" text NOT NULL,
    "questionId" text NOT NULL,
    "selectedOptionId" text NOT NULL,
    "isCorrect" boolean NOT NULL
);


--
-- Name: QuizAttempt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QuizAttempt" (
    id text NOT NULL,
    "quizId" text NOT NULL,
    "studentId" text NOT NULL,
    score double precision NOT NULL,
    percentage double precision NOT NULL,
    passed boolean NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone
);


--
-- Name: QuizOption; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QuizOption" (
    id text NOT NULL,
    "questionId" text NOT NULL,
    "optionText" text NOT NULL,
    "isCorrect" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: QuizQuestion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QuizQuestion" (
    id text NOT NULL,
    "quizId" text NOT NULL,
    "questionText" text NOT NULL,
    "questionType" public."QuestionType" NOT NULL,
    explanation text,
    "orderIndex" integer NOT NULL,
    points integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SiteSetting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SiteSetting" (
    key text NOT NULL,
    value jsonb NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: StudentProgress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StudentProgress" (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "courseId" text NOT NULL,
    "chapterId" text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    unlocked boolean DEFAULT false NOT NULL,
    "highestScore" double precision DEFAULT 0 NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SupportReply; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SupportReply" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "authorId" text NOT NULL,
    message text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" NOT NULL,
    avatar text,
    phone text,
    bio text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: AiConversation AiConversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AiConversation"
    ADD CONSTRAINT "AiConversation_pkey" PRIMARY KEY (id);


--
-- Name: AiMessage AiMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AiMessage"
    ADD CONSTRAINT "AiMessage_pkey" PRIMARY KEY (id);


--
-- Name: AiRequest AiRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AiRequest"
    ADD CONSTRAINT "AiRequest_pkey" PRIMARY KEY (id);


--
-- Name: Announcement Announcement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_pkey" PRIMARY KEY (id);


--
-- Name: AuditEvent AuditEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditEvent"
    ADD CONSTRAINT "AuditEvent_pkey" PRIMARY KEY (id);


--
-- Name: Certificate Certificate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_pkey" PRIMARY KEY (id);


--
-- Name: Chapter Chapter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chapter"
    ADD CONSTRAINT "Chapter_pkey" PRIMARY KEY (id);


--
-- Name: ClassroomLesson ClassroomLesson_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassroomLesson"
    ADD CONSTRAINT "ClassroomLesson_pkey" PRIMARY KEY (id);


--
-- Name: ClassroomMember ClassroomMember_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassroomMember"
    ADD CONSTRAINT "ClassroomMember_pkey" PRIMARY KEY (id);


--
-- Name: Classroom Classroom_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Classroom"
    ADD CONSTRAINT "Classroom_pkey" PRIMARY KEY (id);


--
-- Name: ContactSupport ContactSupport_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContactSupport"
    ADD CONSTRAINT "ContactSupport_pkey" PRIMARY KEY (id);


--
-- Name: CourseEnrollment CourseEnrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseEnrollment"
    ADD CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY (id);


--
-- Name: Course Course_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_pkey" PRIMARY KEY (id);


--
-- Name: FileUpload FileUpload_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FileUpload"
    ADD CONSTRAINT "FileUpload_pkey" PRIMARY KEY (id);


--
-- Name: LessonCompletion LessonCompletion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LessonCompletion"
    ADD CONSTRAINT "LessonCompletion_pkey" PRIMARY KEY (id);


--
-- Name: Lesson Lesson_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lesson"
    ADD CONSTRAINT "Lesson_pkey" PRIMARY KEY (id);


--
-- Name: LoginEvent LoginEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LoginEvent"
    ADD CONSTRAINT "LoginEvent_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: QuizAnswer QuizAnswer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizAnswer"
    ADD CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY (id);


--
-- Name: QuizAttempt QuizAttempt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizAttempt"
    ADD CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY (id);


--
-- Name: QuizOption QuizOption_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizOption"
    ADD CONSTRAINT "QuizOption_pkey" PRIMARY KEY (id);


--
-- Name: QuizQuestion QuizQuestion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizQuestion"
    ADD CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY (id);


--
-- Name: Quiz Quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Quiz"
    ADD CONSTRAINT "Quiz_pkey" PRIMARY KEY (id);


--
-- Name: SiteSetting SiteSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SiteSetting"
    ADD CONSTRAINT "SiteSetting_pkey" PRIMARY KEY (key);


--
-- Name: StudentProgress StudentProgress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentProgress"
    ADD CONSTRAINT "StudentProgress_pkey" PRIMARY KEY (id);


--
-- Name: SupportReply SupportReply_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupportReply"
    ADD CONSTRAINT "SupportReply_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AiConversation_userId_updatedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AiConversation_userId_updatedAt_idx" ON public."AiConversation" USING btree ("userId", "updatedAt");


--
-- Name: AiMessage_conversationId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AiMessage_conversationId_createdAt_idx" ON public."AiMessage" USING btree ("conversationId", "createdAt");


--
-- Name: AiRequest_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AiRequest_userId_createdAt_idx" ON public."AiRequest" USING btree ("userId", "createdAt");


--
-- Name: Announcement_classroomId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Announcement_classroomId_idx" ON public."Announcement" USING btree ("classroomId");


--
-- Name: AuditEvent_actorId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON public."AuditEvent" USING btree ("actorId", "createdAt");


--
-- Name: AuditEvent_entityType_entityId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditEvent_entityType_entityId_createdAt_idx" ON public."AuditEvent" USING btree ("entityType", "entityId", "createdAt");


--
-- Name: Certificate_studentId_courseId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Certificate_studentId_courseId_key" ON public."Certificate" USING btree ("studentId", "courseId");


--
-- Name: Certificate_verificationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Certificate_verificationId_key" ON public."Certificate" USING btree ("verificationId");


--
-- Name: Chapter_courseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Chapter_courseId_idx" ON public."Chapter" USING btree ("courseId");


--
-- Name: ClassroomLesson_classroomId_lessonId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ClassroomLesson_classroomId_lessonId_key" ON public."ClassroomLesson" USING btree ("classroomId", "lessonId");


--
-- Name: ClassroomMember_classroomId_studentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ClassroomMember_classroomId_studentId_key" ON public."ClassroomMember" USING btree ("classroomId", "studentId");


--
-- Name: Classroom_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Classroom_code_key" ON public."Classroom" USING btree (code);


--
-- Name: Classroom_teacherId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Classroom_teacherId_idx" ON public."Classroom" USING btree ("teacherId");


--
-- Name: ContactSupport_status_updatedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContactSupport_status_updatedAt_idx" ON public."ContactSupport" USING btree (status, "updatedAt");


--
-- Name: ContactSupport_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContactSupport_userId_createdAt_idx" ON public."ContactSupport" USING btree ("userId", "createdAt");


--
-- Name: CourseEnrollment_studentId_courseId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CourseEnrollment_studentId_courseId_key" ON public."CourseEnrollment" USING btree ("studentId", "courseId");


--
-- Name: Course_teacherId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Course_teacherId_idx" ON public."Course" USING btree ("teacherId");


--
-- Name: FileUpload_classroomId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FileUpload_classroomId_idx" ON public."FileUpload" USING btree ("classroomId");


--
-- Name: FileUpload_uploaderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FileUpload_uploaderId_idx" ON public."FileUpload" USING btree ("uploaderId");


--
-- Name: LessonCompletion_studentId_lessonId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LessonCompletion_studentId_lessonId_key" ON public."LessonCompletion" USING btree ("studentId", "lessonId");


--
-- Name: Lesson_chapterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Lesson_chapterId_idx" ON public."Lesson" USING btree ("chapterId");


--
-- Name: LoginEvent_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LoginEvent_createdAt_idx" ON public."LoginEvent" USING btree ("createdAt");


--
-- Name: LoginEvent_email_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LoginEvent_email_createdAt_idx" ON public."LoginEvent" USING btree (email, "createdAt");


--
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- Name: QuizAttempt_quizId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QuizAttempt_quizId_idx" ON public."QuizAttempt" USING btree ("quizId");


--
-- Name: QuizAttempt_studentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QuizAttempt_studentId_idx" ON public."QuizAttempt" USING btree ("studentId");


--
-- Name: QuizOption_questionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QuizOption_questionId_idx" ON public."QuizOption" USING btree ("questionId");


--
-- Name: QuizQuestion_quizId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QuizQuestion_quizId_idx" ON public."QuizQuestion" USING btree ("quizId");


--
-- Name: Quiz_chapterId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Quiz_chapterId_key" ON public."Quiz" USING btree ("chapterId");


--
-- Name: StudentProgress_courseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StudentProgress_courseId_idx" ON public."StudentProgress" USING btree ("courseId");


--
-- Name: StudentProgress_studentId_courseId_chapterId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "StudentProgress_studentId_courseId_chapterId_key" ON public."StudentProgress" USING btree ("studentId", "courseId", "chapterId");


--
-- Name: StudentProgress_studentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StudentProgress_studentId_idx" ON public."StudentProgress" USING btree ("studentId");


--
-- Name: SupportReply_ticketId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SupportReply_ticketId_createdAt_idx" ON public."SupportReply" USING btree ("ticketId", "createdAt");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: AiConversation AiConversation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AiConversation"
    ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AiMessage AiMessage_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AiMessage"
    ADD CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."AiConversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AiRequest AiRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AiRequest"
    ADD CONSTRAINT "AiRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Announcement Announcement_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Announcement Announcement_classroomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES public."Classroom"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditEvent AuditEvent_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditEvent"
    ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Certificate Certificate_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Certificate Certificate_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Chapter Chapter_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chapter"
    ADD CONSTRAINT "Chapter_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClassroomLesson ClassroomLesson_classroomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassroomLesson"
    ADD CONSTRAINT "ClassroomLesson_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES public."Classroom"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClassroomLesson ClassroomLesson_lessonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassroomLesson"
    ADD CONSTRAINT "ClassroomLesson_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES public."Lesson"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ClassroomMember ClassroomMember_classroomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassroomMember"
    ADD CONSTRAINT "ClassroomMember_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES public."Classroom"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClassroomMember ClassroomMember_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassroomMember"
    ADD CONSTRAINT "ClassroomMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Classroom Classroom_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Classroom"
    ADD CONSTRAINT "Classroom_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ContactSupport ContactSupport_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContactSupport"
    ADD CONSTRAINT "ContactSupport_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CourseEnrollment CourseEnrollment_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseEnrollment"
    ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Course Course_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FileUpload FileUpload_classroomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FileUpload"
    ADD CONSTRAINT "FileUpload_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES public."Classroom"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FileUpload FileUpload_uploaderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FileUpload"
    ADD CONSTRAINT "FileUpload_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LessonCompletion LessonCompletion_lessonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LessonCompletion"
    ADD CONSTRAINT "LessonCompletion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES public."Lesson"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LessonCompletion LessonCompletion_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LessonCompletion"
    ADD CONSTRAINT "LessonCompletion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lesson Lesson_chapterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lesson"
    ADD CONSTRAINT "Lesson_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES public."Chapter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuizAnswer QuizAnswer_attemptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizAnswer"
    ADD CONSTRAINT "QuizAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES public."QuizAttempt"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuizAnswer QuizAnswer_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizAnswer"
    ADD CONSTRAINT "QuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."QuizQuestion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuizAnswer QuizAnswer_selectedOptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizAnswer"
    ADD CONSTRAINT "QuizAnswer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES public."QuizOption"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuizAttempt QuizAttempt_quizId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizAttempt"
    ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES public."Quiz"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuizAttempt QuizAttempt_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizAttempt"
    ADD CONSTRAINT "QuizAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuizOption QuizOption_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizOption"
    ADD CONSTRAINT "QuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."QuizQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuizQuestion QuizQuestion_quizId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizQuestion"
    ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES public."Quiz"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Quiz Quiz_chapterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Quiz"
    ADD CONSTRAINT "Quiz_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES public."Chapter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StudentProgress StudentProgress_chapterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentProgress"
    ADD CONSTRAINT "StudentProgress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES public."Chapter"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentProgress StudentProgress_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentProgress"
    ADD CONSTRAINT "StudentProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentProgress StudentProgress_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentProgress"
    ADD CONSTRAINT "StudentProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SupportReply SupportReply_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupportReply"
    ADD CONSTRAINT "SupportReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SupportReply SupportReply_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupportReply"
    ADD CONSTRAINT "SupportReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."ContactSupport"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict p2nqJYo31Ippm2opdrPygZD7VrfrWqiT2nmmcbd5iXGfDnW5abW0qQVtAa7vAGj

