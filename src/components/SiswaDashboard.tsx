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
  ListChecks,
  Lock,
  FileDown,
  Bookmark
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { BLP_CATEGORIES, PERLENGKAPAN_SEKOLAH_ITEMS } from '../data/activities';
import { getSurah } from '../data/quran';
import { DailyRecord, UserProgress, ActivitySubmission, QuranBookmark, BlpPeriod } from '../types';
import TextSubmissionModal from './modals/TextSubmissionModal';
import ChecklistSubmissionModal from './modals/ChecklistSubmissionModal';
import QuranReadingModal from './modals/QuranReadingModal';
import ProfileModal from './modals/ProfileModal';
import { downloadRekapPDF, downloadRekapExcel } from '../utils/rekapExport';
import { SCHOOL_ONLY_ACTIVITY_IDS, isSchoolDay, getEffectiveTotalActivities, getEffectiveCompletedCount, isDateCountedForRecap } from '../utils/blpScoring';
import PageLayout, { type NavItem } from './layout/PageLayout';

const QURAN_ACTIVITY_ID = 'd5';
const BELAJAR_ACTIVITY_ID = 'rs1';
const EVALUASI_ACTIVITY_ID = 'rf3';
const PERLENGKAPAN_ACTIVITY_ID = 'rp1';
const RECIPROCITY_ACTIVITY_IDS = ['rp2', 'rp3', 'rp4'];

// Color config per BLP category — full class strings so Tailwind JIT picks them up
const CATEGORY_CONFIG: Record<string, { bar: string; doneBg: string; doneBorder: string; hover: string; check: string; label: string }> = {
  devout:          { bar: 'bg-emerald-500', doneBg: 'bg-emerald-50',  doneBorder: 'border-emerald-300', hover: 'hover:border-emerald-300', check: 'text-emerald-600', label: 'text-emerald-700' },
  resilience:      { bar: 'bg-amber-500',   doneBg: 'bg-amber-50',    doneBorder: 'border-amber-300',   hover: 'hover:border-amber-300',   check: 'text-amber-600',   label: 'text-amber-700'   },
  resourcefulness: { bar: 'bg-blue-500',    doneBg: 'bg-sky-50',      doneBorder: 'border-sky-300',     hover: 'hover:border-sky-300',     check: 'text-sky-600',     label: 'text-blue-700'    },
  reflectiveness:  { bar: 'bg-violet-500',  doneBg: 'bg-violet-50',   doneBorder: 'border-violet-300',  hover: 'hover:border-violet-300',  check: 'text-violet-600',  label: 'text-violet-700'  },
  reciprocity:     { bar: 'bg-rose-500',    doneBg: 'bg-rose-50',     doneBorder: 'border-rose-300',    hover: 'hover:border-rose-300',    check: 'text-rose-600',    label: 'text-rose-700'    },
};
const DEFAULT_CAT = { bar: 'bg-slate-400', doneBg: 'bg-slate-50', doneBorder: 'border-slate-300', hover: 'hover:border-slate-300', check: 'text-slate-600', label: 'text-slate-700' };

function getChecklistConfig(activityId: string): { title: string; items: typeof PERLENGKAPAN_SEKOLAH_ITEMS } | null {
  if (activityId === PERLENGKAPAN_ACTIVITY_ID) {
    return {
      title: 'Ceklis Perlengkapan Sekolah',
      items: PERLENGKAPAN_SEKOLAH_ITEMS,
    };
  }
  return null;
}

