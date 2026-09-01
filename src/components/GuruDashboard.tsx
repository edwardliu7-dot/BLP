import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  Users, 
  Presentation, 
  CheckCircle2, 
  Circle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Calculator,
  MessageCircle,
  Mail,
  Trash2,
  Eye,
  Mic,
  PenLine,
  ListChecks,
  Settings2,
  Search,
  Bell,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Heart,
  AlertTriangle,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, addDays, subDays, startOfDay, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { getBlpCategoriesForDate, PERLENGKAPAN_SEKOLAH_ITEMS } from '../data/activities';
import { SystemData, DailyRecord, AuthState, ActivitySubmission, HaidPeriod } from '../types';
import { downloadRekapPDF, downloadRekapExcel } from '../utils/rekapExport';
import { getEffectiveTotalActivities, getEffectiveCompletedCount, isDateCountedForRecap, getBlpPeriodKeyForDate } from '../utils/blpScoring';
import PageLayout, { type NavItem } from './layout/PageLayout';
import { FileDown } from 'lucide-react';
import ProfileModal from './modals/ProfileModal';
import ConfirmModal from './modals/ConfirmModal';
import GuruReviewSubmissionModal from './modals/GuruReviewSubmissionModal';
import BlpPeriodModal from './modals/BlpPeriodModal';

const QURAN_ACTIVITY_ID = 'd5';
const CURRENT_QURAN_ACTIVITY_ID = 'v20260901-rs4';
const CHECKLIST_ACTIVITY_ID = 'rp1';

function isQuranActivity(activityId: string): boolean {
  return activityId === QURAN_ACTIVITY_ID || activityId === CURRENT_QURAN_ACTIVITY_ID;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Module-level cache so each student's photo is fetched at most once per session.
const _photoCache = new Map<string, string | null>();
const _photoInflight = new Map<string, Promise<string | null>>();

function fetchStudentPhoto(studentId: string): Promise<string | null> {
  if (_photoCache.has(studentId)) return Promise.resolve(_photoCache.get(studentId)!);
  if (_photoInflight.has(studentId)) return _photoInflight.get(studentId)!;
  const p = fetch(`/api/students/${studentId}/photo`)
    .then(r => r.ok ? r.json() : { photoUrl: null })
    .then((data: { photoUrl: string | null }) => {
      const url = data.photoUrl || null;
      _photoCache.set(studentId, url);
      _photoInflight.delete(studentId);
      return url;
    })
    .catch(() => {
      _photoCache.set(studentId, null);
      _photoInflight.delete(studentId);
      return null;
    });
  _photoInflight.set(studentId, p);
  return p;
}

// Reusable student avatar: shows photo if available, otherwise colourful initials.
// Photos are fetched lazily on first render and cached for the session.
function StudentAvatar({ name, studentId, size = 'md' }: { name: string; studentId?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(() =>
    studentId && _photoCache.has(studentId) ? _photoCache.get(studentId)! : null
  );

  useEffect(() => {
    if (!studentId) return;
    if (_photoCache.has(studentId)) {
      setPhotoUrl(_photoCache.get(studentId)!);
      return;
    }
    let cancelled = false;
    fetchStudentPhoto(studentId).then(url => {
      if (!cancelled) setPhotoUrl(url);
    });
    return () => { cancelled = true; };
  }, [studentId]);

  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const dims = size === 'sm' ? 'w-8 h-8 text-[10px]' : size === 'lg' ? 'w-14 h-14 text-base' : size === 'xl' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-xs';
  return photoUrl
    ? <img src={photoUrl} alt={name} className={cn(dims, 'rounded-full object-cover flex-shrink-0')} />
    : (
      <div className={cn(dims, 'rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0')}>
        {initials}
      </div>
    );
}

interface GuruDashboardProps {
  systemData: SystemData;
  auth: AuthState;
  onLogout: () => void;
  onUpdateProfile: (photoUrl: string | null, bio: string) => Promise<void> | void;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onReviewSubmission: (studentId: string, dateKey: string, activityId: string) => Promise<void>;
  onSaveBlpPeriod: (kelas: string, year: number, month: number, startDay: number, endDay: number) => Promise<void>;
}

function scoreColor(s: number) {
  if (s >= 85) return 'text-emerald-600';
  if (s >= 70) return 'text-amber-500';
  return 'text-red-500';
}
function scoreBg(s: number) {
  if (s >= 85) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (s >= 70) return 'bg-amber-50 border-amber-200 text-amber-700';
  return 'bg-red-50 border-red-200 text-red-600';
}

// ── Haid cycle abnormality analysis ─────────────────────────────────────────
interface HaidWarning {
  level: 'info' | 'warning' | 'alert';
  message: string;
}

function analyzeHaidCycles(periods: HaidPeriod[]): HaidWarning[] {
  const warnings: HaidWarning[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Ongoing period checks
  const ongoing = periods.find(p => p.endDate === null);
  if (ongoing) {
    const start = new Date(ongoing.startDate);
    start.setHours(0, 0, 0, 0);
    const days = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
    if (days > 15) {
      warnings.push({
        level: 'alert',
        message: `Haid sudah berlangsung ${days} hari sejak ${ongoing.startDate} — kemungkinan tidak wajar atau siswa belum menekan "Selesai Haid".`,
      });
    }
  }

  // Completed period duration checks
  for (const p of periods.filter(p => p.endDate !== null)) {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate!);
    const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    if (days > 15) {
      warnings.push({
        level: 'alert',
        message: `Periode ${p.startDate} s/d ${p.endDate} berlangsung ${days} hari (wajar maks. 15 hari) — perlu verifikasi.`,
      });
    }
  }

  // Cycle length (interval between consecutive start dates)
  const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].startDate);
    const curr = new Date(sorted[i].startDate);
    const cycle = Math.floor((curr.getTime() - prev.getTime()) / 86400000);
    if (cycle < 21) {
      warnings.push({
        level: 'alert',
        message: `Siklus terlalu pendek: ${cycle} hari antara ${sorted[i - 1].startDate} dan ${sorted[i].startDate} (wajar min. 21 hari) — kemungkinan siswa mencatat ulang haid lebih awal.`,
      });
    } else if (cycle > 35) {
      warnings.push({
        level: 'warning',
        message: `Siklus panjang: ${cycle} hari antara ${sorted[i - 1].startDate} dan ${sorted[i].startDate} (wajar maks. 35 hari) — mungkin perlu perhatian kesehatan.`,
      });
    }
  }

  return warnings;
}

