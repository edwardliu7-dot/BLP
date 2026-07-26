import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { AtSign, ArrowRight, KeyRound, BookOpen, GraduationCap } from 'lucide-react';
import { AuthState } from '../types';

interface LoginProps {
  onLogin: (auth: AuthState) => Promise<void>;
}

// Islamic 8-pointed star geometric pattern
const GeometricPattern = () => (
  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="geo8star" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="white" strokeWidth="0.6" opacity="0.15">
          <polygon points="32,4 36,24 52,20 42,32 52,44 36,40 32,60 28,40 12,44 22,32 12,20 28,24" />
          <circle cx="32" cy="32" r="8" />
          <rect x="24" y="24" width="16" height="16" transform="rotate(45 32 32)" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#geo8star)" />
  </svg>
);

// Sun rays (TISA logo motif)
const SunMotif = () => (
  <svg viewBox="0 0 120 120" className="w-36 h-36 opacity-20" fill="none">
    <circle cx="60" cy="60" r="20" fill="#FCD34D" />
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg) => (
      <line
        key={deg}
        x1="60" y1="60"
        x2={60 + 45 * Math.cos((deg * Math.PI) / 180)}
        y2={60 + 45 * Math.sin((deg * Math.PI) / 180)}
        stroke="#FCD34D" strokeWidth="2.5" strokeLinecap="round"
      />
    ))}
  </svg>
);

// Kaaba silhouette
const KaabaSilhouette = () => (
  <svg viewBox="0 0 100 90" className="w-24 h-20 opacity-25" fill="white">
    <rect x="10" y="25" width="80" height="62" rx="2" />
    <rect x="38" y="60" width="24" height="27" rx="1" fill="rgba(0,60,30,0.6)" />
    <rect x="10" y="42" width="80" height="7" fill="rgba(255,200,0,0.4)" />
    <rect x="5" y="22" width="90" height="5" rx="2.5" />
    <rect x="42" y="17" width="7" height="6" rx="1" />
    <circle cx="60" cy="12" r="4.5" />
    <polygon points="66,7 67.2,11 71,11 68,13 69,17 66,15 63,17 64,13 61,11 64.8,11" fill="#FCD34D" />
  </svg>
);

export default function Login({ onLogin }: LoginProps) {
  const [role, setRole] = useState<'siswa' | 'guru'>('siswa');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => { setUsername(''); setPassword(''); setErrorMsg(''); };
  const handleRoleSwitch = (newRole: 'siswa' | 'guru') => { setRole(newRole); resetForm(); };

  const parseErrorMessage = async (res: Response, fallback: string) => {
    try { const body = await res.json(); return body?.error || fallback; } catch { return fallback; }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim() || !password.trim()) { setErrorMsg('Username dan Password wajib diisi'); return; }
    setIsSubmitting(true);
    try {
      if (role === 'siswa') {
        const res = await fetch('/api/login/siswa', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) { setErrorMsg(await parseErrorMessage(res, 'Username atau password salah. Silakan hubungi wali kelas Anda.')); return; }
        const student = await res.json();
        await onLogin({ role: 'siswa', userId: student.id, name: student.name, kelas: student.kelas });
      } else {
        const res = await fetch('/api/login/guru', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) { setErrorMsg(await parseErrorMessage(res, 'Gagal login')); return; }
        const guru = await res.json();
        await onLogin({ role: 'guru', userId: guru.id, name: guru.name, kelasWali: guru.kelasWali });
      }
    } catch { setErrorMsg('Gagal terhubung ke server. Silakan coba lagi.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex bg-amber-50">

      {/* ── Left Panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-5/12 flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-800 to-teal-900">
        <GeometricPattern />

        {/* Gold top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />

        <div className="relative z-10 text-center text-white px-10 space-y-7">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-28 h-28 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/20 p-2">
              <img src="/logo.png" alt="TISA Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* School name */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-lg">BLP Harian</h1>
            <p className="text-emerald-200 font-semibold text-lg mt-1">SMP TISA Islamic School</p>
          </div>

          {/* Bismillah box */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
            <p className="text-amber-300 font-bold text-2xl tracking-widest mb-1">بِسْمِ اللّٰهِ</p>
            <p className="text-emerald-200 text-xs tracking-widest uppercase">Building Learning Power</p>
          </div>

          {/* Sun motif + Kaaba stacked */}
          <div className="flex items-end justify-center gap-4">
            <SunMotif />
            <KaabaSilhouette />
          </div>

          {/* Tagline */}
          <p className="text-emerald-300 text-sm leading-relaxed max-w-xs mx-auto">
            Membentuk generasi yang{' '}
            <span className="text-amber-300 font-bold">beriman</span>,{' '}
            <span className="text-amber-300 font-bold">berilmu</span>, dan{' '}
            <span className="text-amber-300 font-bold">berakhlak mulia</span>
          </p>
        </div>

        {/* Gold bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">

        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-emerald-800 flex items-center justify-center mb-3 shadow-lg p-2">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-emerald-900">BLP Harian</h1>
          <p className="text-emerald-600 text-sm font-medium">SMP TISA Islamic School</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-800">Selamat Datang! 👋</h2>
            <p className="text-slate-500 mt-1 text-sm">Silakan masuk untuk mencatat amaliyah hari ini.</p>
          </div>

          {/* Role tabs */}
          <div className="flex gap-3 mb-8">
            <button
              type="button"
              onClick={() => handleRoleSwitch('siswa')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                role === 'siswa'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-700'
              }`}
            >
              <GraduationCap size={18} />
              Siswa
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('guru')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                role === 'guru'
                  ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-700'
              }`}
            >
              <BookOpen size={18} />
              Guru
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium text-center border border-red-200"
              >
                {errorMsg}
              </motion.div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <AtSign className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  className="block w-full pl-11 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-0 focus:border-emerald-500 bg-white text-slate-900 font-medium transition-colors placeholder:text-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className="block w-full pl-11 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-0 focus:border-emerald-500 bg-white text-slate-900 font-medium transition-colors placeholder:text-slate-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all mt-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed text-base ${
                role === 'siswa'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-200'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-200'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memuat dashboard...
                </>
              ) : (
                <>Masuk sebagai {role === 'siswa' ? 'Siswa' : 'Guru'} <ArrowRight size={18} /></>
              )}
            </button>

            {role === 'siswa' && (
              <p className="text-xs text-slate-400 text-center pt-1">
                Belum punya akun? Hubungi wali kelas Anda untuk mendapatkan username &amp; password.
              </p>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
