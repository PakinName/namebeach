'use client';

import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session } = useSession();

  const initials = session?.user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">👤 Profile</h1>
      </div>

      <div className="card mb-6">
        <div className="card-body text-center" style={{ padding: 'var(--space-10)' }}>
          <div className="avatar avatar-xl" style={{ margin: '0 auto var(--space-4)' }}>{initials}</div>
          <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-1)' }}>{session?.user?.name}</h2>
          <p className="text-muted mb-2">{session?.user?.email}</p>
          <span className="badge badge-primary">{session?.user?.role}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-4)' }}>Account Settings</h3>
          <div className="flex-col gap-3">
            <button className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>📧 Change Email</button>
            <button className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>🔒 Change Password</button>
            <button className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>🔔 Notification Preferences</button>
            <div style={{ borderTop: '1px solid var(--border-light)', margin: 'var(--space-3) 0' }} />
            <button className="btn btn-danger w-full" onClick={() => signOut({ callbackUrl: '/login' })}>
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
