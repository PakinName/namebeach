'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Icon from '@/components/ui/Icon';
export default function ProfilePage() {
  const { t } = useLanguage();

  const { data: session } = useSession();
  const user = session?.user;
  return <div className="animate-fadeIn"><PageHeader title={t("Your corner of the classroom.")} description={t("Your account details and the things that keep your learning connected.")} eyebrow={t("MY PROFILE")} /><div className="account-grid"><section className="card account-summary"><div className="avatar avatar-xl">{user?.name?.split(' ').map(part => part[0]).join('').slice(0,2).toUpperCase() || t("U")}</div><h2>{user?.name || t("Your account")}</h2><p>{user?.email}</p><span className="badge badge-primary">{user?.role === 'ADMIN' ? t("Administrator") : user?.role === 'TEACHER' ? t("Teacher") : t("Student")}</span></section><section className="card"><div className="card-header"><h3>{t("Account details")}</h3><Icon name="user" size={19} /></div><div className="card-body"><div className="settings-row"><div><strong>{t("Full name")}</strong><p>{user?.name || t("Loading...")}</p></div></div><div className="settings-row"><div><strong>{t("Email address")}</strong><p>{user?.email || t("Loading...")}</p></div></div><div className="settings-row"><div><strong>{t("Need to update your account?")}</strong><p>{t("Send a request to support for help with your account details.")}</p></div><Link className="btn btn-secondary btn-sm" href="/support">{t("Contact support")}</Link></div><div className="settings-row"><div><strong>{t("End this session")}</strong><p>{t("You can sign in again whenever you are ready.")}</p></div><button className="btn btn-danger btn-sm" onClick={() => signOut({ callbackUrl: '/login' })}><Icon name="logout" size={16} />{t("Sign out")}</button></div></div></section></div></div>;
}

