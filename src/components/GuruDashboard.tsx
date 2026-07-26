import { useState, useMemo, type FormEvent } from 'react';
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
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, addDays, subDays, startOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { BLP_CATEGORIES, PERLENGKAPAN_SEKOLAH_ITEMS } from '../data/activities';
import { SystemData, DailyRecord, AuthState, ActivitySubmission } from '../types';
import { downloadRekapPDF, downloadRekapExcel } from '../utils/rekapExport';
import { getEffectiveTotalActivities, getEffectiveCompletedCount, isDateCountedForRecap, getBlpPeriodKeyForDate } from '../utils/blpScoring';
import PageLayout, { type NavItem } from './layout/PageLayout';
import { FileDown } from 'lucide-react';
import ProfileModal from './modals/ProfileModal';
import ConfirmModal from './modals/ConfirmModal';
import GuruReviewSubmissionModal from './modals/GuruReviewSubmissionModal';
import BlpPeriodModal from './modals/BlpPeriodModal';

const QURAN_ACTIVITY_ID = 'd5';
const CHECKLIST_ACTIVITY_ID = 'rp1';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export default function GuruDashboard({ systemData, auth, onLogout, onUpdateProfile, onDeleteStudent, onReviewSubmission, onSaveBlpPeriod }: GuruDashboardProps) {
  const [view, setView] = useState<'list' | 'detail' | 'presentation' | 'recap'>('list');
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
  const totalActivities = getEffectiveTotalActivities(selectedDate);

  const selectedStudent = selectedStudentId ? systemData.students[selectedStudentId] : null;
  const currentRecord = selectedStudent?.records[dateKey] || { date: dateKey, completedActivities: [] };
  const autoScore = Math.round((getEffectiveCompletedCount(selectedDate, currentRecord.completedActivities) / totalActivities) * 100);

  // Compute stats for today
  const todayStats = useMemo(() => {
    const today = new Date();
    const todayKey = format(today, 'yyyy-MM-dd');
    const todayTotal = getEffectiveTotalActivities(today);
    let filled = 0;
    let totalScore = 0;
    allStudents.forEach(s => {
      const r = s.records[todayKey];
      const count = r ? getEffectiveCompletedCount(today, r.completedActivities) : 0;
      if (count > 0) filled++;
      totalScore += Math.round((count / todayTotal) * 100);
    });
    const notFilled = allStudents.length - filled;
    const avg = allStudents.length > 0 ? (totalScore / allStudents.length).toFixed(1) : '0';
    return { total: allStudents.length, filled, notFilled, avg };
  }, [allStudents]);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setView('detail');
  };

  const navItems: NavItem[] = [
    { label: 'Daftar Siswa', icon: <Users size={16} />,      onClick: () => setView('list'),  isActive: view === 'list' || view === 'detail' || view === 'presentation' },
    { label: 'Rekap Nilai',  icon: <BarChart3 size={16} />,  onClick: () => setView('recap'), isActive: view === 'recap' },
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
    const today = new Date();
    const todayKey2 = format(today, 'yyyy-MM-dd');
    const todayTotalAct = getEffectiveTotalActivities(today);

    return (
      <PageLayout navItems={navItems} actions={headerActions}>
        <main className="max-w-5xl mx-auto p-4 space-y-5 mt-4">

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Siswa', value: String(todayStats.total), sub: allowedClasses.join(', '), icon: Users, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50' },
              { label: 'Sudah Isi Hari Ini', value: String(todayStats.filled), sub: `${todayStats.total > 0 ? Math.round((todayStats.filled/todayStats.total)*100) : 0}% dari total`, icon: CheckCircle2, iconColor: 'text-teal-600', iconBg: 'bg-teal-50' },
              { label: 'Rata-rata Skor', value: todayStats.avg, sub: 'Hari ini', icon: TrendingUp, iconColor: 'text-amber-600', iconBg: 'bg-amber-50' },
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
              <div>
                <h3 className="font-bold flex items-center gap-2 text-emerald-950 dark:text-emerald-100">
                  <Users size={18} /> Daftar Siswa — {format(today, 'EEEE, d MMMM yyyy', { locale: localeId })}
                </h3>
                <span className="text-sm font-medium text-emerald-700/70 dark:text-emerald-200/70">{allStudents.length} Siswa Terdaftar</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
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
              <div className="px-4 py-2.5 text-center">Skor Hari Ini</div>
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
                  const sCount = sTodayRecord ? getEffectiveCompletedCount(today, sTodayRecord.completedActivities) : 0;
                  const autoStudentScore = Math.round((sCount / todayTotalAct) * 100);
                  const pct = Math.round((sCount / todayTotalAct) * 100);
                  const status = pct === 100 ? 'Selesai' : pct > 0 ? 'Proses' : 'Belum';
                  const statusClass = status === 'Selesai'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : status === 'Proses'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300';

                  const initials = s.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <div key={s.id} className="flex flex-wrap sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-3 sm:gap-0 p-4 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                      {/* Name */}
                      <button
                        onClick={() => handleSelectStudent(s.id)}
                        className="flex items-center gap-3 text-left flex-1 min-w-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {initials}
                        </div>
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
                  <th className="p-3 border-b border-emerald-100 dark:border-emerald-900/40 font-semibold sticky left-0 app-card-muted z-10">Nama Siswa</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-center">Kelas</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-center">Rata-Rata</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-center">Hari Dinilai</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-center">Unduh Rekap</th>
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
                      const dayDone = getEffectiveCompletedCount(day, r.completedActivities);
                      totalScore += Math.round((dayDone / dayTotal) * 100);
                      scoredDaysCount++;
                    }
                  });

                  const avgNum = scoredDaysCount > 0 ? totalScore / scoredDaysCount : null;
                  const avg = avgNum !== null ? avgNum.toFixed(1) : '-';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900 z-10">{s.name}</td>
                      <td className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold">{s.kelas}</td>
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

  // Detail View & Presentation View
  if (!selectedStudent) return null;

  const completedCount = currentRecord.completedActivities.length;
  const isPresentation = view === 'presentation';

  const DetailContent = (
    <div className={cn("space-y-6", isPresentation ? "max-w-5xl mx-auto py-12" : "max-w-4xl mx-auto p-4 mt-4")}>
      {!isPresentation && renderDateSelector()}
      
      {isPresentation && (
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-slate-800 mb-2">Hasil BLP: {selectedStudent.name}</h2>
          <p className="text-xl text-slate-500">{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: localeId })}</p>
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
        {BLP_CATEGORIES.map((category) => (
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
                  activity.id === QURAN_ACTIVITY_ID ? <Mic size={14} /> :
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
          activityName={BLP_CATEGORIES.flatMap(c => c.activities).find(a => a.id === reviewingActivityId)?.name || ''}
          submission={currentRecord.submissions[reviewingActivityId]}
          checklistItems={reviewingActivityId === CHECKLIST_ACTIVITY_ID ? PERLENGKAPAN_SEKOLAH_ITEMS : undefined}
          onClose={() => setReviewingActivityId(null)}
        />
      )}
    </PageLayout>
  );
}
