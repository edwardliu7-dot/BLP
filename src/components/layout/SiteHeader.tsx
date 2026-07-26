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
    <header className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white shadow-xl sticky top-0 z-10 transition-colors">
      {/* Gold top accent line */}
      <div className="h-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />

      <GeometricOverlay />

      {/* Top bar: logo + actions */}
      <div className="relative max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Logo + School name */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/15 border border-white/20 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <div className="leading-tight">
            <p className="font-extrabold text-base leading-none tracking-tight">BLP Harian</p>
            <p className="text-[11px] text-emerald-200 leading-none mt-0.5">SMP TISA Islamic School</p>
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
        <div className="relative max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                item.isActive
                  ? 'bg-white/20 border-amber-400 text-white'
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
