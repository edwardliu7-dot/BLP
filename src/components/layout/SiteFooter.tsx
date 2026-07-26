// Crescent + star ornament
const CrescentStar = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 inline-block mx-1 opacity-60" fill="currentColor">
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 3-15.46A6 6 0 1 0 14.54 17 8 8 0 0 1 12 20z" />
    <polygon points="18,3 19,6 22,6 19.5,8 20.5,11 18,9 15.5,11 16.5,8 14,6 17,6" />
  </svg>
);

export default function SiteFooter() {
  return (
    <footer className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-emerald-300 transition-colors">
      <div className="h-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
      <p className="text-xs text-center py-3">
        <CrescentStar />
        © 2025 BLP Harian · SMP TISA Islamic School
        <CrescentStar />
      </p>
    </footer>
  );
}
