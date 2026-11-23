'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bell,
  ChevronRight,
  LogOut,
  User,
  Settings,
  Calendar,
  Globe,
  Check,
  Menu,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function TopNav({ mobileOpen, setMobileOpen }) {
  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();

  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const langRef = useRef(null);

  // Map path to translation key
  const getPageTitleKey = () => {
    switch (pathname) {
      case '/dashboard': return 'overview';
      case '/dashboard/inventory': return 'inventory';
      case '/dashboard/categories': return 'categories';
      case '/dashboard/stock-in': return 'stockIn';
      case '/dashboard/stock-out': return 'stockOut';
      case '/dashboard/borrow': return 'borrowReturn';
      case '/dashboard/sme-products': return 'smeProducts';
      case '/dashboard/suppliers': return 'suppliers';
      case '/dashboard/reports': return 'reports';
      case '/dashboard/activity': return 'activityHistory';
      case '/dashboard/users': return 'userManagement';
      case '/dashboard/settings': return 'settings';
      default: return 'overview';
    }
  };

  const titleKey = getPageTitleKey();
  const pageTitle = t(titleKey, 'Dashboard');

  useEffect(() => {
    const locale = lang === 'kh' ? 'km-KH' : 'en-US';
    try {
      setCurrentDate(
        new Date().toLocaleDateString(locale, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      );
    } catch {
      setCurrentDate(new Date().toISOString().split('T')[0]);
    }
  }, [lang]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (langRef.current && !langRef.current.contains(e.target)) setShowLangMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="h-16 glass-strong border-b border-border flex items-center justify-between px-3 sm:px-6 sticky top-0 z-40 w-full"
      suppressHydrationWarning
    >
      {/* Left: Mobile Menu Toggle + Title & Breadcrumb */}
      <div className="flex items-center gap-2.5 sm:gap-3" suppressHydrationWarning>
        {/* Mobile Hamburger Drawer Button */}
        <button
          onClick={() => setMobileOpen && setMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg border border-border bg-black/[0.04] dark:bg-white/[0.04] text-text-secondary hover:text-text-main transition-colors"
          title="Open menu"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted mb-0.5">
            <span className="font-medium hidden sm:inline">InnoLab</span>
            {titleKey !== 'overview' && (
              <>
                <ChevronRight className="h-3 w-3 text-text-muted hidden sm:inline" />
                <span className="text-primary dark:text-cyan-400 font-medium">{pageTitle}</span>
              </>
            )}
          </div>
          <h1 className="text-sm sm:text-base font-semibold text-text-main leading-tight tracking-tight truncate max-w-[180px] sm:max-w-none">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right: Date + Language Switcher + Notifications + Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5" suppressHydrationWarning>
        {/* Date Display (Desktop & Tablet) */}
        <div
          className="hidden md:flex items-center gap-1.5 text-xs text-text-secondary bg-black/[0.03] dark:bg-white/[0.03] border border-border px-3 py-1.5 rounded-lg"
          suppressHydrationWarning
        >
          <Calendar className="h-3.5 w-3.5 text-primary dark:text-cyan-400" />
          <span suppressHydrationWarning className="font-medium">{currentDate}</span>
        </div>

        {/* Language Switcher Dropdown (Pure Typography - No Emojis) */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => { setShowLangMenu(!showLangMenu); setShowProfile(false); setShowNotifs(false); }}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-border
              bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-xs font-medium text-text-main transition-colors"
            title="Switch Language"
            aria-label="Switch Language"
          >
            <Globe className="h-3.5 w-3.5 text-primary dark:text-cyan-400" />
            <span className="font-bold text-[11px] tracking-wide text-primary dark:text-cyan-300 uppercase">
              {lang === 'kh' ? 'KH' : 'EN'}
            </span>
            <span className="hidden sm:inline text-text-secondary text-[11px]">
              {lang === 'kh' ? 'ភាសាខ្មែរ' : 'English'}
            </span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-bg-surface rounded-xl shadow-xl border border-border animate-slideDown overflow-hidden z-50 backdrop-blur-xl">
              <div className="px-3.5 py-2 border-b border-border bg-black/[0.02] dark:bg-black/[0.2]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Language Preference
                </p>
              </div>
              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => { setLang('en'); setShowLangMenu(false); }}
                  className={`w-full px-3 py-1.5 text-left text-xs rounded-lg flex items-center justify-between transition-colors ${lang === 'en'
                      ? 'bg-primary/10 text-primary dark:text-cyan-300 font-semibold border border-primary/25'
                      : 'text-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-text-main'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/10 text-text-main">EN</span>
                    <span>English</span>
                  </span>
                  {lang === 'en' && <Check className="h-3.5 w-3.5 text-primary dark:text-cyan-400" />}
                </button>

                <button
                  onClick={() => { setLang('kh'); setShowLangMenu(false); }}
                  className={`w-full px-3 py-1.5 text-left text-xs rounded-lg flex items-center justify-between transition-colors ${lang === 'kh'
                      ? 'bg-primary/10 text-primary dark:text-cyan-300 font-semibold border border-primary/25'
                      : 'text-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-text-main'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/10 text-text-main">KH</span>
                    <span>ភាសាខ្មែរ</span>
                  </span>
                  {lang === 'kh' && <Check className="h-3.5 w-3.5 text-primary dark:text-cyan-400" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); setShowLangMenu(false); }}
            className="relative h-8.5 w-8.5 flex items-center justify-center rounded-lg border border-border
              bg-black/[0.03] dark:bg-white/[0.03] text-text-secondary hover:text-text-main hover:bg-black/[0.06] dark:hover:bg-white/[0.06]
              transition-colors"
            title={t('lowStockAlerts')}
            aria-label="Notifications"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-bg-surface rounded-xl shadow-xl border border-border animate-slideDown overflow-hidden z-50 backdrop-blur-xl">
              <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-black/[0.02] dark:bg-black/[0.2]">
                <h3 className="text-xs font-semibold text-text-main">{t('lowStockAlerts')}</h3>
                <span className="text-[10px] bg-rose-500/15 text-rose-500 dark:text-rose-300 border border-rose-500/25 px-2 py-0.5 rounded-full font-medium">
                  2 Active
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto text-xs divide-y divide-border">
                <div className="px-4 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] cursor-pointer transition-colors">
                  <p className="font-medium text-text-main">Epson EcoTank Ink 003</p>
                  <p className="text-text-muted text-[11px] mt-0.5">
                    {lang === 'kh' ? 'នៅសល់ ៤ ដប (កម្រិតព្រមាន៖ ៨)' : 'Only 4 bottles remaining (Threshold: 8)'}
                  </p>
                </div>
                <div className="px-4 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] cursor-pointer transition-colors">
                  <p className="font-medium text-text-main">Sony Alpha A6400 Camera</p>
                  <p className="text-rose-500 dark:text-rose-400 text-[11px] mt-0.5">
                    {lang === 'kh' ? 'ឧបករណ៍ហួសកាលកំណត់សង (ហេង វិសាល)' : 'Overdue equipment return (Heng Visal)'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); setShowLangMenu(false); }}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg border border-border
              bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
            title="User Profile"
            aria-label="User Profile"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-[10px]">
              SA
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-text-main leading-none">Admin</p>
              <p className="text-[10px] text-text-muted leading-none mt-0.5">Administrator</p>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-bg-surface rounded-xl shadow-xl border border-border animate-slideDown overflow-hidden z-50 backdrop-blur-xl">
              <div className="p-3 border-b border-border bg-black/[0.02] dark:bg-black/[0.2]">
                <p className="text-xs font-semibold text-text-main">System Administrator</p>
                <p className="text-[11px] text-text-muted truncate mt-0.5">admin@innolab.kh</p>
              </div>
              <div className="p-1 space-y-0.5 text-xs">
                <a
                  href="/dashboard/settings"
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-text-secondary hover:text-text-main hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-text-muted" />
                  <span>{t('settings')}</span>
                </a>
                <a
                  href="/dashboard/users"
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-text-secondary hover:text-text-main hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-text-muted" />
                  <span>{t('userManagement')}</span>
                </a>
                <div className="border-t border-border my-1" />
                <button
                  onClick={async () => {
                    const { signOut } = await import('next-auth/react');
                    signOut({ callbackUrl: '/login' });
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-rose-500 hover:bg-rose-500/10 transition-colors font-medium"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
