import React from 'react';
import SiteHeader, { type NavItem } from './SiteHeader';
import SiteFooter from './SiteFooter';

export type { NavItem };

interface PageLayoutProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  actions?: React.ReactNode;
}

export default function PageLayout({ children, navItems, actions }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <SiteHeader navItems={navItems} actions={actions} />
      <main className="flex-1 w-full">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
