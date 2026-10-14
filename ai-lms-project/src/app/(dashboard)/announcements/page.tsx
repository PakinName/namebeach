'use client';

import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data.success) setNotifications(data.data.filter((n: Notification) => n.type === 'ANNOUNCEMENT'));
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">📢 Announcements</h1>
      </div>
      {loading ? (
        <div className="flex-col gap-3">{[1, 2, 3].map((i) => (<div key={i} className="skeleton" style={{ height: 80 }} />))}</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📢</div><div className="empty-state-title">No announcements</div><div className="empty-state-description">Announcements from your classrooms will appear here</div></div>
      ) : (
        <div className="flex-col gap-3">
          {notifications.map((n) => (
            <div key={n.id} className="card">
              <div className="card-body">
                <div className="flex-between mb-2">
                  <h4 style={{ fontWeight: 600 }}>{n.title}</h4>
                  <span className="text-xs text-muted">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-muted">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
