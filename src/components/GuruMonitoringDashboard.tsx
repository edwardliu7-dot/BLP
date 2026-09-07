import { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleUserRound } from 'lucide-react';
import { addDays, format, isSameDay, startOfDay, subDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { GURU_BLP_CATEGORIES } from '../data/guruActivities';
import type { DailyRecord, GuruMonitoringEntry } from '../types';

interface GuruMonitoringDashboardProps {
  entries: GuruMonitoringEntry[];
}

function dateValue(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function completedCount(record: DailyRecord | undefined) {
  return record?.completedActivities?.length || 0;
}

export default function GuruMonitoringDashboard({ entries }: GuruMonitoringDashboardProps) {
  const today = startOfDay(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedGuruId, setSelectedGuruId] = useState<string | null>(entries[0]?.guru.id || null);
  const dateKey = dateValue(selectedDate);
  const totalActivities = GURU_BLP_CATEGORIES.reduce((total, category) => total + category.activities.length, 0);
  const selectedEntry = entries.find(entry => entry.guru.id === selectedGuruId) || entries[0];
  const filledCount = entries.filter(entry => completedCount(entry.records[dateKey]) > 0).length;
  const totalChecked = entries.reduce((total, entry) => total + completedCount(entry.records[dateKey]), 0);
  const average = entries.length ? Math.round((totalChecked / (entries.length * totalActivities)) * 100) : 0;

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.guru.name.localeCompare(b.guru.name, 'id')),
    [entries],
  );

  if (entries.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-slate-500">
          Belum ada data guru yang dapat dipantau.
        </div>
      </main>
    );
  }

  const selectedRecord = selectedEntry?.records[dateKey];
  const selectedCount = completedCount(selectedRecord);
  const selectedPercentage = Math.round((selectedCount / totalActivities) * 100);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Monitoring BLP Guru</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">Pantauan keteladanan guru</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Lihat pengisian checklist guru berdasarkan tanggal dan buka detail setiap guru.</p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
        <button type="button" onClick={() => setSelectedDate(date => subDays(date, 1))} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Hari sebelumnya">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2 text-center">
          <CalendarDays size={18} className="text-emerald-600" />
          <span className="font-semibold text-slate-800 dark:text-slate-100">{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: localeId })}</span>
        </div>
        <button type="button" disabled={isSameDay(selectedDate, today)} onClick={() => setSelectedDate(date => addDays(date, 1))} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30" aria-label="Hari berikutnya">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-emerald-600 text-white p-4"><p className="text-emerald-100 text-xs">Total guru</p><p className="text-2xl font-bold mt-1">{entries.length}</p></div>
        <div className="rounded-2xl bg-blue-600 text-white p-4"><p className="text-blue-100 text-xs">Sudah mengisi</p><p className="text-2xl font-bold mt-1">{filledCount}</p></div>
        <div className="rounded-2xl bg-amber-500 text-white p-4"><p className="text-amber-100 text-xs">Belum mengisi</p><p className="text-2xl font-bold mt-1">{entries.length - filledCount}</p></div>
        <div className="rounded-2xl bg-violet-600 text-white p-4"><p className="text-violet-100 text-xs">Rata-rata</p><p className="text-2xl font-bold mt-1">{average}%</p></div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-5">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <CircleUserRound size={18} className="text-emerald-600" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Daftar Guru</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedEntries.map(entry => {
              const count = completedCount(entry.records[dateKey]);
              const percentage = Math.round((count / totalActivities) * 100);
              const selected = entry.guru.id === selectedEntry?.guru.id;
              return (
                <button type="button" key={entry.guru.id} onClick={() => setSelectedGuruId(entry.guru.id)} className={`w-full px-5 py-4 text-left transition-colors ${selected ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0"><p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{entry.guru.name}</p><p className="text-xs text-slate-500 dark:text-slate-400 truncate">{entry.guru.jabatan.join(', ') || 'Guru'}</p></div>
                    <span className={`text-sm font-bold ${count === totalActivities ? 'text-emerald-600' : count > 0 ? 'text-amber-500' : 'text-slate-400'}`}>{percentage}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-3 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentage}%` }} /></div>
                </button>
              );
            })}
          </div>
        </section>

        {selectedEntry && (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div><h2 className="font-bold text-slate-800 dark:text-slate-100">{selectedEntry.guru.name}</h2><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedEntry.guru.jabatan.join(', ') || 'Guru'}</p></div>
              <div className="text-right"><p className="text-2xl font-bold text-emerald-600">{selectedPercentage}%</p><p className="text-xs text-slate-500">{selectedCount}/{totalActivities} poin</p></div>
            </div>
            <div className="p-5 space-y-3">
              {GURU_BLP_CATEGORIES.map(category => {
                const activity = category.activities[0];
                const done = selectedRecord?.completedActivities.includes(activity.id);
                return (
                  <div key={category.id} className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                    {done ? <CheckCircle2 size={19} className="text-emerald-500 shrink-0 mt-0.5" /> : <BarChart3 size={19} className="text-slate-300 shrink-0 mt-0.5" />}
                    <div><p className={`text-sm font-semibold ${done ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>{category.label}</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{activity.name}</p></div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}