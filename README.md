# 🎓 AI Learning Management System (AI LMS)

A full-featured, AI-powered Learning Management System built with **Next.js 16**, **Prisma 5**, **PostgreSQL**, and **NextAuth.js** — featuring mastery-based chapter progression, intelligent quizzes, Google Classroom-style management, and AI assistance.

---

## ✨ Features

- 🔒 **Mastery-Based Chapter Progression** — Students must score ≥50% on each chapter quiz to unlock the next
- 📚 **Course Management** — Multi-chapter courses with lessons, videos, PDFs, code examples
- 📝 **Quiz System** — Multiple choice & True/False with instant grading and detailed explanations
- 🏫 **Classrooms** — Google Classroom-style with invite codes, announcements, files, members
- 🤖 **AI Features** — Chat assistant, quiz generation (Gemini & OpenAI)
- 📊 **Progress Tracking** — Per-course progress bars, chapter status (🔒/▶️/✅)
- 🔔 **Notifications** — In-app notification center for quiz results, chapter unlocks
- 🌙 **Dark Mode** — Toggle-able dark/light theme
- 👤 **Roles** — Student, Teacher, Admin

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|------------|---------|
| Node.js | ≥ 18.0 |
| PostgreSQL | ≥ 14 |
| npm | ≥ 9 |

---

### Step 1: Configure Environment Variables

Copy and edit `.env.local`:

```bash
# Database (required)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_lms"

# NextAuth (required)
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"

# AI (optional — app works without these in demo mode)
GEMINI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"
```

> **Windows users:** Replace `YOUR_PASSWORD` with your PostgreSQL password.

---

### Step 2: Create the Database

Open PostgreSQL (psql or pgAdmin) and run:

```sql
CREATE DATABASE ai_lms;
```

---

### Step 3: Install Dependencies

```bash
npm install
```

---

### Step 4: Push Database Schema

```bash
npm run db:push
```

This creates all 18 database tables.

---

### Step 5: Seed Demo Data

```bash
npm run db:seed
```

This creates:
- **5 demo accounts** (admin, teacher, 3 students)
- **3 courses** (Intro to Programming, Web Dev, Data Science)
- **75 lessons** (5 chapters × 5 lessons per course)
- **150 quiz questions** (10 per chapter)
- **2 classrooms** with announcements

---

### Step 6: Start Development Server

```bash
npm run dev
```

Open **http://localhost:3000** 🎉

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ailms.com | password123 |
| Teacher | teacher@ailms.com | password123 |
| Student | student@ailms.com | password123 |
| Student | jane@ailms.com | password123 |
| Student | bob@ailms.com | password123 |

---

## 📁 Project Structure

```
ai-lms/
├── prisma/
│   ├── schema.prisma        # 18 database models
│   └── seed.ts              # Demo data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login & Register pages
│   │   ├── (dashboard)/     # All protected pages
│   │   │   ├── dashboard/   # Student/Teacher dashboard
│   │   │   ├── courses/     # Course listing & detail
│   │   │   ├── classrooms/  # Classroom management
│   │   │   ├── lessons/     # Lesson viewer
│   │   │   ├── quizzes/     # Quiz taking & results
│   │   │   ├── progress/    # Progress tracking
│   │   │   ├── announcements/
│   │   │   ├── files/
│   │   │   ├── support/
│   │   │   └── profile/
│   │   ├── api/             # Backend API routes
│   │   │   ├── auth/        # NextAuth endpoints
│   │   │   ├── courses/     # Course CRUD
│   │   │   ├── lessons/     # Lesson + completion
│   │   │   ├── quizzes/     # Quiz + submission
│   │   │   ├── classrooms/  # Classroom + announcements
│   │   │   ├── dashboard/   # Dashboard stats
│   │   │   ├── notifications/
│   │   │   └── ai/          # AI chat + quiz gen
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Landing page
│   │   └── globals.css      # 1800+ line design system
│   ├── components/
│   │   ├── layout/          # Sidebar, Header
│   │   └── providers/       # SessionProvider
│   ├── lib/
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── auth.ts          # NextAuth configuration
│   │   └── progression.ts   # Chapter unlock engine
│   └── types/               # TypeScript interfaces
```

---

## 🎮 Using the System

### As a Student:
1. Register → Login → Browse Courses
2. Click a course → Study Chapter 1 lessons
3. Take the Chapter 1 Quiz (need ≥50% to pass)
4. Pass → Chapter 2 unlocks automatically 🔓
5. Fail → Retry unlimited times
6. Join classrooms with invite code

### As a Teacher:
1. Login → Create a Course
2. Add chapters and lessons to your course
3. Use AI to generate quiz questions
4. Create a classroom → Share the invite code
5. Post announcements to your classroom
6. Monitor student quiz scores

---

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (http://localhost:3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio (DB browser) |

---

## 🤖 AI Configuration

The app works in **demo mode** without API keys (shows sample responses).

For real AI, add to `.env.local`:

```bash
# Google Gemini (recommended - free tier available)
GEMINI_API_KEY="AIza..."

# OpenAI (alternative)
OPENAI_API_KEY="sk-..."
```

Get a Gemini API key for free at: https://aistudio.google.com

---

## 📊 Database Schema Overview

| Model | Purpose |
|-------|---------|
| User | Students, Teachers, Admins |
| Course | Learning courses |
| Chapter | Course sections |
| Lesson | Individual lessons (video, PDF, code) |
| StudentProgress | Chapter unlock/completion tracking |
| Quiz | Chapter quiz |
| QuizQuestion | Questions (MC/TF) |
| QuizOption | Answer choices |
| QuizAttempt | Student quiz submissions |
| Classroom | Teacher classrooms |
| ClassroomMember | Student-classroom relationships |
| Announcement | Classroom announcements |
| FileUpload | Classroom file storage |
| Notification | In-app notifications |

---

## 🔒 Security Features

- ✅ Server-side chapter access validation (students cannot bypass locks via URL)
- ✅ JWT-based sessions with NextAuth
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (Student/Teacher/Admin)
- ✅ Input validation with Zod
- ✅ CSRF protection via NextAuth

---

## 📞 Support & Contact

Built as a full-stack AI LMS demonstration.

For setup help, check the [Issues](https://github.com) page or contact the administrator.