export default function GuruDashboard({ systemData, auth, onLogout, onUpdateProfile, onDeleteStudent, onReviewSubmission, onSaveBlpPeriod }: GuruDashboardProps) {
  const [view, setView] = useState<'list' | 'detail' | 'presentation' | 'recap' | 'haid'>('list');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [reviewingActivityId, setReviewingActivityId] = useState<string | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const guru = auth.userId ? systemData.gurus[auth.userId] : null;

  const allowedClasses = auth.kelasWali || [];
  const allStudents = Object.values(systemData.students)
    .filter(s => allowedClasses.includes(s.kelas))
    .sort((a, b) => {
      if (a.kelas !== b.kelas) return a.kelas.localeCompare(b.kelas, 'id');
      return a.name.localeCompare(b.name, 'id');
    });

  const students = useMemo(() => {
    if (!searchQuery.trim()) return allStudents;
    const q = searchQuery.toLowerCase();
    return allStudents.filter(s => s.name.toLowerCase().includes(q) || s.kelas.toLowerCase().includes(q));
  }, [allStudents, searchQuery]);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const categories = useMemo(() => getBlpCategoriesForDate(selectedDate), [selectedDate]);
  const totalActivities = getEffectiveTotalActivities(selectedDate);

  const selectedStudent = selectedStudentId ? systemData.students[selectedStudentId] : null;
  const currentRecord = selectedStudent?.records[dateKey] || { date: dateKey, completedActivities: [] };
  const autoScore = Math.round((getEffectiveCompletedCount(selectedDate, currentRecord.completedActivities, selectedStudent?.haidPeriods) / totalActivities) * 100);

  // Compute stats for today
  const todayStats = useMemo(() => {
    const d = selectedDate;
    const dKey = format(d, 'yyyy-MM-dd');
    const dTotal = getEffectiveTotalActivities(d);
    let filled = 0;
    let totalScore = 0;
    allStudents.forEach(s => {
      const r = s.records[dKey];
      const count = r ? getEffectiveCompletedCount(d, r.completedActivities, selectedStudent?.haidPeriods) : 0;
      if (count > 0) filled++;
      totalScore += Math.round((count / dTotal) * 100);
    });
    const notFilled = allStudents.length - filled;
    const avg = allStudents.length > 0 ? (totalScore / allStudents.length).toFixed(1) : '0';
    return { total: allStudents.length, filled, notFilled, avg };
  }, [allStudents, selectedDate]);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setView('detail');
  };

  const navItems: NavItem[] = [
    { label: 'Daftar Siswa', icon: <Users size={16} />,      onClick: () => setView('list'),  isActive: view === 'list' || view === 'detail' || view === 'presentation' },
    { label: 'Rekap Nilai',  icon: <BarChart3 size={16} />,  onClick: () => setView('recap'), isActive: view === 'recap' },
    { label: 'Haid Siswi',   icon: <Heart size={16} />,      onClick: () => setView('haid'),  isActive: view === 'haid' },
  ];

  const headerActions = (
    <>
      <button
        onClick={() => setShowProfileModal(true)}
        className="w-8 h-8 rounded-full overflow-hidden bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0"
        title="Edit Profil"
      >
        {guru?.photoUrl
          ? <img src={guru.photoUrl} alt={guru.name} className="w-full h-full object-cover" />
          : <Users size={16} className="text-white" />
        }
      </button>
      <button
        onClick={onLogout}
        className="p-2 hover:bg-emerald-600 rounded-full transition-colors"
        title="Keluar"
      >
        <LogOut size={20} />
      </button>
    </>
  );

  const renderDateSelector = () => (
    <div className="app-card p-4 flex items-center justify-between mb-6">
      <button 
        onClick={() => setSelectedDate(prev => subMonths(prev, view === 'recap' ? 1 : 0))}
        className={cn("p-2 hover:bg-slate-100 rounded-full transition-colors", view !== 'recap' && "hidden")}
      >
        <ChevronLeft size={20} />
      </button>
      <button 
        onClick={() => setSelectedDate(prev => subDays(prev, 1))}
        className={cn("p-2 hover:bg-slate-100 rounded-full transition-colors", view === 'recap' && "hidden")}
      >
        <ChevronLeft size={20} />
      </button>
      
      <div className="text-center flex-1">
        <h2 className="font-semibold text-lg">
          {view === 'recap' 
            ? format(selectedDate, 'MMMM yyyy', { locale: localeId })
            : format(selectedDate, 'EEEE, d MMMM yyyy', { locale: localeId })
          }
        </h2>
      </div>

      <button 
        onClick={() => setSelectedDate(prev => addMonths(prev, view === 'recap' ? 1 : 0))}
        className={cn("p-2 hover:bg-slate-100 rounded-full transition-colors", view !== 'recap' && "hidden")}
      >
        <ChevronRight size={20} />
      </button>
      <button 
        onClick={() => setSelectedDate(prev => addDays(prev, 1))}
        className={cn("p-2 hover:bg-slate-100 rounded-full transition-colors", view === 'recap' && "hidden")}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );

  if (view === 'list') {
    const today = selectedDate;
    const todayKey2 = format(today, 'yyyy-MM-dd');
    const todayTotalAct = getEffectiveTotalActivities(today);
    const isListToday = isSameDay(selectedDate, new Date());

    return (
      <PageLayout navItems={navItems} actions={headerActions}>
        <main className="max-w-5xl mx-auto p-4 space-y-5 mt-4">

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Siswa', value: String(todayStats.total), sub: allowedClasses.join(', '), icon: Users, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50' },
              { label: 'Sudah Isi', value: String(todayStats.filled), sub: `${todayStats.total > 0 ? Math.round((todayStats.filled/todayStats.total)*100) : 0}% dari total`, icon: CheckCircle2, iconColor: 'text-teal-600', iconBg: 'bg-teal-50' },
              { label: 'Rata-rata Skor', value: todayStats.avg, sub: format(selectedDate, 'd MMM yyyy', { locale: localeId }), icon: TrendingUp, iconColor: 'text-amber-600', iconBg: 'bg-amber-50' },
              { label: 'Belum Isi', value: String(todayStats.notFilled), sub: 'Perlu diingatkan', icon: Bell, iconColor: 'text-red-500', iconBg: 'bg-red-50' },
            ].map(({ label, value, sub, icon: Icon, iconColor, iconBg }) => (
              <div key={label} className="app-card p-4 flex items-start justify-between gap-2">
                <div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">{label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
                </div>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
                  <Icon size={18} className={iconColor} />
                </div>
              </div>
            ))}
          </div>

          {/* Student list card */}
          <div className="app-card overflow-hidden">
            <div className="p-4 app-card-muted border-b border-emerald-100 dark:border-emerald-900/40 flex flex-wrap items-center gap-3 justify-between">
              {/* Title + count */}
              <div>
                <h3 className="font-bold flex items-center gap-2 text-emerald-950 dark:text-emerald-100">
                  <Users size={18} /> Daftar Siswa
                </h3>
                <span className="text-sm font-medium text-emerald-700/70 dark:text-emerald-200/70">{allStudents.length} Siswa Terdaftar</span>
              </div>

              {/* Date navigator pill */}
              <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm px-1 py-1">
                <button
                  onClick={() => setSelectedDate(prev => subDays(prev, 1))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                  title="Hari sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>
                <label className="relative cursor-pointer select-none">
                  <span className="px-2 py-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    {format(selectedDate, 'EEE, d MMM yyyy', { locale: localeId })}
                  </span>
                  <input
                    type="date"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={e => { if (e.target.value) setSelectedDate(startOfDay(parseISO(e.target.value))); }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                </label>
                <button
                  onClick={() => setSelectedDate(prev => addDays(prev, 1))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                  title="Hari berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
                {!isListToday && (
                  <button
                    onClick={() => setSelectedDate(startOfDay(new Date()))}
                    className="ml-1 mr-0.5 px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors whitespace-nowrap"
                  >
                    Hari ini
                  </button>
                )}
              </div>

              {/* Search + Rekap */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari nama siswa..."
                    className="pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 w-44"
                  />
                </div>
                <button
                  onClick={() => setView('recap')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors"
                >
                  <BarChart3 size={15} />
                  Rekap
                </button>
              </div>
            </div>

            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-0 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 text-xs uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">
              <div className="px-4 py-2.5">Nama Siswa</div>
              <div className="px-4 py-2.5 text-center">Progres</div>
              <div className="px-4 py-2.5 text-center">Skor</div>
              <div className="px-4 py-2.5 text-center">Status</div>
              <div className="px-4 py-2.5 text-center">Aksi</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {students.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  {searchQuery ? 'Tidak ada siswa yang cocok.' : 'Belum ada siswa yang mendaftar.'}
                </div>
              ) : (
                students.map(s => {
                  const sTodayRecord = s.records[todayKey2];
                  const sCount = sTodayRecord ? getEffectiveCompletedCount(today, sTodayRecord.completedActivities, s.haidPeriods) : 0;
                  const autoStudentScore = Math.round((sCount / todayTotalAct) * 100);
                  const pct = Math.round((sCount / todayTotalAct) * 100);
                  const status = pct === 100 ? 'Selesai' : pct > 0 ? 'Proses' : 'Belum';
                  const statusClass = status === 'Selesai'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : status === 'Proses'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300';

                  return (
                    <div key={s.id} className="flex flex-wrap sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-3 sm:gap-0 p-4 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                      {/* Name */}
                      <button
                        onClick={() => handleSelectStudent(s.id)}
                        className="flex items-center gap-3 text-left flex-1 min-w-0"
                      >
                        <StudentAvatar name={s.name} studentId={s.id} size="sm" />
                        <div className="min-w-0">
                          <p className="font-bold text-emerald-950 dark:text-slate-100 truncate">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.kelas}</p>
                        </div>
                      </button>

                      {/* Progress bar */}
                      <div className="sm:px-4 flex flex-col items-center gap-1 w-full sm:w-auto">
                        <span className="text-xs text-slate-400">{sCount}/{todayTotalAct}</span>
                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Score */}
                      <div className="sm:px-4 text-center">
                        <span className={cn('text-xl font-extrabold', scoreColor(autoStudentScore))}>
                          {autoStudentScore}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="sm:px-4 text-center">
                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', statusClass)}>
                          {status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="sm:px-4 flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleSelectStudent(s.id)}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-xl transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={15} />
                        </button>
                        <a
                          href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(`Halo ${s.name}, jangan lupa untuk mengisi Buku Laporan Pendidikan (BLP) hari ini ya!`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-xl transition-colors"
                          title="Kirim Pengingat WA"
                        >
                          <MessageCircle size={15} />
                        </a>
                        <a
                          href={`mailto:${s.email}?subject=Pengingat Pengisian BLP&body=${encodeURIComponent(`Halo ${s.name},\n\nJangan lupa untuk mengisi Buku Laporan Pendidikan (BLP) harian Anda.\n\nTerima kasih.`)}`}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 rounded-xl transition-colors"
                          title="Kirim Pengingat Email"
                        >
                          <Mail size={15} />
                        </a>
                        <button
                          onClick={() => setDeletingStudentId(s.id)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-colors"
                          title="Hapus Akun Siswa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>

        {showProfileModal && guru && (
          <ProfileModal
            name={guru.name}
            currentPhotoUrl={guru.photoUrl}
            currentBio={guru.bio}
            onClose={() => setShowProfileModal(false)}
            onSave={(photoUrl, bio) => onUpdateProfile(photoUrl, bio)}
          />
        )}
        {deletingStudentId && (
          <ConfirmModal
            title="Hapus Akun Siswa?"
            message={`Akun "${systemData.students[deletingStudentId]?.name}" beserta seluruh riwayat BLP-nya akan dihapus permanen. Akun yang sudah terhapus tidak dapat dikembalikan.`}
            confirmLabel="Ya, Hapus Akun"
            onClose={() => setDeletingStudentId(null)}
            onConfirm={async () => {
              await onDeleteStudent(deletingStudentId);
              setDeletingStudentId(null);
            }}
          />
        )}
      </PageLayout>
    );
  }

  if (view === 'recap') {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <PageLayout navItems={navItems} actions={headerActions}>
        <main className="max-w-5xl mx-auto p-4 space-y-5 mt-4">
          {renderDateSelector()}

          <div className="flex justify-end">
            <button
              onClick={() => setShowPeriodModal(true)}
              className="flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 px-3 py-2 rounded-xl transition-colors"
            >
              <Settings2 size={16} /> Atur Hari Aktif BLP
            </button>
          </div>

          {showPeriodModal && (
            <BlpPeriodModal
              kelasOptions={allowedClasses}
              monthDate={selectedDate}
              blpPeriods={systemData.blpPeriods}
              getPeriodKey={(kelas, date) => getBlpPeriodKeyForDate(kelas, date)}
              onClose={() => setShowPeriodModal(false)}
              onSave={onSaveBlpPeriod}
            />
          )}

          <div className="app-card overflow-hidden overflow-x-auto">
            {/* Table header */}
            <div className="p-4 app-card-muted border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 text-emerald-950 dark:text-emerald-100">
                <BarChart3 size={18} /> Rekap Nilai — {format(selectedDate, 'MMMM yyyy', { locale: localeId })}
              </h3>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="app-card-muted text-emerald-900 dark:text-emerald-100 text-sm">
                  <th className="p-3 border-b border-emerald-100 dark:border-emerald-900/40 font-semibold sticky left-0 app-card-muted z-10 w-52 min-w-[13rem] max-w-[13rem]">Nama Siswa</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-center whitespace-nowrap">Kelas</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-center whitespace-nowrap">Rata-Rata</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-center whitespace-nowrap">Hari Dinilai</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-center whitespace-nowrap">Unduh Rekap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allStudents.map(s => {
                  let totalScore = 0;
                  let scoredDaysCount = 0;

                  daysInMonth.forEach(day => {
                    if (!isDateCountedForRecap(day, s.kelas, systemData.blpPeriods)) return;
                    const k = format(day, 'yyyy-MM-dd');
                    const r = s.records[k];
                    if (r && r.completedActivities.length > 0) {
                      const dayTotal = getEffectiveTotalActivities(day);
                      const dayDone = getEffectiveCompletedCount(day, r.completedActivities, s.haidPeriods);
                      totalScore += Math.round((dayDone / dayTotal) * 100);
                      scoredDaysCount++;
                    }
                  });

                  const avgNum = scoredDaysCount > 0 ? totalScore / scoredDaysCount : null;
                  const avg = avgNum !== null ? avgNum.toFixed(1) : '-';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900 z-10 w-52 min-w-[13rem] max-w-[13rem]">
                        <span className="block truncate" title={s.name}>{s.name}</span>
                      </td>
                      <td className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">{s.kelas}</td>
                      <td className="p-3 text-center">
                        {avgNum !== null ? (
                          <span className={cn('inline-block px-2.5 py-1 rounded-lg text-sm font-bold border', scoreBg(avgNum))}>
                            {avg}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center text-sm text-slate-500 dark:text-slate-400">{scoredDaysCount} hari</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => downloadRekapPDF(s, selectedDate, systemData.blpPeriods)}
                            title="Unduh PDF"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-xs font-semibold transition-colors"
                          >
                            <FileDown size={13} /> PDF
                          </button>
                          <button
                            onClick={() => downloadRekapExcel(s, selectedDate, systemData.blpPeriods)}
                            title="Unduh Excel"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-xs font-semibold transition-colors"
                          >
                            <FileSpreadsheet size={13} /> Excel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
        {showProfileModal && guru && (
          <ProfileModal
            name={guru.name}
            currentPhotoUrl={guru.photoUrl}
            currentBio={guru.bio}
            onClose={() => setShowProfileModal(false)}
            onSave={(photoUrl, bio) => onUpdateProfile(photoUrl, bio)}
          />
        )}
      </PageLayout>
    );
  }

  // ── Haid monitoring view ────────────────────────────────────────────────────
  if (view === 'haid') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = format(today, 'yyyy-MM-dd');

    // Only female students in the guru's class
    const femaleStudents = allStudents.filter(s => s.jenisKelamin === 'P');
    // Also include students with no jenis_kelamin set (unknown) who have any haid records
    const unknownWithHaid = allStudents.filter(
      s => s.jenisKelamin !== 'P' && (s.haidPeriods || []).length > 0
    );
    const haidStudents = [...femaleStudents, ...unknownWithHaid];

    const allWarnings = haidStudents.flatMap(s =>
      analyzeHaidCycles(s.haidPeriods || []).map(w => ({ student: s, ...w }))
    );
    const alertCount = allWarnings.filter(w => w.level === 'alert').length;
    const warnCount  = allWarnings.filter(w => w.level === 'warning').length;

    return (
      <PageLayout navItems={navItems} actions={headerActions}>
        <main className="max-w-4xl mx-auto p-4 space-y-5 mt-4">

          {/* Summary Banner */}
          {allWarnings.length > 0 ? (
            <div className={cn(
              "rounded-2xl p-5 flex items-start gap-4 border",
              alertCount > 0
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
            )}>
              <ShieldAlert size={24} className={alertCount > 0 ? "text-red-500 shrink-0" : "text-amber-500 shrink-0"} />
              <div>
                <p className={cn("font-bold", alertCount > 0 ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200")}>
                  {alertCount > 0
                    ? `${alertCount} peringatan perlu tindak lanjut`
                    : `${warnCount} catatan untuk dipantau`}
                </p>
                <p className="text-sm mt-0.5 text-slate-600 dark:text-slate-400">
                  Periksa detail di bawah. Siklus tidak wajar dapat mengindikasikan siswa tidak jujur atau memerlukan perhatian kesehatan.
                </p>
              </div>
            </div>
          ) : haidStudents.length > 0 ? (
            <div className="rounded-2xl p-5 flex items-center gap-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <Heart size={22} className="text-emerald-500 fill-emerald-500 shrink-0" />
              <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                Semua siklus haid tampak normal.
              </p>
            </div>
          ) : null}

          {haidStudents.length === 0 ? (
            <div className="app-card p-8 text-center text-slate-500 dark:text-slate-400">
              <Heart size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="font-semibold">Belum ada data haid</p>
              <p className="text-sm mt-1">Data akan muncul setelah siswi mencatat status haid di aplikasi mereka.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {haidStudents.map(s => {
                const periods = s.haidPeriods || [];
                const active = periods.find(p => p.endDate === null);
                const warnings = analyzeHaidCycles(periods);
                const hasAlert = warnings.some(w => w.level === 'alert');
                const hasWarn  = warnings.some(w => w.level === 'warning');

                return (
                  <div key={s.id} className="app-card overflow-hidden">
                    {/* Student header */}
                    <div className={cn(
                      "px-5 py-4 flex items-center justify-between gap-4 border-b",
                      hasAlert ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/40"
                        : hasWarn ? "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/40"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800"
                    )}>
                      <div className="flex items-center gap-3">
                        <StudentAvatar name={s.name} studentId={s.id} size="md" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{s.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{s.kelas}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasAlert && <ShieldAlert size={16} className="text-red-500" />}
                        {!hasAlert && hasWarn && <AlertTriangle size={16} className="text-amber-500" />}
                        {active ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                            <Heart size={11} className="fill-rose-500 text-rose-500" />
                            Sedang haid sejak {format(new Date(active.startDate), 'd MMM', { locale: localeId })}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Tidak sedang haid
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Warnings */}
                    {warnings.length > 0 && (
                      <div className="px-5 py-3 space-y-2 border-b border-slate-100 dark:border-slate-800">
                        {warnings.map((w, i) => (
                          <div key={i} className={cn(
                            "flex items-start gap-2 text-xs rounded-lg p-3",
                            w.level === 'alert'
                              ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                              : w.level === 'warning'
                              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                              : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          )}>
                            {w.level === 'alert' ? <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                              : w.level === 'warning' ? <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                              : <Info size={14} className="shrink-0 mt-0.5" />}
                            <span>{w.message}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Period history */}
                    {periods.length === 0 ? (
                      <p className="px-5 py-4 text-sm text-slate-400 dark:text-slate-500 italic">Belum ada riwayat haid.</p>
                    ) : (
                      <div className="px-5 py-4">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Riwayat ({periods.length} periode)</p>
                        <div className="space-y-2">
                          {[...periods]
                            .sort((a, b) => b.startDate.localeCompare(a.startDate))
                            .map(p => {
                              const start = new Date(p.startDate);
                              const end   = p.endDate ? new Date(p.endDate) : null;
                              const days  = end
                                ? Math.floor((end.getTime() - start.getTime()) / 86400000) + 1
                                : Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
                              const isOngoing = !p.endDate;
                              const isTooLong = days > 15;

                              return (
                                <div key={p.id} className={cn(
                                  "flex items-center justify-between text-sm rounded-xl px-4 py-2.5 border",
                                  isOngoing
                                    ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"
                                    : isTooLong
                                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                    : "bg-white dark:bg-slate-800/60 border-slate-100 dark:border-slate-700"
                                )}>
                                  <span className="text-slate-700 dark:text-slate-300">
                                    {format(start, 'd MMM yyyy', { locale: localeId })}
                                    {' → '}
                                    {end ? format(end, 'd MMM yyyy', { locale: localeId }) : <em>berlangsung</em>}
                                  </span>
                                  <span className={cn(
                                    "font-semibold text-xs ml-4 shrink-0",
                                    isTooLong ? "text-red-600 dark:text-red-400"
                                      : isOngoing ? "text-rose-600 dark:text-rose-400"
                                      : "text-slate-500 dark:text-slate-400"
                                  )}>
                                    {days} hari{isTooLong ? ' ⚠' : ''}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {showProfileModal && guru && (
          <ProfileModal
            name={guru.name}
            currentPhotoUrl={guru.photoUrl}
            currentBio={guru.bio}
            onClose={() => setShowProfileModal(false)}
            onSave={(photoUrl, bio) => onUpdateProfile(photoUrl, bio)}
          />
        )}
      </PageLayout>
    );
  }

  // Detail View & Presentation View
  if (!selectedStudent) return null;

  const completedCount = currentRecord.completedActivities.length;
  const isPresentation = view === 'presentation';

  const DetailContent = (
    <div className={cn("space-y-6", isPresentation ? "max-w-5xl mx-auto py-12" : "max-w-4xl mx-auto p-4 mt-4")}>
      {!isPresentation && renderDateSelector()}
      
      {isPresentation && (
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <StudentAvatar name={selectedStudent.name} studentId={selectedStudent.id} size="xl" />
          </div>
          <h2 className="text-4xl font-bold text-slate-800 mb-2">Hasil BLP: {selectedStudent.name}</h2>
          <p className="text-xl text-slate-500">{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: localeId })}</p>
        </div>
      )}

      {/* Student identity strip — detail view only */}
      {!isPresentation && (
        <div className="flex items-center gap-4 app-card px-5 py-4">
          <StudentAvatar name={selectedStudent.name} studentId={selectedStudent.id} size="lg" />
          <div>
            <p className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">{selectedStudent.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{selectedStudent.kelas}</p>
          </div>
        </div>
      )}

      <div className={cn("app-card p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between", isPresentation && "shadow-xl border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30")}>
        <div>
          <h3 className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200 text-lg">
            Progress BLP
          </h3>
          <p className="text-sm text-slate-500">{completedCount} dari {totalActivities} kegiatan selesai</p>
          {/* Progress bar */}
          <div className="mt-3 w-48 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
              style={{ width: `${(completedCount / totalActivities) * 100}%` }}
            />
          </div>
        </div>
        
        <div className={cn("bg-gradient-to-br from-emerald-700 to-teal-600 text-white p-4 rounded-xl text-center min-w-[150px]", !isPresentation && "shadow-sm")}>
          <p className="text-sm font-bold uppercase tracking-wider opacity-80 mb-1">Nilai Otomatis</p>
          <p className="text-4xl font-bold">{autoScore}</p>
          <p className="text-xs text-emerald-200 mt-1">dari 100</p>
        </div>
      </div>

      <div className={cn("grid gap-8", isPresentation ? "md:grid-cols-2" : "md:grid-cols-1")}>
        {categories.map((category) => (
          <section key={category.id} className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1 h-6 bg-emerald-600 rounded-full" />
              <h3 className="font-bold text-slate-700 dark:text-slate-200 tracking-tight text-sm uppercase">
                {category.name}
              </h3>
            </div>
            
            <div className="grid gap-3">
              {category.activities.map((activity) => {
                const isDone = currentRecord.completedActivities.includes(activity.id);
                const submission = currentRecord.submissions?.[activity.id];
                const submissionIcon =
                  isQuranActivity(activity.id) ? <Mic size={14} /> :
                  activity.id === CHECKLIST_ACTIVITY_ID ? <ListChecks size={14} /> :
                  submission?.type === 'text' ? <PenLine size={14} /> : null;
                return (
                  <div
                    key={activity.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border text-left",
                      isDone 
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" 
                        : "bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 opacity-70",
                       isPresentation && "shadow-sm bg-white dark:bg-slate-900"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0",
                      isDone ? "text-emerald-600" : "text-slate-300 dark:text-slate-700"
                    )}>
                      {isDone ? <CheckCircle2 size={isPresentation ? 32 : 24} /> : <Circle size={isPresentation ? 32 : 24} />}
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium leading-snug",
                        isDone ? "text-emerald-900 dark:text-emerald-100" : "text-slate-500 dark:text-slate-400",
                        isPresentation && "text-lg"
                      )}>
                        {activity.name}
                      </p>
                    </div>
                    {!isPresentation && submission && (
                      <button
                        onClick={async () => {
                          setReviewingActivityId(activity.id);
                          if (!submission.reviewedAt) {
                            await onReviewSubmission(selectedStudent.id, dateKey, activity.id);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-xs font-bold transition-colors flex-shrink-0"
                        title="Lihat tugas yang dikumpulkan"
                      >
                        {submissionIcon}
                        <Eye size={14} />
                        Lihat
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );

  if (view === 'presentation') {
    return (
      <div className="min-h-screen bg-white font-sans">
        <div className="fixed top-4 right-4 z-50">
          <button 
            onClick={() => setView('detail')}
            className="bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 px-4 py-2 rounded-xl font-bold backdrop-blur transition-all"
          >
            Tutup Presentasi
          </button>
        </div>
        {DetailContent}
      </div>
    );
  }

  return (
    <PageLayout navItems={navItems} actions={headerActions}>
      <div className="max-w-4xl mx-auto px-4 mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => setView('list')}
          className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
        >
          ← Kembali
        </button>
        <button
          onClick={() => setView('presentation')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <Presentation size={18} />
          Buka Mode Presentasi
        </button>
        <button
          onClick={() => setDeletingStudentId(selectedStudent.id)}
          className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <Trash2 size={18} />
          Hapus Akun Siswa
        </button>
      </div>

      {DetailContent}

      {showProfileModal && guru && (
        <ProfileModal
          name={guru.name}
          currentPhotoUrl={guru.photoUrl}
          currentBio={guru.bio}
          onClose={() => setShowProfileModal(false)}
          onSave={(photoUrl, bio) => onUpdateProfile(photoUrl, bio)}
        />
      )}
      {deletingStudentId && (
        <ConfirmModal
          title="Hapus Akun Siswa?"
          message={`Akun "${systemData.students[deletingStudentId]?.name}" beserta seluruh riwayat BLP-nya akan dihapus permanen. Akun yang sudah terhapus tidak dapat dikembalikan.`}
          confirmLabel="Ya, Hapus Akun"
          onClose={() => setDeletingStudentId(null)}
          onConfirm={async () => {
            const deletedId = deletingStudentId;
            await onDeleteStudent(deletedId);
            setDeletingStudentId(null);
            if (selectedStudentId === deletedId) {
              setSelectedStudentId(null);
              setView('list');
            }
          }}
        />
      )}
      {reviewingActivityId && currentRecord.submissions?.[reviewingActivityId] && (
        <GuruReviewSubmissionModal
          activityName={categories.flatMap(c => c.activities).find(a => a.id === reviewingActivityId)?.name || ''}
          submission={currentRecord.submissions[reviewingActivityId]}
          checklistItems={reviewingActivityId === CHECKLIST_ACTIVITY_ID ? PERLENGKAPAN_SEKOLAH_ITEMS : undefined}
          onClose={() => setReviewingActivityId(null)}
        />
      )}
    </PageLayout>
  );
}
