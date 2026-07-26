import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  AtSign, ArrowRight, KeyRound, BookOpen, GraduationCap,
  Check, ShieldCheck,
} from 'lucide-react';
import { AuthState } from '../types';

interface LoginProps {
  onLogin: (auth: AuthState) => Promise<void>;
}

function GeometricPattern() {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-30" aria-hidden="true">
      <defs>
        <pattern id="login-grid-2026" width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M28 4 34 22 52 28 34 34 28 52 22 34 4 28 22 22Z" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="28" cy="28" r="5" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#login-grid-2026)" />
    </svg>
  );
}

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

  const isSiswa = role === 'siswa';

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7f2] font-sans text-[#17352d]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(360px,0.86fr)_minmax(520px,1.14fr)]">

        {/* ── Left panel (desktop only) ── */}
        <section className="relative hidden overflow-hidden bg-[#073e31] text-white lg:flex lg:flex-col lg:justify-between">
          <GeometricPattern />

          {/* Gold top accent */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#f5c84c] via-[#ffe79a] to-[#f5c84c]" />

          {/* Top bar: logo + year */}
          <div className="relative z-10 flex items-center justify-between px-10 py-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-1.5">
                <img src="/logo.png" alt="Logo TISA" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-sm font-extrabold tracking-wide">BLP HARIAN</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#a9d7c8]">TISA Islamic School</p>
              </div>
            </div>
            <span className="rounded-full border border-[#f5d46b]/40 px-3 py-1 text-[10px] font-bold tracking-[0.22em] text-[#f9db77]">
              2026
            </span>
          </div>

          {/* Hero copy */}
          <div className="relative z-10 px-10 pb-16">
            <div className="mb-8 h-px w-16 bg-[#f5d46b]" />
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#f5d46b]">
              Building Learning Power
            </p>
            <h1 className="max-w-md text-5xl font-black leading-[1.05] tracking-[-0.04em]">
              Catat kebaikan.
              <br />
              Tumbuhkan kebiasaan.
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-7 text-[#b6d9ce]">
              Ruang sederhana untuk mencatat amaliyah harian dan melihat langkah kecil yang membentuk karakter.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              {['Cerdas', 'Berkarakter'].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-[#e0f1eb]"
                >
                  <Check size={13} className="text-[#f5d46b]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom footer */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 px-10 py-5 text-[10px] uppercase tracking-[0.16em] text-[#91c7b8]">
            <span>SMP TISA Islamic School</span>
            <span>Semester 2026</span>
          </div>
        </section>

        {/* ── Right panel — form ── */}
        <section className="flex min-h-screen flex-col justify-center px-5 py-8 sm:px-10 lg:px-16 xl:px-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto w-full max-w-[500px]"
          >
            {/* Mobile header */}
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#073e31] p-1.5 shadow-lg shadow-[#073e31]/15">
                  <img src="/logo.png" alt="Logo TISA" className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-base font-extrabold">BLP Harian</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#668178]">TISA Islamic School</p>
                </div>
              </div>
              <span className="rounded-full bg-[#e8f2ed] px-3 py-1 text-[10px] font-extrabold tracking-[0.18em] text-[#137355]">
                2026
              </span>
            </div>

            {/* Welcome heading */}
            <div className="mb-9">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f2ec] text-[#0a8f6b]">
                <ShieldCheck size={22} strokeWidth={2.2} />
              </div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#0a8f6b]">
                Selamat datang kembali
              </p>
              <h2 className="text-4xl font-black tracking-[-0.04em] text-[#17352d] sm:text-[44px]">
                Masuk ke BLP
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#71857e]">
                Pilih akses Anda untuk mencatat amaliyah hari ini dengan tenang dan teratur.
              </p>
            </div>

            {/* Role toggle */}
            <div className="mb-8 grid grid-cols-2 gap-3 rounded-2xl bg-[#eaf1ed] p-1.5">
              <button
                type="button"
                onClick={() => handleRoleSwitch('siswa')}
                className={`flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${
                  isSiswa
                    ? 'bg-[#073e31] text-white shadow-lg shadow-[#073e31]/15'
                    : 'text-[#668178] hover:bg-white hover:text-[#17352d]'
                }`}
              >
                <GraduationCap size={18} />
                Siswa
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('guru')}
                className={`flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${
                  !isSiswa
                    ? 'bg-[#073e31] text-white shadow-lg shadow-[#073e31]/15'
                    : 'text-[#668178] hover:bg-white hover:text-[#17352d]'
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
                  className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-600"
                >
                  {errorMsg}
                </motion.div>
              )}

              {/* Username */}
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#5f746d]">
                  Username
                </span>
                <span className="flex h-14 items-center gap-3 rounded-2xl border border-[#d7e4dd] bg-white px-4 shadow-[0_5px_18px_rgba(11,73,55,0.04)] transition-colors focus-within:border-[#0a8f6b] focus-within:ring-4 focus-within:ring-[#0a8f6b]/10">
                  <AtSign size={19} className="shrink-0 text-[#73938a]" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    autoComplete="username"
                    className="w-full bg-transparent text-sm font-medium text-[#17352d] outline-none placeholder:text-[#a5b8b1]"
                  />
                </span>
              </label>

              {/* Password */}
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#5f746d]">
                  Password
                </span>
                <span className="flex h-14 items-center gap-3 rounded-2xl border border-[#d7e4dd] bg-white px-4 shadow-[0_5px_18px_rgba(11,73,55,0.04)] transition-colors focus-within:border-[#0a8f6b] focus-within:ring-4 focus-within:ring-[#0a8f6b]/10">
                  <KeyRound size={19} className="shrink-0 text-[#73938a]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    className="w-full bg-transparent text-sm font-medium text-[#17352d] outline-none placeholder:text-[#a5b8b1]"
                  />
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group mt-2 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#0a8f6b] text-sm font-extrabold text-white shadow-xl shadow-[#0a8f6b]/20 transition-all hover:bg-[#087858] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <svg className="h-5 w-5 animate-spin text-white/80" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Memuat dashboard...
                  </>
                ) : (
                  <>
                    Masuk sebagai {isSiswa ? 'Siswa' : 'Guru'}
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Info box */}
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#e1ebe5] bg-white/70 p-4">
              <div className="mt-0.5 text-[#d09e18]">
                <ShieldCheck size={16} />
              </div>
              <p className="text-xs leading-5 text-[#71857e]">
                Belum punya akun? Hubungi wali kelas untuk mendapatkan username dan password.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-10 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9aada5]">
              <span>BLP Harian</span>
              <span>© 2026 TISA Islamic School</span>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
