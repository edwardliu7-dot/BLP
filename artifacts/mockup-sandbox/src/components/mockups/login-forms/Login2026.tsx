import { ArrowRight, AtSign, BookOpen, Check, GraduationCap, KeyRound, ShieldCheck } from 'lucide-react';

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

function InputPreview({
  icon,
  label,
  placeholder,
  type = 'text',
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#5f746d]">
        {label}
      </span>
      <span className="flex h-14 items-center gap-3 rounded-2xl border border-[#d7e4dd] bg-white px-4 shadow-[0_5px_18px_rgba(11,73,55,0.04)] transition-colors focus-within:border-[#0a8f6b] focus-within:ring-4 focus-within:ring-[#0a8f6b]/10">
        <span className="text-[#73938a]">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-medium text-[#17352d] outline-none placeholder:text-[#a5b8b1]"
        />
      </span>
    </label>
  );
}

export function Login2026() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7f2] font-sans text-[#17352d]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(360px,0.86fr)_minmax(520px,1.14fr)]">
        <section className="relative hidden overflow-hidden bg-[#073e31] text-white lg:flex lg:flex-col lg:justify-between">
          <GeometricPattern />
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#f5c84c] via-[#ffe79a] to-[#f5c84c]" />
          <div className="relative z-10 flex items-center justify-between px-10 py-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-1.5">
                <img src="/__mockup/images/logo.png" alt="Logo TISA" className="h-full w-full object-contain" />
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

          <div className="relative z-10 px-10 pb-16">
            <div className="mb-8 h-px w-16 bg-[#f5d46b]" />
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#f5d46b]">Building Learning Power</p>
            <h1 className="max-w-md text-5xl font-black leading-[1.05] tracking-[-0.04em]">
              Catat kebaikan.
              <br />
              Tumbuhkan kebiasaan.
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-7 text-[#b6d9ce]">
              Ruang sederhana untuk mencatat amaliyah harian dan melihat langkah kecil yang membentuk karakter.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              {['Beriman', 'Berilmu', 'Berakhlak'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-[#e0f1eb]">
                  <Check size={13} className="text-[#f5d46b]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/10 px-10 py-5 text-[10px] uppercase tracking-[0.16em] text-[#91c7b8]">
            <span>SMP TISA Islamic School</span>
            <span>Semester 2026</span>
          </div>
        </section>

        <section className="flex min-h-screen flex-col justify-center px-5 py-8 sm:px-10 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-[500px]">
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#073e31] p-1.5 shadow-lg shadow-[#073e31]/15">
                  <img src="/__mockup/images/logo.png" alt="Logo TISA" className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-base font-extrabold">BLP Harian</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#668178]">TISA Islamic School</p>
                </div>
              </div>
              <span className="rounded-full bg-[#e8f2ed] px-3 py-1 text-[10px] font-extrabold tracking-[0.18em] text-[#137355]">2026</span>
            </div>

            <div className="mb-9">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f2ec] text-[#0a8f6b]">
                <ShieldCheck size={22} strokeWidth={2.2} />
              </div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#0a8f6b]">Selamat datang kembali</p>
              <h2 className="text-4xl font-black tracking-[-0.04em] text-[#17352d] sm:text-[44px]">Masuk ke BLP</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#71857e]">
                Pilih akses Anda untuk mencatat amaliyah hari ini dengan tenang dan teratur.
              </p>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-3 rounded-2xl bg-[#eaf1ed] p-1.5">
              <button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#073e31] text-sm font-bold text-white shadow-lg shadow-[#073e31]/15">
                <GraduationCap size={18} />
                Siswa
              </button>
              <button className="flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold text-[#668178] transition-colors hover:bg-white hover:text-[#17352d]">
                <BookOpen size={18} />
                Guru
              </button>
            </div>

            <div className="space-y-5">
              <InputPreview icon={<AtSign size={19} />} label="Username" placeholder="Masukkan username" />
              <InputPreview icon={<KeyRound size={19} />} label="Password" placeholder="Masukkan password" type="password" />
              <button className="group mt-2 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#0a8f6b] text-sm font-extrabold text-white shadow-xl shadow-[#0a8f6b]/20 transition-all hover:bg-[#087858]">
                Masuk sebagai Siswa
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#e1ebe5] bg-white/70 p-4">
              <div className="mt-0.5 text-[#d09e18]">
                <ShieldCheck size={16} />
              </div>
              <p className="text-xs leading-5 text-[#71857e]">
                Belum punya akun? Hubungi wali kelas untuk mendapatkan username dan password.
              </p>
            </div>

            <div className="mt-10 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9aada5]">
              <span>BLP Harian</span>
              <span>© 2026 TISA Islamic School</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}