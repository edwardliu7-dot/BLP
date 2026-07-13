import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings2, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { BlpPeriod } from '../../types';

interface BlpPeriodModalProps {
  kelasOptions: string[];
  monthDate: Date;
  blpPeriods: Record<string, BlpPeriod>;
  getPeriodKey: (kelas: string, date: Date) => string;
  onClose: () => void;
  onSave: (kelas: string, year: number, month: number, startDay: number, endDay: number) => Promise<void>;
}

export default function BlpPeriodModal({ kelasOptions, monthDate, blpPeriods, getPeriodKey, onClose, onSave }: BlpPeriodModalProps) {
  const [kelas, setKelas] = useState(kelasOptions[0] || '');
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const existing = kelas ? blpPeriods[getPeriodKey(kelas, monthDate)] : undefined;
  const [startDay, setStartDay] = useState(existing?.startDay ?? 1);
  const [endDay, setEndDay] = useState(existing?.endDay ?? daysInMonth);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleKelasChange = (newKelas: string) => {
    setKelas(newKelas);
    const p = blpPeriods[getPeriodKey(newKelas, monthDate)];
    setStartDay(p?.startDay ?? 1);
    setEndDay(p?.endDay ?? daysInMonth);
    setSuccess(false);
  };

  const handleSave = async () => {
    setError(null);
    if (startDay < 1 || endDay > daysInMonth || endDay < startDay) {
      setError(`Rentang tanggal harus antara 1 - ${daysInMonth}, dan tanggal akhir tidak boleh lebih kecil dari tanggal awal.`);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(kelas, monthDate.getFullYear(), monthDate.getMonth() + 1, startDay, endDay);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
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
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Settings2 className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white leading-tight">Hari Aktif BLP</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{format(monthDate, 'MMMM yyyy', { locale: localeId })}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Atur rentang tanggal penilaian BLP untuk kelas ini di bulan tersebut. Isian siswa di luar
              rentang ini tetap tersimpan, tapi tidak akan dihitung ke rata-rata nilai/rekap bulanan.
            </p>

            {kelasOptions.length > 1 && (
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Kelas</label>
                <select
                  value={kelas}
                  onChange={(e) => handleKelasChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100"
                >
                  {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tanggal mulai</label>
                <input
                  type="number"
                  min={1}
                  max={daysInMonth}
                  value={startDay}
                  onChange={(e) => { setStartDay(Number(e.target.value)); setSuccess(false); }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tanggal selesai</label>
                <input
                  type="number"
                  min={1}
                  max={daysInMonth}
                  value={endDay}
                  onChange={(e) => { setEndDay(Number(e.target.value)); setSuccess(false); }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
            {success && !error && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Tersimpan.</p>}

            <button
              onClick={handleSave}
              disabled={isSaving || !kelas}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white p-3 rounded-xl font-bold transition-all"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Simpan
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
