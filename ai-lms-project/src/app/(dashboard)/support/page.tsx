'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would POST to /api/support
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setSubject('');
    setMessage('');
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">🆘 Support</h1>
          <p className="page-subtitle">Need help? We&apos;re here for you</p>
        </div>
      </div>

      <div className="grid-2 mb-8">
        <div className="card card-hover">
          <div className="card-body text-center" style={{ padding: 'var(--space-8)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>👨‍💼</div>
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Contact Admin</h3>
            <p className="text-sm text-muted mb-4">For account & technical issues</p>
            <a href="mailto:admin@ailms.com" className="btn btn-primary">📧 Email Admin</a>
          </div>
        </div>
        <div className="card card-hover">
          <div className="card-body text-center" style={{ padding: 'var(--space-8)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>👨‍🏫</div>
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Contact Teacher</h3>
            <p className="text-sm text-muted mb-4">For course-related questions</p>
            <Link href="/classrooms" className="btn btn-secondary">🏫 Go to Classroom</Link>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="card mb-8">
        <div className="card-header"><h3 style={{ fontWeight: 600 }}>📞 Contact Information</h3></div>
        <div className="card-body">
          <div className="flex-col gap-4">
            <div className="flex gap-3 items-center"><span>📧</span><div><div className="text-sm font-medium">Email</div><div className="text-muted">support@ailms.com</div></div></div>
            <div className="flex gap-3 items-center"><span>📞</span><div><div className="text-sm font-medium">Phone</div><div className="text-muted">+66 2-123-4567</div></div></div>
            <div className="flex gap-3 items-center"><span>🕐</span><div><div className="text-sm font-medium">Office Hours</div><div className="text-muted">Mon-Fri, 9:00 AM - 5:00 PM (ICT)</div></div></div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="card">
        <div className="card-header"><h3 style={{ fontWeight: 600 }}>📝 Send a Message</h3></div>
        <div className="card-body">
          {submitted && <div className="alert alert-success mb-4">✅ Message sent! We&apos;ll get back to you soon.</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className="form-input" value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="What do you need help with?" />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="form-textarea" value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="Describe your issue..." />
            </div>
            <button type="submit" className="btn btn-primary">📤 Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
}
