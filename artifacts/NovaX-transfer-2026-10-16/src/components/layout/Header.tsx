'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import type { NotificationData } from '@/types';
import Icon from '@/components/ui/Icon';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
const labels: Record<string, string> = { admin:'Administration', 'quiz-builder':'Quiz builder', certificates:'Certificates', 'course-builder': 'Create a course with AI', dashboard: 'Overview', courses: 'Course library', quizzes: 'Quizzes', progress: 'My progress', announcements: 'Announcements', files: 'Resources', support: 'Help & support', profile: 'My profile', assistant: 'Learning assistant', lessons: 'Learning room' };
export default function Header({ user, onMenuToggle, menuOpen }: { user?: { name: string; email: string; role: string; avatar?: string }; onMenuToggle: () => void; menuOpen: boolean }) {
  const { t } = useLanguage();

  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [panel, setPanel] = useState<'notifications' | 'profile' | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [error, setError] = useState('');
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try { const next = localStorage.getItem('theme') === 'dark'; document.documentElement.dataset.theme = next ? 'dark' : 'light'; queueMicrotask(() => setDark(next)); } catch {}
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => fetch('/api/notifications', { signal: controller.signal }).then(response => response.json()).then(result => { if (result.success) { setNotifications(result.data); setError(''); } else setError('Notifications are unavailable.'); }).catch(() => { if (!controller.signal.aborted) setError('Notifications are unavailable.'); });
    void refresh(); const timer = setInterval(() => void refresh(), 30000);
    return () => { clearInterval(timer); controller.abort(); };
  }, []);
  useEffect(() => {
    const dismiss = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setPanel(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setPanel(null); };
    document.addEventListener('mousedown', dismiss); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', dismiss); document.removeEventListener('keydown', escape); };
  }, []);
  const toggleTheme = () => {
    const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
  };
  const unread = notifications.filter(item => !item.read).length;
  return <header className="header"><div className="header-left"><button className="icon-button mobile-toggle" onClick={onMenuToggle} aria-label={t("Open navigation")} aria-expanded={menuOpen} aria-controls="app-sidebar"><Icon name="menu" /></button><span className="header-context">{t("Workspace")} <Icon name="chevron" size={14} /><strong>{t(labels[pathname.split('/')[1]] || 'Overview')}</strong></span></div>
    <div className="header-actions" ref={root}>
      <LanguageSwitcher />
      <Link href="/assistant" className="icon-button" aria-label={t("Learning assistant")} title={t("Learning assistant")}><Icon name="spark" /></Link>
      <form action="/courses" className="header-search" role="search"><Icon name="search" size={18} /><input name="q" aria-label={t("Search courses")} placeholder={t("Search courses...")} /><kbd>↵</kbd></form>
      <button className="icon-button" onClick={toggleTheme} aria-label={dark ? t("Switch to light theme") : t("Switch to dark theme")} title={t("Change theme")}><Icon name={dark ? 'sun' : 'moon'} /></button>
      <div className="dropdown"><button className="icon-button" aria-label={t("Notifications, {0} unread", [unread])} aria-expanded={panel === 'notifications'} onClick={() => setPanel(panel === 'notifications' ? null : 'notifications')}><Icon name="bell" />{unread > 0 && <span className="notification-badge">{unread}</span>}</button>
        {panel === 'notifications' && <div className="notification-dropdown"><div className="notification-header"><strong>{t("Notifications")}</strong><button className="btn btn-ghost btn-sm" disabled={!unread} onClick={async () => { try { const res = await fetch('/api/notifications/read-all', { method: 'POST' }); if (!res.ok) throw new Error(); setNotifications(previous => previous.map(item => ({ ...item, read: true }))); } catch { setError('Could not update notifications. Try again.'); } }}>{t("Mark all read")}</button></div>{error && <p className="p-4 text-sm" role="alert">{t(error)}</p>}{notifications.length === 0 && !error && <p className="p-6 text-muted">{t("You are all caught up.")}</p>}{notifications.slice(0, 8).map(item => <Link href={item.link?.startsWith('/') && !item.link.startsWith('//') && !/^\/classrooms(?:[/?#]|$)/.test(item.link) ? item.link : '/announcements'} key={item.id} className={`notification-item ${item.read ? '' : 'unread'}`} onClick={() => setPanel(null)}><span className="notification-icon"><Icon name="bell" size={18} /></span><div><div className="notification-title">{item.title}</div><div className="notification-text">{item.message}</div></div></Link>)}</div>}
      </div>
      <div className="dropdown"><button className="profile-trigger" aria-label={t("Account menu")} aria-expanded={panel === 'profile'} onClick={() => setPanel(panel === 'profile' ? null : 'profile')}><span className="avatar avatar-sm">{user?.name?.slice(0, 2).toUpperCase() || t("U")}</span><span className="profile-trigger-name">{user?.name?.split(' ')[0] || t("Account")}</span></button>{panel === 'profile' && <div className="dropdown-menu"><div className="profile-menu-info"><strong>{user?.name}</strong><span>{user?.email}</span></div><Link className="dropdown-item" href="/profile" onClick={() => setPanel(null)}><Icon name="user" size={17} />{t("My profile")}</Link><Link className="dropdown-item" href="/support" onClick={() => setPanel(null)}><Icon name="help" size={17} />{t("Help & support")}</Link><div className="dropdown-divider" /><button className="dropdown-item" onClick={() => signOut({ callbackUrl: '/login' })}><Icon name="logout" size={17} />{t("Sign out")}</button></div>}</div>
    </div>
  </header>;
}

