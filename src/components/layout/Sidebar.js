'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  ShoppingBag,
  Truck,
  BarChart3,
  History,
  Users,
  Settings,
  ChevronLeft,
  X,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { key: 'overview', href: '/dashboard', icon: LayoutDashboard },
    { key: 'inventory', href: '/dashboard/inventory', icon: Package },
    { key: 'categories', href: '/dashboard/categories', icon: FolderTree },
    { type: 'divider', key: 'stockManagement' },
    { key: 'stockIn', href: '/dashboard/stock-in', icon: ArrowDownToLine },
    { key: 'stockOut', href: '/dashboard/stock-out', icon: ArrowUpFromLine },
    { key: 'borrowReturn', href: '/dashboard/borrow', icon: RefreshCw },
    { type: 'divider', key: 'products' },
    { key: 'smeProducts', href: '/dashboard/sme-products', icon: ShoppingBag },
    { key: 'suppliers', href: '/dashboard/suppliers', icon: Truck },
    { type: 'divider', key: 'analytics' },
    { key: 'reports', href: '/dashboard/reports', icon: BarChart3 },
    { key: 'activityHistory', href: '/dashboard/activity', icon: History },
    { type: 'divider', key: 'administration' },
    { key: 'userManagement', href: '/dashboard/users', icon: Users },
    { key: 'settings', href: '/dashboard/settings', icon: Settings },
  ];

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen z-50
        glass-sidebar
        flex flex-col
        smooth-sidebar
        w-[260px]
        ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'lg:w-[70px]' : 'lg:w-[250px]'}
      `}
      suppressHydrationWarning
    >
      {/* Official InnoLab Logo Header */}
      <div className={`flex items-center h-16 px-4 border-b border-border justify-between ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}>
        <Link
          href="/dashboard"
          onClick={handleLinkClick}
          className="flex items-center gap-2.5 overflow-hidden transition-all duration-300"
          title="InnoLab"
        >
          {collapsed ? (
            <>
              {/* Desktop collapsed icon: changes to main-logo.png */}
              <img
                src="/main-logo.png"
                alt="InnoLab"
                className="hidden lg:block h-9 w-auto object-contain max-w-[42px] transition-all duration-300 ease-out"
              />
              {/* Mobile / expanded view */}
              <img
                src="/logo.png"
                alt="InnoLab"
                className="h-8 w-auto object-contain max-w-[170px] lg:hidden transition-all duration-300 ease-out"
              />
            </>
          ) : (
            <img
              src="/logo.png"
              alt="InnoLab"
              className="h-8 w-auto object-contain max-w-[170px] transition-all duration-300 ease-out"
            />
          )}
        </Link>

        {/* Mobile Close (X) Button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
          aria-label="Close navigation drawer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {navItems.map((item, i) => {
          if (item.type === 'divider') {
            if (collapsed) {
              return (
                <div key={i}>
                  <div className="hidden lg:block my-2 mx-2 border-t border-border" />
                  <div className="lg:hidden mt-4 mb-1.5 px-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted/80">
                      {t(item.key)}
                    </span>
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="mt-4 mb-1.5 px-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted/80">
                  {t(item.key)}
                </span>
              </div>
            );
          }

          const Icon = item.icon;
          const active = isActive(item.href);
          const label = t(item.key);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              title={collapsed ? label : undefined}
              className={`
                flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium
                transition-all duration-200 group relative
                ${active
                  ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-main hover:bg-black/[0.04]'
                }
                ${collapsed ? 'lg:justify-center lg:px-0' : ''}
              `}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 transition-colors duration-200 ${active
                ? 'text-primary'
                : 'text-text-muted group-hover:text-text-main'
                }`} />
              <span
                className={`truncate whitespace-nowrap transition-all duration-300 ease-out ${collapsed ? 'lg:opacity-0 lg:max-w-0 lg:overflow-hidden' : 'lg:opacity-100 lg:max-w-[180px]'
                  }`}
              >
                {label}
              </span>
              {active && (
                <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Desktop Collapse Toggle */}
      <div className="hidden lg:block p-2 border-t border-border bg-black/[0.02]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg
            text-xs text-text-muted hover:text-text-main hover:bg-black/[0.04]
            transition-colors duration-200 cursor-pointer
            ${collapsed ? 'justify-center px-0' : ''}
          `}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ease-out ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span className="text-[11px] font-medium transition-opacity duration-200">{t('collapse')}</span>}
        </button>
      </div>
    </aside>
  );
}
