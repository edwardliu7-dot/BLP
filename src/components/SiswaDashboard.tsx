import { useState, useMemo, useEffect, useCallback } from 'react';
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
  LogOut,
  Mic,
  PenLine,
  ListChecks,
  Lock,
  FileDown,
  Bookmark,
  Heart,
  HeartOff,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { BLP_CATEGORIES, PERLENGKAPAN_SEKOLAH_ITEMS } from '../data/activities';
import { getSurah } from '../data/quran';
import { DailyRecord, UserProgress, ActivitySubmission, QuranBookmark, BlpPeriod, HaidPeriod } from '../types';
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
  remindersEnabled: boolean;
  toggleReminders: () => void;
  onUpdateRecord: (dateKey: string, updatedRecord: DailyRecord) => void;
  onUpdateProfile: (photoUrl: string | null, bio: string) => Promise<void> | void;
  onUpdateQuranBookmark: (bookmark: QuranBookmark) => Promise<void> | void;
  onStartHaid: () => Promise<void>;
  onEndHaid: () => Promise<void>;
  onLogout: () => void;
}

export default function SiswaDashboard({ 
  user, 
  blpPeriods,
  remindersEnabled, 
  toggleReminders,
  onUpdateRecord,
  onUpdateProfile,
  onUpdateQuranBookmark,
  onStartHaid,
  onEndHaid,
  onLogout
}: SiswaDashboardProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [view, setView] = useState<'daily' | 'monthly' | 'settings'>('daily');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [haidLoading, setHaidLoading] = useState(false);
  const [haidError, setHaidError] = useState<string | null>(null);

  // ── Lazy-loading state ──────────────────────────────────────────────────────
  // localRecords: full DailyRecord objects for dates the user has opened.
  //   Starts empty — today's record is fetched on mount, past records only
  //   when the user taps that date in the calendar.
  const [localRecords, setLocalRecords] = useState<Record<string, DailyRecord>>({});

  // calendarDates: set of date strings (YYYY-MM-DD) that have ≥1 activity checked.
  //   Used only for calendar dot rendering — no activity details needed here.
  const [calendarDates, setCalendarDates] = useState<Set<string>>(new Set());
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());

  // todayLoading: true while today's BLP record is being fetched on mount.
  const [todayLoading, setTodayLoading] = useState(true);
  // dateLoading: true while a past date's full record is being fetched on tap.
  const [dateLoading, setDateLoading] = useState(false);
  // ────────────────────────────────────────────────────────────────────────────

  const activeHaid: HaidPeriod | undefined = (user.haidPeriods || []).find(p => p.endDate === null);
  const isPerempuan = user.jenisKelamin === 'P';

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const todayKey = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const isEditableDay = dateKey === todayKey;
  const [activeModalActivityId, setActiveModalActivityId] = useState<string | null>(null);

  // currentRecord: uses localRecords for any date that has been loaded.
  // Starts empty for past dates until the user taps the date.
  const currentRecord: DailyRecord = useMemo(() => {
    return localRecords[dateKey] ?? { date: dateKey, completedActivities: [] };
  }, [dateKey, localRecords]);

  // Internal update handler — keeps localRecords + calendarDates in sync
  // before propagating to parent (which handles the server PUT).
  const handleUpdateRecord = useCallback((dk: string, updated: DailyRecord) => {
    setLocalRecords(prev => ({ ...prev, [dk]: updated }));
    setCalendarDates(prev => {
      const next = new Set(prev);
      if (updated.completedActivities.length > 0) next.add(dk);
      else next.delete(dk);
      return next;
    });
    onUpdateRecord(dk, updated);
  }, [onUpdateRecord]);

  // Fetch today's full record on mount (once — keeps login instant, loads data
  // only when the student actually opens the app).
  useEffect(() => {
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
    setTodayLoading(true);
    fetch(`/api/me/record/${today}`)
      .then(r => r.ok ? r.json() : null)
      .then((rec: DailyRecord | null) => {
        if (rec) {
          setLocalRecords(prev => ({ ...prev, [today]: rec }));
          if (rec.completedActivities.length > 0) {
            setCalendarDates(prev => new Set([...prev, today]));
          }
        }
      })
      .catch(() => { /* non-critical */ })
      .finally(() => setTodayLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load the full record for a past date on demand.
  // Skips the fetch if the record is already in localRecords.
  const loadDateRecord = useCallback(async (dateStr: string) => {
    if (localRecords[dateStr] !== undefined) return; // already loaded
    setDateLoading(true);
    try {
      const res = await fetch(`/api/me/record/${dateStr}`);
      if (!res.ok) return;
      const rec: DailyRecord = await res.json();
      setLocalRecords(prev => ({ ...prev, [dateStr]: rec }));
      if (rec.completedActivities.length > 0) {
        setCalendarDates(prev => new Set([...prev, dateStr]));
      }
    } catch { /* non-critical */ }
    finally { setDateLoading(false); }
  }, [localRecords]);

  // Fetch one month's calendar presence data (which dates have ≥1 activity).
  const loadCalendarMonth = useCallback(async (year: number, month: number) => {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (loadedMonths.has(key)) return;
    setCalendarLoading(true);
    try {
      const res = await fetch(`/api/me/calendar/${year}/${month}`);
      if (!res.ok) return;
      const { dates }: { dates: string[] } = await res.json();
      setCalendarDates(prev => {
        const next = new Set(prev);
        for (const d of dates) next.add(d);
        return next;
      });
      setLoadedMonths(prev => new Set([...prev, key]));
    } catch { /* non-critical — dots just won't show */ }
    finally { setCalendarLoading(false); }
  }, [loadedMonths]);

  // Auto-fetch calendar presence data when switching to monthly view or navigating months.
  useEffect(() => {
    if (view === 'monthly') {
      loadCalendarMonth(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
    }
  }, [view, selectedDate.getFullYear(), selectedDate.getMonth()]);  // eslint-disable-line react-hooks/exhaustive-deps

  const applySubmissionCompletion = (activityId: string, submission: ActivitySubmission) => {
    const updatedCompleted = currentRecord.completedActivities.includes(activityId)
      ? currentRecord.completedActivities
      : [...currentRecord.completedActivities, activityId];

    handleUpdateRecord(dateKey, {
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

    handleUpdateRecord(dateKey, {
      ...currentRecord,
      completedActivities: updatedCompleted,
      submissions: updatedSubmissions,
    });
  };

  const handleToggleHaid = async () => {
    setHaidLoading(true);
    setHaidError(null);
    try {
      if (activeHaid) {
        await onEndHaid();
      } else {
        await onStartHaid();
      }
    } catch (e: unknown) {
      setHaidError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setHaidLoading(false);
    }
  };

  const totalActivities = getEffectiveTotalActivities(selectedDate);
  const completedCount = getEffectiveCompletedCount(selectedDate, currentRecord.completedActivities);
  const completionRate = totalActivities > 0 ? (completedCount / totalActivities) * 100 : 0;

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Helper: get completedActivities for any date from localRecords (loaded on demand).
  const getCompletedForDate = useCallback((dk: string): string[] => {
    return localRecords[dk]?.completedActivities ?? [];
  }, [localRecords]);

  // Monthly stats: count days that have any record (from calendarDates or localRecords).
  // This works without full activity details — just presence per day.
  const monthlyStats = useMemo(() => {
    let totalDays = 0;
    let filledDays = 0;

    daysInMonth.forEach(day => {
      if (!isDateCountedForRecap(day, user.kelas, blpPeriods)) return;
      totalDays++;
      const key = format(day, 'yyyy-MM-dd');
      const hasRecord = calendarDates.has(key) || (localRecords[key]?.completedActivities?.length ?? 0) > 0;
      if (hasRecord) filledDays++;
    });

    return {
      filledDays,
      totalDays,
      rate: totalDays > 0 ? (filledDays / totalDays) * 100 : 0
    };
  }, [daysInMonth, calendarDates, localRecords, user.kelas, blpPeriods]);

  const exportData = () => {
    // Export only records that have been loaded (today + any tapped past dates).
    const data = {
      name: user.name,
      records: localRecords,
      exportedAt: new Date().toISOString(),
      note: 'Data mencakup hari ini dan tanggal-tanggal yang telah dibuka.',
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

            {/* ── Haid section: female students + unknown gender ── */}
            {user.jenisKelamin !== 'L' && (
              <section className="app-card p-5 sm:p-6 space-y-4 transition-colors">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                    <Heart className="text-rose-500 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">Status Haid</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Selama haid, poin Shalat Berjamaah dan Al-Qur'an otomatis terhitung ✓
                    </p>
                  </div>
                </div>

                <div className={cn(
                  "rounded-xl border-2 p-4 flex items-center justify-between gap-4",
                  activeHaid
                    ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                )}>
                  <div>
                    {activeHaid ? (
                      <>
                        <p className="font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                          <Heart size={14} className="fill-rose-500 text-rose-500" />
                          Sedang haid
                        </p>
                        <p className="text-xs text-rose-500 dark:text-rose-400 mt-0.5">
                          Mulai: {format(new Date(activeHaid.startDate), 'd MMMM yyyy', { locale: localeId })}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <HeartOff size={14} />
                          Tidak sedang haid
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          Tekan tombol saat haid dimulai
                        </p>
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleToggleHaid}
                    disabled={haidLoading}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-bold transition-colors shrink-0 disabled:opacity-60",
                      activeHaid
                        ? "bg-rose-500 hover:bg-rose-600 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    )}
                  >
                    {haidLoading ? '...' : activeHaid ? 'Selesai Haid' : 'Mulai Haid'}
                  </button>
                </div>

                {haidError && (
                  <p className="text-xs text-red-600 dark:text-red-400 px-1">{haidError}</p>
                )}

                {/* Haid history (last 6 periods) */}
                {(user.haidPeriods || []).filter(p => p.endDate !== null).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Riwayat Haid</p>
                    <div className="space-y-1.5">
                      {(user.haidPeriods || [])
                        .filter(p => p.endDate !== null)
                        .slice(0, 6)
                        .map(p => {
                          const start = new Date(p.startDate);
                          const end = new Date(p.endDate!);
                          const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
                          return (
                            <div key={p.id} className="flex justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2">
                              <span>{format(start, 'd MMM', { locale: localeId })} – {format(end, 'd MMM yyyy', { locale: localeId })}</span>
                              <span className="font-medium">{days} hari</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        ) : view === 'daily' ? (
          <>
            {/* ── Loading skeleton — shown while today's or a past date's record is being fetched ── */}
            {(todayLoading || dateLoading) && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Hero card skeleton */}
                <div className="bg-gradient-to-r from-emerald-700/80 via-emerald-600/80 to-teal-600/80 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-center gap-5 sm:justify-between">
                  <div className="flex-1 space-y-3 w-full">
                    <div className="h-3 w-40 bg-white/20 rounded-full animate-pulse" />
                    <div className="h-10 w-20 bg-white/25 rounded-xl animate-pulse" />
                    <div className="h-3 w-32 bg-white/15 rounded-full animate-pulse" />
                    <div className="flex gap-1 mt-2">
                      {[1,2,3,4,5].map(i => <div key={i} className="w-4 h-4 bg-white/20 rounded-full animate-pulse" />)}
                    </div>
                    <div className="h-2 w-full max-w-xs bg-white/15 rounded-full animate-pulse" />
                  </div>
                  <div className="w-24 h-24 bg-white/15 rounded-full animate-pulse shrink-0" />
                </div>
                {/* Activity skeleton rows */}
                {[1, 2, 3].map(section => (
                  <div key={section} className="app-card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                        <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                      </div>
                      <div className="h-3 w-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                    </div>
                    <div className="p-3 grid gap-2">
                      {[1, 2, 3].map(row => (
                        <div key={row} className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" style={{ width: `${55 + row * 15}%` }} />
                            <div className="h-2 w-24 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {/* Subtle label */}
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="relative w-4 h-4">
                    <svg viewBox="0 0 16 16" className="w-4 h-4 animate-spin text-emerald-500" style={{ animationDuration: '1s' }}>
                      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
                      <path d="M 8 2 A 6 6 0 0 1 14 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {dateLoading ? 'Memuat data tanggal ini…' : 'Memuat BLP hari ini…'}
                  </span>
                </div>
              </div>
            )}

            {/* ── Actual daily content — hidden while loading ── */}
            {!(todayLoading || dateLoading) && <>
            {/* ── Hero Score Card ── */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg shadow-emerald-900/15 flex flex-col sm:flex-row items-center gap-5 sm:justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-100 uppercase tracking-widest mb-1">
                  {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: localeId })}
                  {isToday(selectedDate) && <span className="ml-2 bg-amber-400/30 text-amber-200 px-2 py-0.5 rounded-full text-[10px]">Hari Ini</span>}
                  {!isEditableDay && <span className="ml-2 bg-white/10 text-white/70 px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1"><Lock size={8} /> Terkunci</span>}
                </p>
                <div className="text-5xl font-extrabold tracking-tight">{Math.round(completionRate)}</div>
                <div className="text-sm text-emerald-100 mt-0.5">Nilai BLP Hari Ini</div>
                <div className="flex items-center gap-1 mt-3">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={cn('w-4 h-4', s <= Math.ceil(completionRate / 20) ? 'fill-amber-300 text-amber-300' : 'text-white/20')} />
                  ))}
                  <span className="text-xs text-emerald-100 ml-1">
                    {completionRate === 100 ? 'Luar biasa! Sempurna! 🎉' : completionRate >= 60 ? 'Teruskan semangatmu!' : 'Ayo selesaikan amaliyahmu!'}
                  </span>
                </div>
                {/* Linear progress bar */}
                <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden w-full max-w-xs">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ type: 'spring', bounce: 0.2 }}
                  />
                </div>
                <p className="text-xs text-emerald-100 mt-1">{completedCount} / {totalActivities} aktivitas selesai</p>
              </div>

              {/* Circular ring */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="9" />
                    <circle
                      cx="48" cy="48" r="38" fill="none"
                      stroke="white" strokeWidth="9"
                      strokeDasharray={`${2 * Math.PI * 38 * completionRate / 100} ${2 * Math.PI * 38}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.6s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-extrabold leading-none">{Math.round(completionRate)}%</span>
                    <span className="text-[10px] text-emerald-100">selesai</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Category Sections ── */}
            <div className="space-y-4 pb-10">
              {BLP_CATEGORIES.map((category) => {
                const cat = CATEGORY_CONFIG[category.id] ?? DEFAULT_CAT;
                const catDone = category.activities.filter(a => currentRecord.completedActivities.includes(a.id)).length;
                const catPct = Math.round((catDone / category.activities.length) * 100);
                return (
                <section key={category.id} className="app-card overflow-hidden">
                  {/* Gradient header bar */}
                  <div className={cn("flex items-center justify-between px-4 py-2.5", cat.doneBg, "border-b", cat.doneBorder)}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-5 rounded-full", cat.bar)} />
                      <div>
                        <h3 className={cn("font-extrabold tracking-tight text-sm uppercase", cat.label)}>
                          {category.label}
                        </h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{category.name.split('(')[1]?.replace(')', '') ?? ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-bold", cat.label)}>{catDone}/{category.activities.length}</span>
                      <div className="w-16 h-1.5 bg-slate-200/70 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", cat.bar)} style={{ width: `${catPct}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 grid gap-2">
                    {category.activities.map((activity) => {
                      const isDone = currentRecord.completedActivities.includes(activity.id);
                      const isSchoolOnly = SCHOOL_ONLY_ACTIVITY_IDS.includes(activity.id) && !isSchoolDay(selectedDate);
                      return (
                        <motion.button
                          key={activity.id}
                          whileTap={isEditableDay && !isSchoolOnly ? { scale: 0.98 } : undefined}
                          onClick={() => toggleActivity(activity.id)}
                          className={cn(
                            "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left",
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
                            {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-semibold leading-snug flex items-center gap-1.5 flex-wrap",
                              isDone ? "text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"
                            )}>
                              {activity.name}
                              {activity.id === QURAN_ACTIVITY_ID && <Mic size={12} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />}
                              {getChecklistConfig(activity.id) && <ListChecks size={12} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />}
                              {getSubmissionConfig(activity.id) && <PenLine size={12} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />}
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
                              className="flex-shrink-0"
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
            </>}
          </>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white rounded-2xl p-6 shadow-lg shadow-emerald-900/10 transition-colors">
              <h3 className="text-sm font-medium text-emerald-100 dark:text-emerald-200 mb-1">Hari Terisi Bulan Ini</h3>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">{Math.round(monthlyStats.rate)}%</span>
                <span className="text-emerald-200 dark:text-emerald-300 mb-1 text-sm">
                  ({monthlyStats.filledDays} / {monthlyStats.totalDays} hari)
                </span>
              </div>
              {calendarLoading && (
                <p className="text-[11px] text-emerald-200/70 mt-2 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Memuat data kalender…
                </p>
              )}
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

             {/* Calendar grid — dots indicate filled days (lazy-loaded per month) */}
             <div className="app-card p-4 transition-colors relative overflow-hidden">
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
                  // Dot shows if this date has any filled activity (presence check only)
                  const hasFilled = calendarDates.has(key) || (localRecords[key]?.completedActivities?.length ?? 0) > 0;
                  
                  return (
                    <button
                      key={key}
                      onClick={async () => {
                        const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
                        if (key !== today) {
                          await loadDateRecord(key);
                        }
                        setSelectedDate(day);
                        setView('daily');
                      }}
                      className={cn(
                        "aspect-square rounded-xl flex items-center justify-center text-sm font-medium relative transition-all active:scale-95",
                        isSameDay(day, selectedDate) && "ring-2 ring-emerald-500 ring-offset-2",
                        isToday(day)
                          ? "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold"
                          : "text-slate-600 dark:text-slate-400"
                      )}
                    >
                      {format(day, 'd')}
                      {hasFilled && (
                        <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Loading overlay — shown while calendar month is being fetched */}
              {calendarLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-white/75 dark:bg-slate-950/75 backdrop-blur-[2px] rounded-xl z-10">
                  <div className="relative w-9 h-9">
                    <svg viewBox="0 0 36 36" className="w-9 h-9 animate-spin" style={{ animationDuration: '0.9s' }}>
                      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" className="text-emerald-600" />
                      <path d="M 18 4 A 14 14 0 0 1 32 18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-emerald-500" />
                    </svg>
                  </div>
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 tracking-wide">Memuat kalender…</p>
                </div>
              )}
            </div>

             {/* Hint to tap a date */}
             <div className="flex items-center gap-2 px-1">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
               <p className="text-[11px] text-slate-400 dark:text-slate-500">
                 Titik hijau = BLP sudah diisi · Ketuk tanggal untuk lihat detail
               </p>
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
