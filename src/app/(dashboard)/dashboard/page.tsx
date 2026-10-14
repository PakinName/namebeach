'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Icon, { type IconName } from '@/components/ui/Icon';
import AdminPage from '../admin/page';
import StudentOverview from '@/components/ui/StudentOverview';
import LearningArt from '@/components/ui/LearningArt';
import EmptyState from '@/components/ui/EmptyState';
import { LoadingCards, ErrorNotice } from '@/components/ui/LoadState';
import { useResource } from '@/hooks/useResource';
interface Dashboard {
  role: string; totalCourses?: number; completedChapters?: number; lockedChapters?: number; averageScore?: number; totalStudents?: number; activeClassrooms?: number; averageQuizScore?: number;
  courseProgress?: { courseId: string; courseTitle: string; category: string; totalChapters: number; completedChapters: number; progressPercent: number }[];
  recentQuizzes?: { id: string; percentage: number; passed: boolean; quiz: { title: string }; startedAt: string }[];
  recentActivities?: { type: string; message: string; createdAt: string }[];
  announcements?: { id: string; title: string; content: string; author: { name: string }; createdAt: string }[];
}
export default function DashboardPage() {
  const { t, language } = useLanguage();

  const { data: session } = useSession();
  const { data, loading, error, reload } = useResource<Dashboard>('/api/dashboard');
  const teacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';
  const stats: { label: string; value: number | string; icon: IconName; tone: string }[] = teacher ? [
    { label: 'Students', value: data?.totalStudents ?? 0, icon: 'users', tone: 'primary' },
    { label: 'Your courses', value: data?.totalCourses ?? 0, icon: 'book', tone: 'success' },
    { label: 'Active classrooms', value: data?.activeClassrooms ?? 0, icon: 'grid', tone: 'warning' },
    { label: 'Recent average score', value: `${data?.averageQuizScore ?? 0}%`, icon: 'chart', tone: 'info' },
  ] : [
    { label: 'Available courses', value: data?.totalCourses ?? 0, icon: 'book', tone: 'primary' },
    { label: 'Chapters completed', value: data?.completedChapters ?? 0, icon: 'check', tone: 'success' },
    { label: 'Chapters to unlock', value: data?.lockedChapters ?? 0, icon: 'lock', tone: 'warning' },
    { label: 'Recent average score', value: `${data?.averageScore ?? 0}%`, icon: 'chart', tone: 'info' },
  ];
  const nextCourse = data?.courseProgress?.find(course => course.progressPercent < 100);
  if (session?.user.role === 'ADMIN') return <AdminPage />;
  if (session?.user.role === 'STUDENT') return <StudentOverview />;
  return <div className="animate-fadeIn"><PageHeader title={t("Welcome back{0}.", [session?.user?.name ? ', ' + session.user.name.split(' ')[0] : ''])} description={teacher ? t("A clear view of your classroom and the people you inspire.") : t("Here is your learning journey, one step at a time.")} eyebrow={teacher ? t("TEACHING OVERVIEW") : t("YOUR LEARNING OVERVIEW")} action={<Link className="btn btn-secondary" href={teacher ? '/course-builder' : '/courses'}><Icon name={teacher ? 'users' : 'book'} size={16} />{teacher ? t("Create a course with AI") : t("Explore courses")}</Link>} /><section className="welcome-banner"><div><p className="eyebrow">{teacher ? t("ROOM FOR DISCOVERY") : t("KEEP YOUR CURIOSITY GOING")}</p><h2>{teacher ? t("Great learning starts with you.") : t("A little progress today. A new possibility tomorrow.")}</h2><p>{teacher ? t("Bring your students together and help their next chapter take shape.") : t("Pick up a lesson, explore an idea, and build something you are proud of.")}</p><Link href={teacher ? '/course-builder' : nextCourse ? `/courses/${nextCourse.courseId}` : '/courses'} className="btn btn-primary">{teacher ? t("Create a course with AI") : nextCourse ? t("Continue learning") : t("Discover courses")}<Icon name="arrow" size={16} /></Link></div><LearningArt /></section>{loading ? <LoadingCards count={4} /> : error ? <ErrorNotice message={error} onRetry={reload} /> : <><div className="grid-4 mb-8">{stats.map(stat => <div className="stat-card" key={stat.label}><div className="stat-card-header"><span className={`stat-card-icon stat-icon-${stat.tone}`}><Icon name={stat.icon} /></span><span className="stat-hint">{t("Overview")}</span></div><div className="stat-card-value">{stat.value}</div><div className="stat-card-label">{t(stat.label)}</div></div>)}</div><div className="dashboard-columns"><section><div className="section-heading"><h2>{teacher ? t("Classroom activity") : t("Your learning path")}</h2><Link href={teacher ? '/course-builder' : '/courses'}>{t("View all")} <Icon name="arrow" size={15} /></Link></div><div className="card"><div className="card-body">{teacher ? data?.recentActivities?.length ? data.recentActivities.map((activity,i) => <div className="activity-row" key={i}><span className="stat-card-icon"><Icon name="quiz" size={17} /></span><div><p>{activity.message}</p><small>{new Date(activity.createdAt).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-GB')}</small></div></div>) : <EmptyState icon="users" title={t("A fresh start for your classroom")} description={t("Student quiz activity will appear here as your class gets going.")} /> : data?.courseProgress?.length ? data.courseProgress.slice(0,4).map(course => <Link className="course-row" href={`/courses/${course.courseId}`} key={course.courseId}><span className="course-row-icon"><Icon name="book" /></span><div className="course-row-content"><h4>{course.courseTitle}</h4><div className="progress-label"><span>{course.completedChapters} {t("of")} {course.totalChapters} {t("chapters")}</span><span>{course.progressPercent}%</span></div><div className="progress-container progress-sm"><div className="progress-bar" style={{ width: `${course.progressPercent}%` }} /></div></div><Icon name="chevron" size={16} /></Link>) : <EmptyState title={t("Your journey starts here")} description={t("Explore the course library and find something you want to learn.")}><Link href="/courses" className="btn btn-primary">{t("Find a course")}</Link></EmptyState>}</div></div></section><section><div className="section-heading"><h2>{teacher ? t("Teaching essentials") : t("Recent practice")}</h2><Icon name={teacher ? 'spark' : 'quiz'} size={18} /></div><div className="card"><div className="card-body">{teacher ? <><Link className="course-row" href="/courses"><span className="course-row-icon"><Icon name="book" /></span><div className="course-row-content"><h4>{t("Course library")}</h4><p className="text-xs text-muted">{t("Explore published learning material")}</p></div><Icon name="chevron" size={15} /></Link><Link className="course-row" href="/course-builder"><span className="course-row-icon"><Icon name="users" /></span><div className="course-row-content"><h4>{t("Create a course with AI")}</h4><p className="text-xs text-muted">{t("Turn your syllabus into a structured learning experience.")}</p></div><Icon name="chevron" size={15} /></Link></> : data?.recentQuizzes?.length ? data.recentQuizzes.map(quiz => <div className="activity-row" key={quiz.id}><span className={`stat-card-icon ${quiz.passed ? 'stat-icon-success' : 'stat-icon-warning'}`}><Icon name={quiz.passed ? 'check' : 'quiz'} size={17} /></span><div style={{ flex: 1 }}><p>{quiz.quiz.title}</p><small>{new Date(quiz.startedAt).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-GB')}</small></div><span className={`badge ${quiz.passed ? 'badge-success' : 'badge-warning'}`}>{Math.round(quiz.percentage)}%</span></div>) : <EmptyState icon="quiz" title={t("Practice makes progress")} description={t("Your recent quiz results will appear here after your first attempt.")} />}</div></div><div className="card mt-6"><div className="card-body"><span className="badge badge-primary">{t("A note for your journey")}</span><h3 className="mt-4 mb-2">{t("Understanding takes practice.")}</h3><p className="text-xs text-muted">{t("Take your time with each lesson. You can revisit material and retry quizzes as you build confidence.")}</p><Link href="/support" className="course-link">{t("Need a hand?")} <Icon name="arrow" size={15} /></Link></div></div></section></div></>}</div>;
}

