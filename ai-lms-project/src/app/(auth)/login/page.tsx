'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      {/* Brand Panel */}
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <div className={styles.brandLogoIcon}>🎓</div>
          <h1 className={styles.brandLogo}>AI LMS</h1>
          <p className={styles.brandTagline}>
            AI-powered Learning Management System with mastery-based progression
            and intelligent content delivery.
          </p>
          <ul className={styles.brandFeatures}>
            <li className={styles.brandFeature}>
              <span className={styles.featureIcon}>🤖</span>
              AI-Powered Quiz Generation & Summaries
            </li>
            <li className={styles.brandFeature}>
              <span className={styles.featureIcon}>📊</span>
              Mastery-Based Chapter Progression
            </li>
            <li className={styles.brandFeature}>
              <span className={styles.featureIcon}>🏫</span>
              Google Classroom-Style Management
            </li>
            <li className={styles.brandFeature}>
              <span className={styles.featureIcon}>📈</span>
              Real-Time Progress Tracking
            </li>
            <li className={styles.brandFeature}>
              <span className={styles.featureIcon}>🎯</span>
              Interactive Quizzes with Explanations
            </li>
          </ul>
        </div>
      </div>

      {/* Form Panel */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Welcome back</h2>
          <p className={styles.formSubtitle}>
            Sign in to your account to continue learning
          </p>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="email">
                Email Address
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>📧</span>
                <input
                  id="email"
                  type="email"
                  className={styles.formInput}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="password">
                Password
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.formInput}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`${styles.submitBtn} ${loading ? styles.btnLoading : ''}`}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className={styles.divider}>or</div>

          <p className={styles.authLink}>
            Don&apos;t have an account?
            <Link href="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
