import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <header style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a12 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute', top: '10%', left: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '15%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '9999px', padding: '0.5rem 1.25rem', marginBottom: '2rem',
            color: '#a5b4fc', fontSize: '0.875rem',
          }}>
            🚀 AI-Powered Learning Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #f1f5f9, #e0e7ff, #a5b4fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Master Skills with<br />AI-Guided Learning
          </h1>

          <p style={{
            fontSize: '1.25rem', color: '#94a3b8',
            maxWidth: 600, margin: '0 auto 2.5rem',
            lineHeight: 1.6,
          }}>
            Experience mastery-based progression, intelligent quizzes, interactive classrooms,
            and AI-powered content — all in one beautiful platform.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 600,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff', borderRadius: '0.75rem', textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              transition: 'all 0.25s ease',
            }}>
              🎓 Get Started Free
            </Link>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 500,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#e2e8f0', borderRadius: '0.75rem', textDecoration: 'none',
              transition: 'all 0.25s ease',
            }}>
              Sign In →
            </Link>
          </div>

          {/* Feature pills */}
          <div style={{
            display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
            marginTop: '4rem',
          }}>
            {[
              { icon: '🤖', label: 'AI Chat & Summary' },
              { icon: '📊', label: 'Mastery Progression' },
              { icon: '🏫', label: 'Classrooms' },
              { icon: '📝', label: 'Smart Quizzes' },
              { icon: '🌙', label: 'Dark Mode' },
            ].map((f) => (
              <div key={f.label} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '9999px', padding: '0.5rem 1rem',
                color: '#94a3b8', fontSize: '0.875rem',
              }}>
                {f.icon} {f.label}
              </div>
            ))}
          </div>
        </div>
      </header>
    </div>
  );
}
