import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Loader2, Copy, Check } from 'lucide-react';

interface GeneratedAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  kelas: string;
}

interface GenerateStudentAccountModalProps {
  kelasOptions: string[];
  onClose: () => void;
  onGenerate: (data: { name: string; kelas: string }) => Promise<GeneratedAccount>;
}

export default function GenerateStudentAccountModal({ kelasOptions, onClose, onGenerate }: GenerateStudentAccountModalProps) {
  const [name, setName] = useState('');
  const [kelas, setKelas] = useState(kelasOptions[0] || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedAccount | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Nama siswa wajib diisi');
      return;
    }
    if (!kelas) {
      setError('Pilih kelas terlebih dahulu');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await onGenerate({ name: name.trim(), kelas });
      setResult(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat akun siswa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Username: ${result.username}\nPassword: ${result.password}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setResult(null);
    setName('');
    setCopied(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <UserPlus className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white leading-tight">Buat Akun Siswa</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Username &amp; password dibuat otomatis</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            {!result ? (
              <>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Masukkan nama siswa, lalu tekan Buat Akun. Username dan password akan dibuat
                  otomatis oleh sistem — catat dan bagikan ke siswa, karena password hanya
                  ditampilkan sekali di sini.
                </p>

                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Nama Lengkap Siswa</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                {kelasOptions.length > 1 && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Kelas</label>
                    <select
                      value={kelas}
                      onChange={(e) => setKelas(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100"
                    >
                      {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                )}

                {error && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}

                <button
                  onClick={handleGenerate}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white p-3 rounded-xl font-bold transition-all"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  Buat Akun
                </button>
              </>
            ) : (
              <>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 space-y-2">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                    Akun untuk {result.name} berhasil dibuat!
                  </p>
                  <div className="text-sm space-y-1">
                    <p className="text-slate-700 dark:text-slate-200"><span className="font-semibold">Username:</span> {result.username}</p>
                    <p className="text-slate-700 dark:text-slate-200"><span className="font-semibold">Password:</span> {result.password}</p>
                  </div>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed">
                    Simpan/bagikan data ini sekarang — password tidak akan ditampilkan lagi setelah modal ini ditutup.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 p-3 rounded-xl font-bold transition-all"
                  >
                    {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                    {copied ? 'Tersalin!' : 'Salin'}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold transition-all"
                  >
                    <UserPlus size={18} />
                    Buat Lagi
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
