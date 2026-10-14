'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role?: string;
}

const studentNav = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/courses', icon: '📚', label: 'Courses' },
  { href: '/classrooms', icon: '🏫', label: 'Classrooms' },
  { href: '/quizzes', icon: '📝', label: 'Quizzes' },
  { href: '/progress', icon: '📊', label: 'Progress' },
  { href: '/announcements', icon: '📢', label: 'Announcements' },
  { href: '/files', icon: '📁', label: 'Files' },
];

const teacherNav = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/courses', icon: '📚', label: 'Courses' },
  { href: '/classrooms', icon: '🏫', label: 'Classrooms' },
  { href: '/quizzes', icon: '📝', label: 'Quizzes' },
  { href: '/announcements', icon: '📢', label: 'Announcements' },
  { href: '/files', icon: '📁', label: 'Files' },
];

const bottomNav = [
  { href: '/support', icon: '🆘', label: 'Support' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

export default function Sidebar({ isOpen, onClose, role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === 'TEACHER' || role === 'ADMIN' ? teacherNav : studentNav;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">🎓</div>
        <span className="sidebar-brand">AI LMS</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">Main</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div className="sidebar-section">Other</div>
        {bottomNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          AI LMS v1.0
        </div>
      </div>
    </aside>
  );
}
