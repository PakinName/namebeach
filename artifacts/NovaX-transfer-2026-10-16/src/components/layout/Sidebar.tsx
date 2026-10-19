'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Brand from '@/components/ui/Brand';
import Icon, { type IconName } from '@/components/ui/Icon';
const links: { href: string; icon: IconName; label: string }[] = [
  { href: '/admin', icon: 'grid', label: 'Administration' },
  { href: '/dashboard', icon: 'grid', label: 'Overview' },
  { href: '/join', icon: 'users', label: 'Join a course' },
  { href: '/courses', icon: 'book', label: 'Course library' },
  { href: '/courses/new', icon: 'book', label: 'Create a course yourself' },
  { href: '/course-builder', icon: 'spark', label: 'Create a course with AI' },
  { href: '/assistant', icon: 'spark', label: 'Learning assistant' },
  { href: '/quiz-builder', icon: 'quiz', label: 'Quiz builder' },
  { href: '/quizzes', icon: 'quiz', label: 'Quizzes' },
  { href: '/certificates', icon: 'check', label: 'Certificates' },
  { href: '/progress', icon: 'chart', label: 'My progress' },
  { href: '/announcements', icon: 'bell', label: 'Announcements' },
  { href: '/files', icon: 'folder', label: 'Resources' },
];
export default function Sidebar({ isOpen, onClose, role }: { isOpen: boolean; onClose: () => void; role?: string }) {
  const { t } = useLanguage();

  const pathname = usePathname();
  const renderLink = (item: typeof links[number]) => {
    const active = pathname === item.href || (item.href !== '/courses' && pathname.startsWith(item.href + '/'));
    return <Link key={item.href} href={item.href} className={`sidebar-link ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined} onClick={onClose}><Icon name={item.icon} /><span>{t(item.label)}</span>{active && <span className="nav-dot" />}</Link>;
  };
  return <aside id="app-sidebar" className={`sidebar ${isOpen ? 'open' : ''}`}>
    <div className="sidebar-header"><Brand href="/dashboard" /><button className="icon-button sidebar-close" onClick={onClose} aria-label={t("Close navigation")}><Icon name="close" /></button></div>
    <div className="workspace-label"><span className="workspace-avatar">{role === 'STUDENT' ? t("S") : t("L")}</span><div><strong>{t("Learning workspace")}</strong><span>{role === 'ADMIN' ? t("Administrator") : role === 'TEACHER' ? t("Teacher account") : t("Student account")}</span></div></div>
    <nav className="sidebar-nav" aria-label={t("Main navigation")}><div className="sidebar-section">{t("Workspace")}</div>{links.filter(link => (link.href !== '/join' || role === 'STUDENT') && (link.href !== '/admin' || role === 'ADMIN') && (link.href !== '/progress' || role === 'STUDENT') && (!['/course-builder', '/courses/new', '/quiz-builder'].includes(link.href) || role === 'TEACHER' || role === 'ADMIN')).map(renderLink)}<div className="sidebar-section">{t("Account")}</div>{renderLink({ href: '/profile', icon: 'user', label: 'My profile' })}{renderLink({ href: '/support', icon: 'help', label: 'Help & support' })}</nav>
    <div className="sidebar-footer"><div className="sidebar-tip"><Icon name="spark" /><strong>{t("Make room to grow.")}</strong><p>{t("A new skill starts with one small step.")}</p><Link href="/courses" onClick={onClose}>{t("Explore courses")} <Icon name="arrow" size={16} /></Link></div><span className="sidebar-footnote">{t("NovaX · Your next chapter")}</span></div>
  </aside>;
}

