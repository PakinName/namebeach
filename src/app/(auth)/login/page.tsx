'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/layout/AuthShell';
import Icon from '@/components/ui/Icon';
export default function LoginPage() {
  const { t } = useLanguage();

  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (!result || result.error) setError(result?.error?.includes('awaiting approval')?result.error:'Unable to sign in. Check your email and password, then try again.');
      else { router.push('/dashboard'); router.refresh(); }
    } catch { setError('Could not connect. Please try again.'); }
    finally { setLoading(false); }
  }
  return <AuthShell><p className="eyebrow">{t("GOOD TO SEE YOU AGAIN")}</p><h1>{t("Welcome back.")}</h1><p className="auth-subtitle">{t("Sign in and pick up where you left off.")}</p>{error && <div role="alert" className="alert alert-error">{t(error)}</div>}<form onSubmit={submit}><div className="form-group"><label className="form-label" htmlFor="email">{t("Email address")}</label><input id="email" className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t("you@example.com")} autoComplete="email" required /></div><div className="form-group"><label className="form-label" htmlFor="password">{t("Password")}</label><div className="password-field"><input id="password" className="form-input" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t("Enter your password")} autoComplete="current-password" required /><button type="button" className="icon-button password-toggle" aria-label={showPassword ? t("Hide password") : t("Show password")} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}><Icon name="eye" size={18} /></button></div></div><button type="submit" className="btn btn-primary btn-lg" disabled={loading}>{loading ? t("Signing in...") : t("Sign in")}<Icon name="arrow" size={17} /></button></form><p className="auth-links">{t("New to NovaX?")} <Link href="/register">{t("Create an account")}</Link></p></AuthShell>;
}

