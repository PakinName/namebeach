'use client';

export default function QuizzesPage() {
  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">📝 Quizzes</h1>
        <p className="page-subtitle">Access quizzes through your enrolled courses</p>
      </div>
      <div className="alert alert-info mb-6">
        💡 Quizzes are available at the end of each chapter. Go to your enrolled courses to take quizzes and track your mastery progress.
      </div>
      <div className="flex-center">
        <a href="/courses" className="btn btn-primary btn-lg">📚 Go to Courses</a>
      </div>
    </div>
  );
}
