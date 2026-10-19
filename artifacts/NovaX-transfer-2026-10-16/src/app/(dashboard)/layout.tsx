'use client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import SystemNotice from '@/components/ui/SystemNotice';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();

  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sidebarOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const sidebar = document.getElementById('app-sidebar');
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar?.querySelector<HTMLElement>('a,button')?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
      if (event.key === 'Tab') {
        const items = sidebar?.querySelectorAll<HTMLElement>('a,button');
        if (!items?.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = original; document.removeEventListener('keydown', keyboard); previous?.focus(); };
  }, [sidebarOpen]);
  return <div className="dashboard-layout" ref={shell}><a href="#main-content" className="skip-link">{t("Skip to content")}</a><Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} role={session?.user?.role} /><Header user={session?.user} onMenuToggle={() => setSidebarOpen(value => !value)} menuOpen={sidebarOpen} /><main id="main-content" className="main-content"><div className="content-container"><SystemNotice />{children}<footer className="workspace-footer"><span>{t("NovaX")}</span><span>{t("Keep learning. Keep growing.")}</span></footer></div></main>{sidebarOpen && <button className="sidebar-overlay" aria-label={t("Close navigation")} tabIndex={-1} onClick={() => setSidebarOpen(false)} />}</div>;
}

