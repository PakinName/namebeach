'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/layout/AuthShell';
import PasswordInput from '@/components/ui/PasswordInput';
import Icon from '@/components/ui/Icon';
export default function RegisterPage() {
  const { t, language } = useLanguage();

  const router = useRouter();
  const [form, setForm] = useState({ name: '', fullName: '', nickname: '', email: '', password: '', confirmPassword: '', role: 'STUDENT' });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const update = (field: string, value: string) => setForm(previous => ({ ...previous, [field]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) { setError('Your passwords do not match.'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, fullName: form.fullName, nickname: form.nickname, email: form.email, password: form.password, role: form.role }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || 'Unable to create your account.'); return; }
      if(result.pendingApproval){setPending(true);return;}
      const login = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (!login || login.error) setError('Your account was created. Please sign in from the login page.');
      else { router.push('/dashboard'); router.refresh(); }
    } catch { setError('Could not connect. Please try again.'); }
    finally { setLoading(false); }
  }
  if(pending)return <AuthShell><h1>{language==='th'?'ส่งคำขอสมัครครูแล้ว':'Teacher application submitted'}</h1><p className="alert alert-info">{language==='th'?'แอดมินต้องอนุมัติก่อนจึงจะเข้าสู่ระบบในฐานะครูได้ กรุณาติดต่อผู้ดูแลเพื่อยืนยันตัวตน':'An administrator must approve your account before you can sign in as a teacher.'}</p><Link className="btn btn-primary" href="/login">{t('Sign in')}</Link></AuthShell>;
  return <AuthShell><p className="eyebrow">{t("A FRESH START")}</p><h1>{t("Make room to grow.")}</h1><p className="auth-subtitle">{t("Create your account and start your next chapter.")}</p>{error && <div className="alert alert-error" role="alert">{t(error)}</div>}<form onSubmit={submit}><span className="form-label" id="role-label">{t("How will you use NovaX?")}</span><div className="role-selector" role="group" aria-labelledby="role-label">{['STUDENT','TEACHER'].map(role => <button key={role} type="button" className="role-card" aria-pressed={form.role === role} onClick={() => update('role', role)}><Icon name={role === 'STUDENT' ? 'book' : 'users'} /><span><strong>{role === 'STUDENT' ? t("Student") : t("Teacher")}</strong><small>{role === 'STUDENT' ? t("Learn and grow") : t("Teach and inspire")}</small></span></button>)}</div>{[{ id: 'fullName', label: language==='th'?'ชื่อจริง–นามสกุล (ใช้บนเกียรติบัตร)':'Full legal name (for certificates)', placeholder: 'Your full name', type: 'text', auto: 'name' },{ id: 'name', label: language==='th'?'ชื่อแสดงในระบบ':'Display name', placeholder: '', type: 'text', auto: 'nickname' },{ id: 'nickname', label: language==='th'?'ชื่อเล่น (ไม่บังคับ)':'Nickname (optional)', placeholder: '', type: 'text', auto: 'off' },{ id: 'email', label: 'Email address', placeholder: 'you@example.com', type: 'email', auto: 'email' },{ id: 'password', label: 'Password', placeholder: 'At least 6 characters', type: 'password', auto: 'new-password' },{ id: 'confirmPassword', label: 'Confirm password', placeholder: 'Enter your password again', type: 'password', auto: 'new-password' }].map(field => <div className="form-group" key={field.id}><label className="form-label" htmlFor={field.id}>{t(field.label)}</label>{field.type==='password'?<PasswordInput id={field.id} value={form[field.id as keyof typeof form]} onChange={e=>update(field.id,e.target.value)} autoComplete="new-password" minLength={8} maxLength={72} placeholder={language==='th'?'อย่างน้อย 8 ตัวอักษร':'At least 8 characters'} required/>:<input id={field.id} className="form-input" type={field.type} autoComplete={field.auto} value={form[field.id as keyof typeof form]} onChange={e=>update(field.id,e.target.value)} required={field.id!=='nickname'} maxLength={field.id==='email'?254:field.id==='nickname'?80:field.id==='name'?100:150}/>}</div>)}<button className="btn btn-primary btn-lg" disabled={loading}>{loading ? t("Creating account...") : t("Create account")}<Icon name="arrow" size={17} /></button></form><p className="auth-links">{t("Already have an account?")} <Link href="/login">{t("Sign in")}</Link></p></AuthShell>;
}

