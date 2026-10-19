export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CourseWithChapters {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  category: string;
  difficulty: string;
  estimatedTime: number | null;
  published: boolean;
  teacherId: string;
  teacher: { id: string; name: string; avatar: string | null };
  chapters: ChapterWithProgress[];
  _count?: { chapters: number };
  createdAt: string;
}

export interface ChapterWithProgress {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  quiz: { id: string } | null;
  lessons: LessonBasic[];
  progress?: {
    completed: boolean;
    unlocked: boolean;
    highestScore: number;
  } | null;
}

export interface LessonBasic {
  id: string;
  title: string;
  orderIndex: number;
  estimatedTime: number | null;
  completed?: boolean;
}

export interface LessonFull {
  id: string;
  chapterId: string;
  title: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  slideUrl: string | null;
  imageUrls: string[];
  codeExample: string | null;
  estimatedTime: number | null;
  objectives: string[];
  resources: string[];
  orderIndex: number;
  chapter: {
    id: string;
    title: string;
    courseId: string;
    course: { id: string; title: string };
  };
}

export interface QuizWithQuestions {
  id: string;
  chapterId: string;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimit: number | null;
  questions: QuizQuestionWithOptions[];
  chapter: {
    id: string;
    title: string;
    courseId: string;
    course: { id: string; title: string };
  };
}

export interface QuizQuestionWithOptions {
  id: string;
  questionText: string;
  questionType: string;
  explanation: string | null;
  orderIndex: number;
  points: number;
  options: QuizOptionData[];
}

export interface QuizOptionData {
  id: string;
  optionText: string;
  isCorrect?: boolean;
}

export interface QuizAttemptData {
  id: string;
  quizId: string;
  score: number;
  percentage: number;
  passed: boolean;
  startedAt: string;
  completedAt: string | null;
  answers: QuizAnswerData[];
}

export interface QuizAnswerData {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
}

export interface StudentProgressData {
  courseId: string;
  courseTitle: string;
  totalChapters: number;
  completedChapters: number;
  progressPercent: number;
  chapters: {
    chapterId: string;
    chapterTitle: string;
    completed: boolean;
    unlocked: boolean;
    highestScore: number;
  }[];
}

export interface ClassroomData {
  id: string;
  name: string;
  description: string | null;
  code: string;
  thumbnail: string | null;
  teacherId: string;
  teacher: { id: string; name: string; avatar: string | null };
  _count?: { members: number; lessons: number; announcements: number };
  createdAt: string;
}

export interface AnnouncementData {
  id: string;
  classroomId: string;
  title: string;
  content: string;
  pinned: boolean;
  author: { id: string; name: string; avatar: string | null };
  createdAt: string;
}

export interface FileUploadData {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  description: string | null;
  uploader: { id: string; name: string };
  createdAt: string;
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export interface StudentDashboardStats {
  totalCourses: number;
  completedChapters: number;
  lockedChapters: number;
  averageScore: number;
  recentQuizzes: QuizAttemptData[];
  announcements: AnnouncementData[];
  courseProgress: StudentProgressData[];
}

export interface TeacherDashboardStats {
  totalStudents: number;
  totalCourses: number;
  activeClassrooms: number;
  averageQuizScore: number;
  recentActivities: {
    type: string;
    message: string;
    createdAt: string;
  }[];
}
