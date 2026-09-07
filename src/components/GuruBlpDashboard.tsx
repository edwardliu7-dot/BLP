import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, LockKeyhole } from 'lucide-react';
import { addDays, format, isSameDay, startOfDay, subDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { GURU_BLP_CATEGORIES } from '../data/guruActivities';
import type { DailyRecord } from '../types';

interface GuruBlpDashboardProps {
  guruName: string;
  records: Record<string, DailyRecord>;
  onUpdateRecord: (date: Date, record: DailyRecord) => Promise<void>;
}

const emptyRecord = (date: string): DailyRecord => ({
  date,
  completedActivities: [],
  submissions: {},
});

export default function GuruBlpDashboard({ guruName, records, onUpdateRecord }: GuruBlpDashboardProps) {
  const today = startOfDay(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const currentRecord = records[dateKey] || emptyRecord(dateKey);
  const completed = useMemo<Set<string>>(
    () => new Set<string>(currentRecord.completedActivities),
    [currentRecord.completedActivities],
  );
  const completedCount = GURU_BLP_CATEGORIES.reduce(
    (total, category) => total + category.activities.filter(activity => completed.has(activity.id)).length,
    0,
  );
  const totalCount = GURU_BLP_CATEGORIES.reduce((total, category) => total + category.activities.length, 0);
  const isEditable = isSameDay(selectedDate, today);

  const toggleActivity = async (activityId: string) => {
    if (!isEditable || saving) return;
    const next = new Set<string>(completed);
    if (next.has(activityId)) next.delete(activityId);
    else next.add(activityId);
    const nextRecord: DailyRecord = {
      ...currentRecord,
      date: dateKey,
      completedActivities: [...next],
      score: Math.round((next.size / totalCount) * 100),
    };
    setSaving(true);
    try {
      await onUpdateRecord(selectedDate, nextRecord);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 sm:p-8 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-emerald-100 text-sm font-medium">Pengisian BLP Guru</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">Assalamu’alaikum, {guruName}</h1>
            <p className="text-emerald-100 mt-2 text-sm max-w-xl">
              Catat kebiasaan BLP pribadi Anda setiap hari sebagai bagian dari keteladanan bersama.
            </p>
          </div>
          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/15 items-center justify-center">
            <ClipboardCheck size={28} />
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <p className="text-emerald-100 text-xs uppercase tracking-wider">Progres hari ini</p>
            <p className="text-4xl font-bold mt-1">{completedCount}<span className="text-xl text-emerald-200">/{totalCount}</span></p>
          </div>
          <div className="w-full sm:max-w-xs">
            <div className="flex justify-between text-xs text-emerald-100 mb-2">
              <span>{Math.round((completedCount / totalCount) * 100)}% selesai</span>
              <span>{saving ? 'Menyimpan...' : isEditable ? 'Bisa diisi hari ini' : 'Riwayat'}</span>
            </div>
            <div className="h-2 rounded-full bg-black/20 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSelectedDate(date => subDays(date, 1))}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Hari sebelumnya"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: localeId })}</p>
          {!isEditable && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mt-1">
              <LockKeyhole size={12} /> Riwayat hanya dapat dilihat
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={isSameDay(selectedDate, today)}
          onClick={() => setSelectedDate(date => addDays(date, 1))}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
          aria-label="Hari berikutnya"
        >
          <ChevronRight size={20} />
        </button>
      </section>

      <section className="space-y-4">
        {GURU_BLP_CATEGORIES.map(category => (
          <div key={category.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50">
              <h2 className="font-bold text-emerald-800 dark:text-emerald-200 tracking-wide">{category.label}</h2>
            </div>
            {category.activities.map(activity => {
              const isDone = completed.has(activity.id);
              return (
                <button
                  type="button"
                  key={activity.id}
                  onClick={() => toggleActivity(activity.id)}
                  disabled={!isEditable || saving}
                  className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors disabled:cursor-default"
                >
                  <span className={`mt-0.5 shrink-0 ${isDone ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}`}>
                    {isDone ? <CheckCircle2 size={24} fill="currentColor" className="text-emerald-500 fill-emerald-100 dark:fill-emerald-950" /> : <span className="block w-6 h-6 rounded-full border-2 border-current" />}
                  </span>
                  <span className="flex-1">
                    <span className={`block font-medium ${isDone ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}>{activity.name}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">{activity.target}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </section>
    </main>
  );
}