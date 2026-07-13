import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, AtSign, ArrowRight, KeyRound } from 'lucide-react';
import { AuthState } from '../types';

interface LoginProps {
  onLogin: (auth: AuthState) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [role, setRole] = useState<'siswa' | 'guru'>('siswa');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setErrorMsg('');
  };

  const handleRoleSwitch = (newRole: 'siswa' | 'guru') => {
    setRole(newRole);
    resetForm();
  };

  const parseErrorMessage = async (res: Response, fallback: string) => {
    try {
      const body = await res.json();
      return body?.error || fallback;
    } catch {
      return fallback;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username dan Password wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      if (role === 'siswa') {
        const res = await fetch('/api/login/siswa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          setErrorMsg(await parseErrorMessage(res, 'Username atau password salah. Silakan hubungi wali kelas Anda.'));
          return;
        }
        const student = await res.json();
        onLogin({ role: 'siswa', userId: student.id, name: student.name, kelas: student.kelas });
      } else {
        const res = await fetch('/api/login/guru', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          setErrorMsg(await parseErrorMessage(res, 'Gagal login'));
          return;
        }
        const guru = await res.json();
        onLogin({ role: 'guru', userId: guru.id, name: guru.name, kelasWali: guru.kelasWali });
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="bg-emerald-700 dark:bg-emerald-900 p-8 text-white text-center transition-colors">
          <div className="bg-white dark:bg-slate-800 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 transition-colors">
            <GraduationCap className="text-emerald-700 dark:text-emerald-400 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">BLP Harian</h1>
          <p className="text-emerald-100 dark:text-emerald-300 mt-1">SMP TISA Islamic School</p>
        </div>

        <div className="p-8">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6 transition-colors">
            <button
              type="button"
              onClick={() => handleRoleSwitch('siswa')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === 'siswa' ? 'bg-white dark:bg-slate-700 shadow text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Siswa
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('guru')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === 'guru' ? 'bg-white dark:bg-slate-700 shadow text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Guru
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium text-center border border-red-200 dark:border-red-800">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSign className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white p-3 rounded-xl font-bold transition-all mt-6"
            >
              {isSubmitting ? 'Memproses...' : 'Masuk'} <ArrowRight size={18} />
            </button>

            {role === 'siswa' && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-1">
                Belum punya akun? Hubungi wali kelas Anda untuk mendapatkan username &amp; password.
              </p>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
