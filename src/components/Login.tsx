import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, User, AtSign, Lock, ArrowRight, Mail, Phone, BookOpen, KeyRound } from 'lucide-react';
import { AuthState, UserProgress, GuruProfile, KELAS_OPTIONS } from '../types';

interface LoginProps {
  onLogin: (auth: AuthState) => void;
  onRegisterSiswa: (data: UserProgress) => void;
  onRegisterGuru: (data: GuruProfile) => void;
}

export default function Login({ onLogin, onRegisterSiswa, onRegisterGuru }: LoginProps) {
  const [role, setRole] = useState<'siswa' | 'guru'>('siswa');
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [kelas, setKelas] = useState('');
  const [kelasDiampu, setKelasDiampu] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setUsername('');
    setName('');
    setPassword('');
    setEmail('');
    setWhatsapp('');
    setKelas('');
    setKelasDiampu([]);
    setErrorMsg('');
  };

  const handleModeSwitch = (newMode: 'login' | 'register') => {
    setMode(newMode);
    resetForm();
  };

  const toggleKelasDiampu = (value: string) => {
    setKelasDiampu(prev => prev.includes(value) ? prev.filter(k => k !== value) : [...prev, value]);
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

    if (mode === 'register') {
      if (!username.trim() || !name.trim() || !password.trim()) {
        setErrorMsg('Username, Nama, dan Password wajib diisi');
        return;
      }

      setIsSubmitting(true);
      try {
        if (role === 'siswa') {
          if (!kelas.trim() || !email.trim() || !whatsapp.trim()) {
            setErrorMsg('Semua field wajib diisi untuk siswa');
            return;
          }
          const res = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, name, kelas, email, whatsapp, password }),
          });
          if (!res.ok) {
            setErrorMsg(await parseErrorMessage(res, 'Gagal mendaftarkan siswa'));
            return;
          }
          const student = await res.json();
          onRegisterSiswa(student);
        } else {
          if (kelasDiampu.length === 0) {
            setErrorMsg('Pilih minimal satu kelas yang diampu');
            return;
          }
          const res = await fetch('/api/gurus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, name, kelasDiampu, password }),
          });
          if (!res.ok) {
            setErrorMsg(await parseErrorMessage(res, 'Gagal mendaftarkan guru'));
            return;
          }
          const guru = await res.json();
          onRegisterGuru(guru);
        }
      } catch (err) {
        setErrorMsg('Gagal terhubung ke server. Silakan coba lagi.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Login flow
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
            setErrorMsg(await parseErrorMessage(res, 'Gagal login'));
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
          onLogin({ role: 'guru', userId: guru.id, name: guru.name, kelasDiampu: guru.kelasDiampu });
        }
      } catch (err) {
        setErrorMsg('Gagal terhubung ke server. Silakan coba lagi.');
      } finally {
        setIsSubmitting(false);
      }
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
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4 transition-colors">
            <button
              type="button"
              onClick={() => setRole('siswa')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === 'siswa' ? 'bg-white dark:bg-slate-700 shadow text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Siswa
            </button>
            <button
              type="button"
              onClick={() => setRole('guru')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === 'guru' ? 'bg-white dark:bg-slate-700 shadow text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Guru
            </button>
          </div>

          <div className="flex justify-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleModeSwitch('login')}
              className={`pb-2 text-sm font-bold border-b-2 transition-all ${mode === 'login' ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('register')}
              className={`pb-2 text-sm font-bold border-b-2 transition-all ${mode === 'register' ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Daftar Baru
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

            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
                  />
                </div>
              </div>
            )}

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
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
                />
              </div>
            </div>

            {mode === 'register' && (
              <AnimatePresence mode="popLayout">
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {role === 'siswa' ? (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kelas</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BookOpen className="h-5 w-5 text-slate-400" />
                        </div>
                        <select
                          value={kelas}
                          onChange={(e) => setKelas(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-colors appearance-none"
                        >
                          <option value="">Pilih kelas</option>
                          {KELAS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kelas Yang Diampu</label>
                      <div className="space-y-2">
                        {KELAS_OPTIONS.map(opt => (
                          <label
                            key={opt}
                            className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={kelasDiampu.includes(opt)}
                              onChange={() => toggleKelasDiampu(opt)}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-slate-900 dark:text-white">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {role === 'siswa' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-400" />
                          </div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email aktif"
                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">No. WhatsApp</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-slate-400" />
                          </div>
                          <input
                            type="tel"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            placeholder="Mulai dengan 62xxx"
                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white p-3 rounded-xl font-bold transition-all mt-6"
            >
              {isSubmitting ? 'Memproses...' : (mode === 'login' ? 'Masuk' : 'Daftar')} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
