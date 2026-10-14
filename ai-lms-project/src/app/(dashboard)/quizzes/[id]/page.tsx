'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  passingScore: number;
  chapter: { id: string; title: string; courseId: string; course: { id: string; title: string } };
  questions: Array<{
    id: string;
    questionText: string;
    questionType: string;
    orderIndex: number;
    points: number;
    options: Array<{ id: string; optionText: string }>;
  }>;
  attempts: Array<{ id: string; percentage: number; passed: boolean; startedAt: string }>;
}

interface QuizResult {
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  message: string;
  nextChapterUnlocked: boolean;
  questions: Array<{
    id: string;
    questionText: string;
    explanation: string | null;
    options: Array<{ id: string; optionText: string; isCorrect: boolean }>;
    selectedOptionId: string | null;
    isCorrect: boolean;
  }>;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`/api/quizzes/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setQuiz(data.data);
        } else {
          setError(data.error || 'Failed to load quiz');
        }
      } catch {
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [params.id]);

  const handleSubmit = async () => {
    if (!quiz) return;

    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} unanswered.`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/quizzes/${params.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
            questionId,
            selectedOptionId,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to submit quiz');
      }
    } catch {
      setError('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
    setError('');
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: 400 }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <div className="empty-state-title">{error}</div>
        <div className="empty-state-description">Complete the previous chapter to unlock this quiz.</div>
        <Link href="/courses" className="btn btn-primary mt-4">Back to Courses</Link>
      </div>
    );
  }

  if (!quiz) return null;

  // Show Results
  if (result) {
    return (
      <div className="animate-fadeIn" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="card quiz-result-card mb-6">
          <div className="card-body" style={{ padding: 'var(--space-10)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>
              {result.passed ? '🎉' : '😔'}
            </div>
            <div className="quiz-score mb-2">
              {result.percentage.toFixed(0)}%
            </div>
            <div style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
              {result.score}/{result.totalPoints} points
            </div>
            <div className={`alert ${result.passed ? 'alert-success' : 'alert-warning'} mt-4`}
                 style={{ textAlign: 'left', display: 'inline-flex', maxWidth: 500 }}>
              {result.message}
            </div>

            {result.nextChapterUnlocked && (
              <div className="alert alert-info mt-4" style={{ textAlign: 'left', display: 'inline-flex', maxWidth: 500 }}>
                🔓 Next chapter has been unlocked!
              </div>
            )}

            <div className="flex-center gap-3 mt-6">
              {!result.passed && (
                <button onClick={handleRetry} className="btn btn-primary btn-lg">
                  🔄 Retry Quiz
                </button>
              )}
              <Link
                href={`/courses/${quiz.chapter.courseId}`}
                className="btn btn-secondary btn-lg"
              >
                📚 Back to Course
              </Link>
            </div>
          </div>
        </div>

        {/* Detailed Answers */}
        <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-4)' }}>
          📋 Answer Review
        </h3>
        <div className="flex-col gap-4">
          {result.questions.map((q, i) => (
            <div key={q.id} className="card">
              <div className="card-body">
                <div className="flex gap-3 mb-3">
                  <span className={`badge ${q.isCorrect ? 'badge-success' : 'badge-danger'}`}>
                    {q.isCorrect ? '✅ Correct' : '❌ Wrong'}
                  </span>
                  <span className="text-sm text-muted">Question {i + 1}</span>
                </div>
                <p style={{ fontWeight: 500, marginBottom: 'var(--space-3)' }}>
                  {q.questionText}
                </p>
                <div className="flex-col gap-2">
                  {q.options.map((opt) => {
                    let className = 'quiz-option';
                    if (opt.isCorrect) className += ' quiz-option-correct';
                    else if (opt.id === q.selectedOptionId && !q.isCorrect) className += ' quiz-option-wrong';
                    return (
                      <div key={opt.id} className={className} style={{ cursor: 'default' }}>
                        <span>{opt.optionText}</span>
                        {opt.isCorrect && <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Correct Answer</span>}
                        {opt.id === q.selectedOptionId && !opt.isCorrect && (
                          <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>Your Answer</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div className="alert alert-info mt-3">
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Quiz Taking View
  return (
    <div className="animate-fadeIn" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Quiz Header */}
      <nav className="breadcrumb">
        <span className="breadcrumb-item">
          <Link href={`/courses/${quiz.chapter.courseId}`}>{quiz.chapter.course.title}</Link>
        </span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item">{quiz.chapter.title}</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">Quiz</span>
      </nav>

      <div className="card mb-6">
        <div className="card-body">
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            📝 {quiz.title}
          </h1>
          {quiz.description && (
            <p className="text-muted mb-3">{quiz.description}</p>
          )}
          <div className="flex gap-3">
            <span className="badge badge-primary">
              {quiz.questions.length} Questions
            </span>
            <span className="badge badge-warning">
              Pass: {quiz.passingScore}%
            </span>
            <span className="badge badge-info">
              Unlimited Retries
            </span>
          </div>

          {quiz.attempts.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-muted mb-2">Previous Attempts:</div>
              <div className="flex gap-2 flex-wrap">
                {quiz.attempts.map((a) => (
                  <span key={a.id} className={`badge ${a.passed ? 'badge-success' : 'badge-danger'}`}>
                    {a.percentage.toFixed(0)}% — {new Date(a.startedAt).toLocaleDateString()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* Questions */}
      <div className="flex-col gap-6">
        {quiz.questions.map((q, i) => (
          <div key={q.id} className="card">
            <div className="card-body">
              <div className="flex-between mb-3">
                <span className="badge badge-primary">Question {i + 1}</span>
                <span className="text-xs text-muted">
                  {q.questionType === 'TRUE_FALSE' ? 'True/False' : 'Multiple Choice'}
                </span>
              </div>
              <p style={{ fontWeight: 500, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
                {q.questionText}
              </p>
              <div className="flex-col gap-3">
                {q.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`quiz-option ${answers[q.id] === opt.id ? 'selected' : ''}`}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                  >
                    <div className="quiz-option-radio" />
                    <span>{opt.optionText}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="flex-center mt-8 mb-8">
        <button
          onClick={handleSubmit}
          className={`btn btn-primary btn-lg ${submitting ? 'btn-loading' : ''}`}
          disabled={submitting}
          style={{ minWidth: 200 }}
        >
          {submitting ? 'Submitting...' : '📤 Submit Quiz'}
        </button>
      </div>
    </div>
  );
}
