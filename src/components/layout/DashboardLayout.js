'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-bg-main text-text-main relative overflow-x-clip transition-colors duration-200"
      suppressHydrationWarning
    >
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ease-out animate-fadeIn"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Component */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`smooth-main min-h-screen flex flex-col ml-0 ${
          collapsed ? 'lg:ml-[70px]' : 'lg:ml-[250px]'
        }`}
        suppressHydrationWarning
      >
        <TopNav mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <main
          className="p-3.5 sm:p-5 lg:p-6 flex-1 relative z-10 max-w-[1600px] w-full mx-auto animate-pageEnter"
          suppressHydrationWarning
        >
          {children}
        </main>
      </div>
    </div>
  );
}
