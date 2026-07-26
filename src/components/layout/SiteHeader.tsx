import React from 'react';

export interface NavItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
}

interface SiteHeaderProps {
  navItems?: NavItem[];
  actions?: React.ReactNode;
}

export default function SiteHeader({ navItems, actions }: SiteHeaderProps) {
  return (
    <header className="bg-emerald-700 dark:bg-emerald-900 text-white shadow-lg sticky top-0 z-10 transition-colors">
      {/* Top bar: logo + actions */}
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Logo + School name */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-base leading-none">BLP Harian</p>
            <p className="text-[11px] text-emerald-200 dark:text-emerald-300 leading-none mt-0.5">
              SMP TISA Islamic School
            </p>
          </div>
        </div>

        {/* Right: action buttons */}
        {actions && (
          <div className="flex items-center gap-1">
            {actions}
          </div>
        )}
      </div>

      {/* Bottom bar: nav tabs (only if navItems provided) */}
      {navItems && navItems.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-0 flex gap-1 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
                item.isActive
                  ? 'bg-white/15 border-white text-white'
                  : 'border-transparent text-emerald-200 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
