'use client';

export default function FilesPage() {
  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">📁 Files</h1>
        <p className="page-subtitle">View and download files from your classrooms</p>
      </div>
      <div className="empty-state">
        <div className="empty-state-icon">📁</div>
        <div className="empty-state-title">Files from classrooms</div>
        <div className="empty-state-description">Files uploaded to your classrooms will appear here. Visit your classrooms to see and download files.</div>
      </div>
    </div>
  );
}
