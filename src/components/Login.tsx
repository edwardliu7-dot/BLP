import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, User, Lock, ArrowRight, Mail, Phone, BookOpen, KeyRound } from 'lucide-react';
import { AuthState, SystemData, UserProgress, GuruProfile } from '../types';

interface LoginProps {
  systemData: SystemData;
  onLogin: (auth: AuthState) => void;
  onRegisterSiswa: (data: UserProgress) => void;
  onRegisterGuru: (data: GuruProfile) => void;
}

export default function Login({ systemData, onLogin, onRegisterSiswa, onRegisterGuru }: LoginProps) {
  const [role, setRole] = useState<'siswa' | 'guru'>('siswa');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [kelas, setKelas] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const resetForm = () => {
    setName('');
    setPassword('');
    setEmail('');
    setWhatsapp('');
    setKelas('');
    setErrorMsg('');
  };

  const handleModeSwitch = (newMode: 'login' | 'register') => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'register') {
      if (!name.trim() || !password.trim()) {
        setErrorMsg('Nama dan Password wajib diisi');
        return;
      }

      const id = name.toLowerCase().replace(/\s+/g, '-');

      if (role === 'siswa') {
        if (!kelas.trim() || !email.trim() || !whatsapp.trim()) {
          setErrorMsg('Semua field wajib diisi untuk siswa');
          return;
        }
        if (systemData.students[id]) {
          setErrorMsg('Siswa dengan nama ini sudah terdaftar. Silakan login.');
          return;
        }
        onRegisterSiswa({
          id,
          name,
          kelas,
          email,
          whatsapp,
          password,
          records: {}
        });
      } else {
        if (!kelas.trim()) {
          setErrorMsg('Kelas yang diampu wajib diisi');
          return;
        }
        if (systemData.gurus[id]) {
          setErrorMsg('Guru dengan nama ini sudah terdaftar. Silakan login.');
          return;
        }
        // Split comma separated classes
        const classes = kelas.split(',').map(c => c.trim()).filter(Boolean);
        onRegisterGuru({
          id,
          name,
          kelasDiampu: classes,
          password
        });
      }
    } else {
      // Login flow
      const id = name.toLowerCase().replace(/\s+/g, '-');
      
      if (role === 'siswa') {
        const student = systemData.students[id];
        if (!student) {
          setErrorMsg('Nama Anda belum terdaftar. Silakan pindah ke tab "Daftar Baru".');
          return;
        }
        if (student.password && student.password !== password) {
          setErrorMsg('Password salah!');
          return;
        }
        onLogin({ role: 'siswa', userId: student.id, name: student.name, kelas: student.kelas });
      } else {
        const guru = systemData.gurus[id];
        if (!guru) {
          setErrorMsg('Nama Anda belum terdaftar. Silakan pindah ke tab "Daftar Baru".');
          return;
        }
        if (guru.password && guru.password !== password) {
          setErrorMsg('Password salah!');
          return;
        }
        onLogin({ role: 'guru', userId: guru.id, name: guru.name, kelasDiampu: guru.kelasDiampu });
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
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {role === 'siswa' ? 'Kelas' : 'Kelas Yang Diampu'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BookOpen className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={kelas}
                        onChange={(e) => setKelas(e.target.value)}
                        placeholder={role === 'siswa' ? "Contoh: 7A" : "Contoh: 7A, 7B, 8A"}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
                      />
                    </div>
                  </div>

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
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white p-3 rounded-xl font-bold transition-all mt-6"
            >
              {mode === 'login' ? 'Masuk' : 'Daftar'} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