function getSubmissionConfig(activityId: string): { minChars?: number; placeholder: string; title: string } | null {
  if (activityId === BELAJAR_ACTIVITY_ID) {
    return {
      minChars: 100,
      title: 'Rangkuman Belajar Hari Ini',
      placeholder: 'Tuliskan rangkuman materi yang kamu pelajari hari ini...',
    };
  }
  if (activityId === EVALUASI_ACTIVITY_ID) {
    return {
      minChars: 100,
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
  blpPeriods: Record<string, BlpPeriod>;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  remindersEnabled: boolean;
  toggleReminders: () => void;
  onUpdateRecord: (dateKey: string, updatedRecord: DailyRecord) => void;
  onUpdateProfile: (photoUrl: string | null, bio: string) => Promise<void> | void;
  onUpdateQuranBookmark: (bookmark: QuranBookmark) => Promise<void> | void;
  onLogout: () => void;
}

export default function SiswaDashboard({ 
  user, 
  blpPeriods,
  darkMode, 
  setDarkMode, 
  remindersEnabled, 
  toggleReminders,
  onUpdateRecord,
  onUpdateProfile,
  onUpdateQuranBookmark,
  onLogout
}: SiswaDashboardProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [view, setView] = useState<'daily' | 'monthly' | 'settings'>('daily');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const records = user.records;
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const todayKey = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const isEditableDay = dateKey === todayKey;
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
    if (!isEditableDay) {
      alert('BLP hanya bisa diisi untuk hari ini. Tanggal yang sudah lewat atau belum tiba tidak dapat diubah.');
      return;
    }
    if (SCHOOL_ONLY_ACTIVITY_IDS.includes(activityId) && !isSchoolDay(selectedDate)) {
      alert('Kegiatan ini hanya berlaku pada hari sekolah (Senin-Jumat).');
      return;
    }

    const isDone = currentRecord.completedActivities.includes(activityId);

    if (!isDone && (activityId === QURAN_ACTIVITY_ID || getChecklistConfig(activityId) || getSubmissionConfig(activityId))) {
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

  const totalActivities = getEffectiveTotalActivities(selectedDate);
  const completedCount = getEffectiveCompletedCount(selectedDate, currentRecord.completedActivities);
  const completionRate = totalActivities > 0 ? (completedCount / totalActivities) * 100 : 0;

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const monthlyStats = useMemo(() => {
    let totalPossible = 0;
    let totalDone = 0;

    daysInMonth.forEach(day => {
      if (!isDateCountedForRecap(day, user.kelas, blpPeriods)) return;
      totalPossible += getEffectiveTotalActivities(day);
      const key = format(day, 'yyyy-MM-dd');
      if (records[key]) {
        totalDone += getEffectiveCompletedCount(day, records[key].completedActivities);
      }
    });

    return {
      totalDone,
      totalPossible,
      rate: totalPossible > 0 ? (totalDone / totalPossible) * 100 : 0
    };
  }, [daysInMonth, records, user.kelas, blpPeriods]);

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

  const navItems: NavItem[] = [
    { label: 'Harian',     icon: <LayoutDashboard size={16} />, onClick: () => setView('daily'),    isActive: view === 'daily' },
    { label: 'Kalender',   icon: <CalendarIcon size={16} />,   onClick: () => setView('monthly'),  isActive: view === 'monthly' },
    { label: 'Pengaturan', icon: <Settings size={16} />,       onClick: () => setView('settings'), isActive: view === 'settings' },
  ];

  const headerActions = (
    <>
      <button
        onClick={() => setShowProfileModal(true)}
        className="w-8 h-8 rounded-full overflow-hidden bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0"
        title={`Edit Profil — ${user.name}`}
      >
        {user.photoUrl
          ? <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
          : <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-0.5" />
        }
      </button>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="p-2 hover:bg-emerald-600 dark:hover:bg-emerald-800 rounded-full transition-colors"
        title={darkMode ? "Mode Terang" : "Mode Gelap"}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <button
        onClick={onLogout}
        className="p-2 hover:bg-emerald-600 dark:hover:bg-emerald-800 rounded-full transition-colors"
        title="Keluar"
      >
        <LogOut size={20} />
      </button>
    </>
  );

  return (
    <PageLayout navItems={navItems} actions={headerActions}>
        <main className="max-w-2xl mx-auto p-4 sm:p-5 space-y-6 pb-8">
        <div className="app-card p-4 flex items-center justify-between transition-colors">
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
            {view === 'daily' && !isEditableDay && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                <Lock size={10} />
                Terkunci · Hanya Lihat
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
            <section className="app-card p-5 sm:p-6 space-y-6">
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
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm shadow-emerald-200 dark:shadow-none"
                >
                  <Download size={16} />
                  Ekspor
                </button>
              </div>
            </section>
          </div>
        ) : view === 'daily' ? (
          <>
            <div className="app-card p-5 sm:p-6 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2 dark:text-slate-200">
                  <Trophy className="text-amber-500 w-5 h-5" />
                  Progress Hari Ini
                </h3>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {completedCount} / {totalActivities}
                </span>
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ type: "spring", bounce: 0.2 }}
                />
              </div>
              
              <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/25 dark:to-yellow-900/15 border border-amber-200 dark:border-amber-800/70 rounded-2xl flex items-center justify-between transition-colors">
                <div>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">⭐ Nilai Hari Ini</p>
                  <p className="text-xs text-amber-500 mt-0.5">{completionRate === 100 ? 'Luar biasa! Sempurna! 🎉' : 'Ayo selesaikan amaliyahmu!'}</p>
                </div>
                <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{Math.round(completionRate)}<span className="text-base font-bold opacity-60">/100</span></span>
              </div>
            </div>

            <div className="space-y-8 pb-10">
              {BLP_CATEGORIES.map((category) => {
                const cat = CATEGORY_CONFIG[category.id] ?? DEFAULT_CAT;
                return (
                <section key={category.id} className="space-y-3">
                  <div className="flex items-center gap-3 px-1">
                    <div className={cn("w-2 h-7 rounded-full", cat.bar)} />
                    <div>
                      <h3 className={cn("font-extrabold tracking-tight text-sm uppercase", cat.label)}>
                        {category.label}
                      </h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{category.name.split('(')[1]?.replace(')', '') ?? ''}</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-2.5">
                    {category.activities.map((activity) => {
                      const isDone = currentRecord.completedActivities.includes(activity.id);
                      const isSchoolOnly = SCHOOL_ONLY_ACTIVITY_IDS.includes(activity.id) && !isSchoolDay(selectedDate);
                      return (
                        <motion.button
                          key={activity.id}
                          whileTap={isEditableDay && !isSchoolOnly ? { scale: 0.98 } : undefined}
                          onClick={() => toggleActivity(activity.id)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left shadow-sm",
                            !isEditableDay && "opacity-60 cursor-not-allowed",
                            isSchoolOnly && "opacity-50 cursor-not-allowed",
                            isDone
                              ? cn(cat.doneBg, cat.doneBorder)
                              : cn("bg-white/90 dark:bg-slate-900/90 border-slate-100 dark:border-slate-800", cat.hover)
                          )}
                        >
                          <div className={cn(
                            "flex-shrink-0 transition-colors",
                            isDone ? cat.check : "text-slate-300 dark:text-slate-700"
                          )}>
                            {isDone ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              "font-semibold leading-snug flex items-center gap-1.5",
                              isDone ? "text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"
                            )}>
                              {activity.name}
                              {activity.id === QURAN_ACTIVITY_ID && <Mic size={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />}
                              {getChecklistConfig(activity.id) && <ListChecks size={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />}
                              {getSubmissionConfig(activity.id) && <PenLine size={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium uppercase tracking-wider">
                              Target: {activity.target}
                            </p>
                            {isSchoolOnly && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                                Tidak berlaku di akhir pekan (bukan hari sekolah)
                              </p>
                            )}
                            {activity.id === QURAN_ACTIVITY_ID && user.quranBookmark && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium flex items-center gap-1">
                                <Bookmark size={10} />
                                Penanda: {user.quranBookmark.surahName}
                                {user.quranBookmark.halaman ? ` — Hal. ${user.quranBookmark.halaman}` : ` ayat ${user.quranBookmark.ayat}`}
                              </p>
                            )}
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
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white rounded-2xl p-6 shadow-lg shadow-emerald-900/10 transition-colors">
              <h3 className="text-sm font-medium text-emerald-100 dark:text-emerald-200 mb-1">Total Capaian Bulan Ini</h3>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">{Math.round(monthlyStats.rate)}%</span>
                <span className="text-emerald-200 dark:text-emerald-300 mb-1 text-sm">
                  ({monthlyStats.totalDone} / {monthlyStats.totalPossible} amaliyah)
                </span>
              </div>
            </div>

             <div className="app-card p-4 transition-colors">
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <FileDown size={16} className="text-emerald-600 dark:text-emerald-400" />
                Rekap Bulanan
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadRekapPDF(user, selectedDate)}
                   className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
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

             <div className="app-card p-4 transition-colors">
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
                  const dayEffectiveTotal = getEffectiveTotalActivities(day);
                  const dayRate = dayRecord ? (getEffectiveCompletedCount(day, dayRecord.completedActivities) / dayEffectiveTotal) : 0;
                  
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

             <div className="app-card p-5 sm:p-6 transition-colors">
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

      {activeModalActivityId === QURAN_ACTIVITY_ID && (
        <QuranReadingModal
          activityName={BLP_CATEGORIES.flatMap(c => c.activities).find(a => a.id === QURAN_ACTIVITY_ID)?.name || ''}
          bookmark={user.quranBookmark}
          onClose={() => setActiveModalActivityId(null)}
          onSubmit={(audioDataUrl, quranRef) => {
            applySubmissionCompletion(QURAN_ACTIVITY_ID, {
              type: 'audio',
              content: audioDataUrl,
              quranRef,
              recordedAt: new Date().toISOString(),
            });
            const surah = getSurah(quranRef.surahNo);
            const isLastAyat = surah ? quranRef.ayatTo >= surah.ayatCount : false;
            const nextBookmark: QuranBookmark = quranRef.halaman
              ? {
                  surahNo: quranRef.surahNo,
                  surahName: quranRef.surahName,
                  ayat: quranRef.ayatTo,
                  halaman: Math.min(604, quranRef.halaman + 1),
                  updatedAt: new Date().toISOString(),
                }
              : isLastAyat && surah && surah.no < 114
              ? {
                  surahNo: surah.no + 1,
                  surahName: getSurah(surah.no + 1)?.nameLatin || '',
                  ayat: 1,
                  halaman: null,
                  updatedAt: new Date().toISOString(),
                }
              : {
                  surahNo: quranRef.surahNo,
                  surahName: quranRef.surahName,
                  ayat: quranRef.ayatTo + 1,
                  halaman: null,
                  updatedAt: new Date().toISOString(),
                };
            onUpdateQuranBookmark(nextBookmark);
          }}
        />
      )}

      {activeModalActivityId && activeModalActivityId !== QURAN_ACTIVITY_ID && getChecklistConfig(activeModalActivityId) && (
        <ChecklistSubmissionModal
          title={getChecklistConfig(activeModalActivityId)!.title}
          activityName={BLP_CATEGORIES.flatMap(c => c.activities).find(a => a.id === activeModalActivityId)?.name || ''}
          items={getChecklistConfig(activeModalActivityId)!.items}
          initialValues={currentRecord.submissions?.[activeModalActivityId]?.items}
          onClose={() => setActiveModalActivityId(null)}
          onSubmit={(items) => {
            applySubmissionCompletion(activeModalActivityId, {
              type: 'checklist',
              items,
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
          minChars={getSubmissionConfig(activeModalActivityId)!.minChars}
          initialValue={currentRecord.submissions?.[activeModalActivityId]?.content || ''}
          onClose={() => setActiveModalActivityId(null)}
          onSubmit={(text) => {
            applySubmissionCompletion(activeModalActivityId, {
              type: 'text',
              content: text,
              charCount: text.trim().length,
              recordedAt: new Date().toISOString(),
            });
          }}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          name={user.name}
          currentPhotoUrl={user.photoUrl}
          currentBio={user.bio}
          onClose={() => setShowProfileModal(false)}
          onSave={(photoUrl, bio) => onUpdateProfile(photoUrl, bio)}
        />
      )}
    </PageLayout>
  );
}
