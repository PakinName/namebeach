'use client';

import { useState, useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { NotificationData } from '@/types';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  onMenuToggle: () => void;
}

export default function Header({ user, onMenuToggle }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          if (data.success) setNotifications(data.data);
        }
      } catch {
        // silently fail
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <header className="header">
      <div className="header-left">
        <button className="mobile-toggle" onClick={onMenuToggle}>
          ☰
        </button>
        <div className="header-search hide-mobile">
          <span className="header-search-icon">🔍</span>
          <input type="text" placeholder="Search courses, lessons..." />
        </div>
      </div>

      <div className="header-actions">
        {/* Dark Mode Toggle */}
        <button className="header-btn" onClick={toggleDarkMode} title="Toggle theme">
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="header-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <span>Notifications</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={async () => {
                    await fetch('/api/notifications/read-all', { method: 'POST' });
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, read: true }))
                    );
                  }}
                >
                  Mark all read
                </button>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={`notification-item ${!n.read ? 'unread' : ''}`}
                  >
                    <div className="notification-icon stat-icon-primary">
                      {n.type === 'QUIZ_PASSED' ? '✅' :
                       n.type === 'QUIZ_FAILED' ? '❌' :
                       n.type === 'CHAPTER_UNLOCKED' ? '🔓' :
                       n.type === 'NEW_LESSON' ? '📖' :
                       n.type === 'ANNOUNCEMENT' ? '📢' : '🔔'}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{n.title}</div>
                      <div className="notification-text">{n.message}</div>
                      <div className="notification-time">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            className="header-btn"
            onClick={() => setShowProfile(!showProfile)}
            style={{ borderRadius: 'var(--radius-full)', padding: 0, width: 36, height: 36 }}
          >
            <div className="avatar avatar-sm">
              {initials}
            </div>
          </button>

          {showProfile && (
            <div className="dropdown-menu" style={{ minWidth: 220 }}>
              <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{user?.name}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{user?.email}</div>
                <span className="badge badge-primary" style={{ marginTop: 4 }}>{user?.role}</span>
              </div>
              <button className="dropdown-item" onClick={() => window.location.href = '/profile'}>
                👤 Profile
              </button>
              <button className="dropdown-item" onClick={() => window.location.href = '/support'}>
                🆘 Support
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => signOut({ callbackUrl: '/login' })} style={{ color: 'var(--error-500)' }}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
