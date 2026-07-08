import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  Settings,
  Trophy,
  Star,
  User,
  GraduationCap,
  Download,
  Bell,
  Moon,
  Sun,
  LogOut,
  Mic,
  PenLine,
  FileDown
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { BLP_CATEGORIES } from '../data/activities';
import { DailyRecord, UserProgress, ActivitySubmission } from '../types';
import TextSubmissionModal from './modals/TextSubmissionModal';
import QuranReadingModal from './modals/QuranReadingModal';
import { downloadRekapPDF, downloadRekapExcel } from '../utils/rekapExport';

const QURAN_ACTIVITY_ID = 'd5';
const BELAJAR_ACTIVITY_ID = 'rs1';
const EVALUASI_ACTIVITY_ID = 'rf3';
const RECIPROCITY_ACTIVITY_IDS = ['rp1', 'rp2', 'rp3', 'rp4'];

function getSubmissionConfig(activityId: string): { minWords?: number; placeholder: string; title: string } | null {
  if (activityId === BELAJAR_ACTIVITY_ID) {
    return {
      minWords: 100,
      title: 'Rangkuman Belajar Hari Ini',
      placeholder: 'Tuliskan rangkuman materi yang kamu pelajari hari ini...',
    };
  }
  if (activityId === EVALUASI_ACTIVITY_ID) {
    return {
      minWords: 100,
      title: 'Evaluasi Diri Sebelum Tidur',
      placeholder: 'Tuliskan evaluasi dirimu hari ini: apa yang sudah baik, apa yang perlu diperbaiki, dan permintaan maaf untuk diri sendiri maupun orang lain...',
    };
  }
  if (RECIPROCITY_ACTIVITY_IDS.includes(activityId)) {
    return {
      title: 'Laporan Kegiatan',
      placeholder: 'Ceritakan kegiatan yang kamu lakukan sesuai poin ini...',
    };
  }
  return null;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SiswaDashboardProps {
  user: UserProgress;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  remindersEnabled: boolean;
  toggleReminders: () => void;
  onUpdateRecord: (dateKey: string, updatedRecord: DailyRecord) => void;
  onLogout: () => void;
}

export default function SiswaDashboard({ 
  user, 
  darkMode, 
  setDarkMode, 
  remindersEnabled, 
  toggleReminders,
  onUpdateRecord,
  onLogout
}: SiswaDashboardProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [view, setView] = useState<'daily' | 'monthly' | 'settings'>('daily');

  const records = user.records;
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const currentRecord = records[dateKey] || { date: dateKey, completedActivities: [] };
  const [activeModalActivityId, setActiveModalActivityId] = useState<string | null>(null);

  const applySubmissionCompletion = (activityId: string, submission: ActivitySubmission) => {
    const updatedCompleted = currentRecord.completedActivities.includes(activityId)
      ? currentRecord.completedActivities
      : [...currentRecord.completedActivities, activityId];

    onUpdateRecord(dateKey, {
      ...currentRecord,
      completedActivities: updatedCompleted,
      submissions: {
        ...(currentRecord.submissions || {}),
        [activityId]: submission,
      },
    });
    setActiveModalActivityId(null);
  };

  const toggleActivity = (activityId: string) => {
    const isDone = currentRecord.completedActivities.includes(activityId);

    if (!isDone && (activityId === QURAN_ACTIVITY_ID || getSubmissionConfig(activityId))) {
      setActiveModalActivityId(activityId);
      return;
    }

    const updatedCompleted = isDone
      ? currentRecord.completedActivities.filter(id => id !== activityId)
      : [...currentRecord.completedActivities, activityId];

    const updatedSubmissions = { ...(currentRecord.submissions || {}) };
    if (isDone) delete updatedSubmissions[activityId];

    onUpdateRecord(dateKey, {
      ...currentRecord,
      completedActivities: updatedCompleted,
      submissions: updatedSubmissions,
    });
  };

  const totalActivities = BLP_CATEGORIES.reduce((acc, cat) => acc + cat.activities.length, 0);
  const completedCount = currentRecord.completedActivities.length;
  const completionRate = totalActivities > 0 ? (completedCount / totalActivities) * 100 : 0;

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const monthlyStats = useMemo(() => {
    let totalPossible = daysInMonth.length * totalActivities;
    let totalDone = 0;
    
    daysInMonth.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      if (records[key]) {
        totalDone += records[key].completedActivities.length;
      }
    });

    return {
      totalDone,
      totalPossible,
      rate: totalPossible > 0 ? (totalDone / totalPossible) * 100 : 0
    };
  }, [daysInMonth, records, totalActivities]);

  const exportData = () => {
    const data = {
      name: user.name,
      records: records,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BLP_Progress_${user.name}_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-20 transition-colors">
      <header className="bg-emerald-700 dark:bg-emerald-900 text-white shadow-lg sticky top-0 z-10 transition-colors">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl transition-colors">
                <GraduationCap className="text-emerald-700 dark:text-emerald-400 w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">BLP Harian</h1>
                <p className="text-xs text-emerald-100 dark:text-emerald-300">Siswa: {user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-emerald-600 dark:hover:bg-emerald-800 rounded-full transition-colors"
                title={darkMode ? "Mode Terang" : "Mode Gelap"}
              >
                {darkMode ? <Sun size={22} /> : <Moon size={22} />}
              </button>
              <button 
                onClick={onLogout}
                className="p-2 hover:bg-emerald-600 dark:hover:bg-emerald-800 rounded-full transition-colors"
                title="Keluar"
              >
                <LogOut size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between transition-colors">
          <button 
            onClick={() => setSelectedDate(prev => subMonths(prev, view === 'monthly' ? 1 : 0))}
            className={cn(
              "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors",
              (view === 'daily' || view === 'settings') && "hidden"
            )}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="text-center flex-1">
            <h2 className="font-semibold text-lg">
              {view === 'settings' 
                ? "Pengaturan Aplikasi"
                : view === 'daily' 
                  ? format(selectedDate, 'EEEE, d MMMM yyyy', { locale: localeId })
                  : format(selectedDate, 'MMMM yyyy', { locale: localeId })
              }
            </h2>
            {view === 'daily' && isToday(selectedDate) && (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Hari Ini
              </span>
            )}
          </div>

          <button 
            onClick={() => setSelectedDate(prev => addMonths(prev, view === 'monthly' ? 1 : 0))}
            className={cn(
              "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors",
              (view === 'daily' || view === 'settings') && "hidden"
            )}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {view === 'settings' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Bell className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">Notifikasi Pengingat</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ingatkan saya setiap sore untuk isi BLP</p>
                  </div>
                </div>
                <button 
                  onClick={toggleReminders}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    remindersEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      remindersEnabled ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Download className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">Ekspor Data</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Unduh riwayat BLP Anda ke file JSON</p>
                  </div>
                </div>
                <button 
                  onClick={exportData}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  <Download size={16} />
                  Ekspor
                </button>
              </div>
            </section>
          </div>
        ) : view === 'daily' ? (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2 dark:text-slate-200">
                  <Trophy className="text-amber-500 w-5 h-5" />
                  Progress Hari Ini
                </h3>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {completedCount} / {totalActivities}
                </span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ type: "spring", bounce: 0.2 }}
                />
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between transition-colors">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Nilai Hari Ini:</span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-400">{Math.round(completionRate)}/100</span>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 italic text-center">
                "{completionRate === 100 ? 'Luar biasa! Pertahankan semangatmu!' : 'Ayo selesaikan amaliyah hari ini!'}"
              </p>
            </div>

            <div className="space-y-8 pb-10">
              {BLP_CATEGORIES.map((category) => (
                <section key={category.id} className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1 h-6 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 tracking-tight text-sm uppercase">
                      {category.name}
                    </h3>
                  </div>
                  
                  <div className="grid gap-3">
                    {category.activities.map((activity) => {
                      const isDone = currentRecord.completedActivities.includes(activity.id);
                      return (
                        <motion.button
                          key={activity.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleActivity(activity.id)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                            isDone 
                              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 shadow-sm" 
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700"
                          )}
                        >
                          <div className={cn(
                            "flex-shrink-0 transition-colors",
                            isDone ? "text-emerald-600 dark:text-emerald-400" : "text-slate-300 dark:text-slate-700"
                          )}>
                            {isDone ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              "font-medium leading-snug flex items-center gap-1.5",
                              isDone ? "text-emerald-900 dark:text-emerald-100" : "text-slate-700 dark:text-slate-300"
                            )}>
                              {activity.name}
                              {activity.id === QURAN_ACTIVITY_ID && <Mic size={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />}
                              {getSubmissionConfig(activity.id) && <PenLine size={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium uppercase tracking-wider">
                              Target: {activity.target}
                            </p>
                          </div>
                          {isDone && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                            >
                              <Star className="text-amber-400 fill-amber-400 w-4 h-4" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="bg-emerald-600 dark:bg-emerald-800 text-white rounded-2xl p-6 shadow-md transition-colors">
              <h3 className="text-sm font-medium text-emerald-100 dark:text-emerald-200 mb-1">Total Capaian Bulan Ini</h3>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">{Math.round(monthlyStats.rate)}%</span>
                <span className="text-emerald-200 dark:text-emerald-300 mb-1 text-sm">
                  ({monthlyStats.totalDone} / {monthlyStats.totalPossible} amaliyah)
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 transition-colors">
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <FileDown size={16} className="text-emerald-600 dark:text-emerald-400" />
                Rekap Bulanan
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadRekapPDF(user, selectedDate)}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                >
                  <FileDown size={14} /> PDF
                </button>
                <button
                  onClick={() => downloadRekapExcel(user, selectedDate)}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                >
                  <FileDown size={14} /> Excel
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 transition-colors">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`pad-${i}`} className="aspect-square" />
                ))}
                
                {daysInMonth.map((day) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const dayRecord = records[key];
                  const dayRate = dayRecord ? (dayRecord.completedActivities.length / totalActivities) : 0;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedDate(day);
                        setView('daily');
                      }}
                      className={cn(
                        "aspect-square rounded-xl flex items-center justify-center text-sm font-medium relative transition-all",
                        isSameDay(day, selectedDate) && "ring-2 ring-emerald-500 ring-offset-2",
                        isToday(day) ? "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
                      )}
                    >
                      {format(day, 'd')}
                      {dayRate > 0 && (
                        <div 
                          className="absolute bottom-1.5 w-1 h-1 rounded-full bg-emerald-500" 
                          style={{ transform: `scale(${1 + dayRate})` }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 transition-colors">
              <h4 className="font-bold mb-4 text-slate-700 dark:text-slate-200">Analisis Capaian</h4>
              <div className="space-y-4">
                {BLP_CATEGORIES.map(cat => {
                   let catTotal = 0;
                   let catPossible = daysInMonth.length * cat.activities.length;
                   daysInMonth.forEach(day => {
                     const key = format(day, 'yyyy-MM-dd');
                     const rec = records[key];
                     if (rec) {
                       catTotal += rec.completedActivities.filter(id => cat.activities.some(a => a.id === id)).length;
                     }
                   });
                   const catRate = catPossible > 0 ? (catTotal / catPossible) * 100 : 0;
                   
                   return (
                     <div key={cat.id}>
                        <div className="flex justify-between text-xs mb-1 font-medium">
                          <span className="text-slate-500 dark:text-slate-400">{cat.label}</span>
                          <span className="text-slate-700 dark:text-slate-200">{Math.round(catRate)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${catRate}%` }}
                          />
                        </div>
                     </div>
                   );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 h-16 flex items-center justify-around px-6 z-20 transition-colors">
        <button 
          onClick={() => setView('daily')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            view === 'daily' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-600"
          )}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Harian</span>
        </button>
        
        <button 
          onClick={() => setView('monthly')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            view === 'monthly' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-600"
          )}
        >
          <CalendarIcon size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Kalender</span>
        </button>

        <button 
          onClick={() => setView('settings')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            view === 'settings' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-600"
          )}
        >
          <Settings size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Pengaturan</span>
        </button>
      </nav>

      {activeModalActivityId === QURAN_ACTIVITY_ID && (
        <QuranReadingModal
          activityName={BLP_CATEGORIES.flatMap(c => c.activities).find(a => a.id === QURAN_ACTIVITY_ID)?.name || ''}
          onClose={() => setActiveModalActivityId(null)}
          onSubmit={(audioDataUrl) => {
            applySubmissionCompletion(QURAN_ACTIVITY_ID, {
              type: 'audio',
              content: audioDataUrl,
              recordedAt: new Date().toISOString(),
            });
          }}
        />
      )}

      {activeModalActivityId && activeModalActivityId !== QURAN_ACTIVITY_ID && getSubmissionConfig(activeModalActivityId) && (
        <TextSubmissionModal
          title={getSubmissionConfig(activeModalActivityId)!.title}
          activityName={BLP_CATEGORIES.flatMap(c => c.activities).find(a => a.id === activeModalActivityId)?.name || ''}
          placeholder={getSubmissionConfig(activeModalActivityId)!.placeholder}
          minWords={getSubmissionConfig(activeModalActivityId)!.minWords}
          initialValue={currentRecord.submissions?.[activeModalActivityId]?.content || ''}
          onClose={() => setActiveModalActivityId(null)}
          onSubmit={(text) => {
            applySubmissionCompletion(activeModalActivityId, {
              type: 'text',
              content: text,
              wordCount: text.trim().split(/\s+/).filter(Boolean).length,
              recordedAt: new Date().toISOString(),
            });
          }}
        />
      )}
    </div>
  );
}
