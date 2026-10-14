'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/login.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' as 'STUDENT' | 'TEACHER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Auto sign in after registration
      const signInResult = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError(signInResult.error);
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
            Join thousands of learners using AI-powered education to master new
            skills faster than ever before.
          </p>
          <ul className={styles.brandFeatures}>
            <li className={styles.brandFeature}>
              <span className={styles.featureIcon}>✨</span>
              Personalized Learning Paths
            </li>
            <li className={styles.brandFeature}>
              <span className={styles.featureIcon}>🏆</span>
              Mastery-Based Progression
            </li>
            <li className={styles.brandFeature}>
              <span className={styles.featureIcon}>🤝</span>
              Collaborative Classrooms
            </li>
            <li className={styles.brandFeature}>
              <span className={styles.featureIcon}>📱</span>
              Learn Anytime, Anywhere
            </li>
          </ul>
        </div>
      </div>

      {/* Form Panel */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Create your account</h2>
          <p className={styles.formSubtitle}>
            Start your learning journey today
          </p>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Role Selector */}
            <label className={styles.formLabel}>I am a</label>
            <div className={styles.roleSelector}>
              <div
                className={`${styles.roleCard} ${form.role === 'STUDENT' ? styles.selected : ''}`}
                onClick={() => updateField('role', 'STUDENT')}
              >
                <div className={styles.roleIcon}>🎒</div>
                <div className={styles.roleName}>Student</div>
                <div className={styles.roleDesc}>Learn & take quizzes</div>
              </div>
              <div
                className={`${styles.roleCard} ${form.role === 'TEACHER' ? styles.selected : ''}`}
                onClick={() => updateField('role', 'TEACHER')}
              >
                <div className={styles.roleIcon}>👨‍🏫</div>
                <div className={styles.roleName}>Teacher</div>
                <div className={styles.roleDesc}>Create & manage courses</div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="name">
                Full Name
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>👤</span>
                <input
                  id="name"
                  type="text"
                  className={styles.formInput}
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                  minLength={2}
                />
              </div>
            </div>

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
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
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
                  type="password"
                  className={styles.formInput}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  id="confirmPassword"
                  type="password"
                  className={styles.formInput}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    updateField('confirmPassword', e.target.value)
                  }
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className={`${styles.submitBtn} ${loading ? styles.btnLoading : ''}`}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className={styles.divider}>or</div>

          <p className={styles.authLink}>
            Already have an account?
            <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
