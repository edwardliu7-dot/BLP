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

// Subtle Islamic geometric SVG pattern overlay
const GeometricOverlay = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="hdr-geo" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="white" strokeWidth="0.5" opacity="0.08">
          <polygon points="24,3 27,18 39,15 32,24 39,33 27,30 24,45 21,30 9,33 16,24 9,15 21,18" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hdr-geo)" />
  </svg>
);

export default function SiteHeader({ navItems, actions }: SiteHeaderProps) {
  return (
    <header className="bg-gradient-to-br from-[#063b2d] via-emerald-900 to-[#075e58] text-white shadow-[0_10px_30px_rgba(3,64,46,0.2)] sticky top-0 z-50 transition-colors overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400" />

      <div className="absolute inset-0 app-pattern opacity-70" />

      {/* Top bar: logo + actions */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Logo + School name */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <div className="leading-tight">
            <p className="font-extrabold text-base leading-none tracking-tight">BLP Harian</p>
            <p className="text-[11px] text-emerald-200 leading-none mt-1">SMP TISA Islamic School</p>
          </div>
        </div>

        {/* Right: action buttons */}
        {actions && (
          <div className="flex items-center gap-1">
            {actions}
          </div>
        )}
      </div>

      {/* Navigation tabs */}
      {navItems && navItems.length > 0 && (
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                item.isActive
                  ? 'bg-white/18 border-amber-300 text-white shadow-[inset_0_-2px_0_rgba(253,230,138,0.35)]'
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
