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
  UserPlus
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, addDays, subDays, startOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { BLP_CATEGORIES, PERLENGKAPAN_SEKOLAH_ITEMS } from '../data/activities';
import { SystemData, DailyRecord, AuthState, ActivitySubmission } from '../types';
import { downloadRekapPDF, downloadRekapExcel } from '../utils/rekapExport';
import { getEffectiveTotalActivities, getEffectiveCompletedCount, isDateCountedForRecap, getBlpPeriodKeyForDate } from '../utils/blpScoring';
import { FileDown } from 'lucide-react';
import ProfileModal from './modals/ProfileModal';
import ConfirmModal from './modals/ConfirmModal';
import GuruReviewSubmissionModal from './modals/GuruReviewSubmissionModal';
import BlpPeriodModal from './modals/BlpPeriodModal';
import GenerateStudentAccountModal from './modals/GenerateStudentAccountModal';

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
  onGenerateStudentAccount: (data: { name: string; kelas: string }) => Promise<{ id: string; username: string; password: string; name: string; kelas: string }>;
}

export default function GuruDashboard({ systemData, auth, onLogout, onUpdateProfile, onDeleteStudent, onReviewSubmission, onSaveBlpPeriod, onGenerateStudentAccount }: GuruDashboardProps) {
  const [view, setView] = useState<'list' | 'detail' | 'presentation' | 'recap'>('list');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [reviewingActivityId, setReviewingActivityId] = useState<string | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showGenerateAccountModal, setShowGenerateAccountModal] = useState(false);
  const guru = auth.userId ? systemData.gurus[auth.userId] : null;

  // Filter students based on teacher's classes, sorted by class then name so
  // the roster is stable and grouped instead of appearing in random DB order.
  const allowedClasses = auth.kelasDiampu || [];
  const students = Object.values(systemData.students)
    .filter(s => allowedClasses.includes(s.kelas))
    .sort((a, b) => {
      if (a.kelas !== b.kelas) return a.kelas.localeCompare(b.kelas, 'id');
      return a.name.localeCompare(b.name, 'id');
    });
  
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const totalActivities = getEffectiveTotalActivities(selectedDate);

  const selectedStudent = selectedStudentId ? systemData.students[selectedStudentId] : null;
  const currentRecord = selectedStudent?.records[dateKey] || { date: dateKey, completedActivities: [] };
  const autoScore = Math.round((getEffectiveCompletedCount(selectedDate, currentRecord.completedActivities) / totalActivities) * 100);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setView('detail');
  };

  const renderHeader = (title: string, subtitle: string) => (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center transition-colors shrink-0"
            title="Edit Profil"
          >
            {guru?.photoUrl ? (
              <img src={guru.photoUrl} alt={guru.name} className="w-full h-full object-cover" />
            ) : (
              <Users className="text-slate-300 w-5 h-5" />
            )}
          </button>
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-sm text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {view !== 'list' && (
            <button 
              onClick={() => setView('list')}
              className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl text-sm font-bold transition-colors"
            >
              Kembali
            </button>
          )}
          <button 
            onClick={onLogout}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            title="Keluar"
          >
            <LogOut size={22} />
          </button>
        </div>
      </div>
    </header>
  );

  const renderDateSelector = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center justify-between mb-6">
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
    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-20">
        {renderHeader("Dashboard Guru", "Daftar Siswa BLP Harian")}
        
        <main className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setView('recap')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Calculator size={18} />
              Rekap Nilai Bulanan
            </button>
            <button
              onClick={() => setShowGenerateAccountModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <UserPlus size={18} />
              Buat Akun Siswa
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 text-slate-700">
                <Users size={18} /> Data Siswa
              </h3>
              <span className="text-sm font-medium text-slate-500">{students.length} Siswa Terdaftar</span>
            </div>
            <div className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Belum ada siswa yang mendaftar.</div>
              ) : (
                students.map(s => {
                  const today = new Date();
                  const sTodayRecord = s.records[format(today, 'yyyy-MM-dd')];
                  const sTotalActivities = getEffectiveTotalActivities(today);
                  const sCount = sTodayRecord ? getEffectiveCompletedCount(today, sTodayRecord.completedActivities) : 0;
                  const autoStudentScore = Math.round((sCount / sTotalActivities) * 100);

                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectStudent(s.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-500">Amaliyah Hari Ini: {sCount}/{totalActivities}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <a 
                            href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(`Halo ${s.name}, jangan lupa untuk mengisi Buku Laporan Pendidikan (BLP) hari ini ya!`)}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors"
                            title="Kirim Pengingat WA"
                          >
                            <MessageCircle size={16} />
                          </a>
                          <a 
                            href={`mailto:${s.email}?subject=Pengingat Pengisian BLP&body=${encodeURIComponent(`Halo ${s.name},\n\nJangan lupa untuk mengisi Buku Laporan Pendidikan (BLP) harian Anda.\n\nTerima kasih.`)}`} 
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                            title="Kirim Pengingat Email"
                          >
                            <Mail size={16} />
                          </a>
                          <button
                            onClick={() => setDeletingStudentId(s.id)}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                            title="Hapus Akun Siswa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md text-xs font-bold">
                            Nilai: {autoStudentScore}
                          </span>
                          <ChevronRight className="inline-block text-slate-400 ml-2" size={16} />
                        </div>
                      </div>
                    </button>
                  )
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
        {showGenerateAccountModal && (
          <GenerateStudentAccountModal
            kelasOptions={allowedClasses}
            onClose={() => setShowGenerateAccountModal(false)}
            onGenerate={onGenerateStudentAccount}
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
      </div>
    );
  }

  if (view === 'recap') {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-20">
        {renderHeader("Rekap Nilai Bulanan", "Rata-rata Nilai BLP Siswa")}
        <main className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
          {renderDateSelector()}

          <div className="flex justify-end">
            <button
              onClick={() => setShowPeriodModal(true)}
              className="flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded-xl transition-colors"
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

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-sm">
                  <th className="p-3 border-b border-slate-200 font-semibold sticky left-0 bg-slate-100 z-10">Nama Siswa</th>
                  <th className="p-3 border-b border-slate-200 font-semibold text-center">Rata-Rata Bulan Ini</th>
                  <th className="p-3 border-b border-slate-200 font-semibold text-center">Hari Dinilai</th>
                  <th className="p-3 border-b border-slate-200 font-semibold text-center">Rekap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(s => {
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

                  const avg = scoredDaysCount > 0 ? (totalScore / scoredDaysCount).toFixed(1) : '-';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50 z-10">{s.name}</td>
                      <td className="p-3 text-center font-bold text-emerald-600">{avg}</td>
                      <td className="p-3 text-center text-sm text-slate-500">{scoredDaysCount} hari</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => downloadRekapPDF(s, selectedDate, systemData.blpPeriods)}
                            title="Unduh PDF"
                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                          >
                            <FileDown size={14} />
                          </button>
                          <button
                            onClick={() => downloadRekapExcel(s, selectedDate, systemData.blpPeriods)}
                            title="Unduh Excel"
                            className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                          >
                            <FileDown size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
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
      </div>
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

      <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between", isPresentation && "shadow-xl border-emerald-200 bg-emerald-50")}>
        <div>
          <h3 className="font-bold flex items-center gap-2 text-slate-700 text-lg">
            Progress BLP
          </h3>
          <p className="text-sm text-slate-500">{completedCount} dari {totalActivities} kegiatan selesai</p>
        </div>
        
        <div className={cn("bg-emerald-600 text-white p-4 rounded-xl text-center min-w-[150px]", !isPresentation && "shadow-sm")}>
          <p className="text-sm font-bold uppercase tracking-wider opacity-80 mb-1">Nilai Otomatis</p>
          <p className="text-4xl font-bold">{autoScore}</p>
        </div>
      </div>

      <div className={cn("grid gap-8", isPresentation ? "md:grid-cols-2" : "md:grid-cols-1")}>
        {BLP_CATEGORIES.map((category) => (
          <section key={category.id} className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1 h-6 bg-emerald-600 rounded-full" />
              <h3 className="font-bold text-slate-700 tracking-tight text-sm uppercase">
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
                        ? "bg-emerald-50 border-emerald-200" 
                        : "bg-white border-slate-200 opacity-70",
                      isPresentation && "shadow-sm bg-white"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0",
                      isDone ? "text-emerald-600" : "text-slate-300"
                    )}>
                      {isDone ? <CheckCircle2 size={isPresentation ? 32 : 24} /> : <Circle size={isPresentation ? 32 : 24} />}
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium leading-snug",
                        isDone ? "text-emerald-900" : "text-slate-500",
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
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors flex-shrink-0"
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
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {renderHeader(`Detail Siswa: ${selectedStudent.name}`, "Koreksi & Penilaian BLP")}
      
      <div className="max-w-4xl mx-auto px-4 mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => setView('presentation')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <Presentation size={18} />
          Buka Mode Presentasi
        </button>
        <button
          onClick={() => setDeletingStudentId(selectedStudent.id)}
          className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
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
    </div>
  );
}
