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
  Mail
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, addDays, subDays, startOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { BLP_CATEGORIES } from '../data/activities';
import { SystemData, DailyRecord, AuthState } from '../types';
import { downloadRekapPDF, downloadRekapExcel } from '../utils/rekapExport';
import { FileDown } from 'lucide-react';
import ProfileModal from './modals/ProfileModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GuruDashboardProps {
  systemData: SystemData;
  auth: AuthState;
  onLogout: () => void;
  onUpdateProfile: (photoUrl: string | null, bio: string) => Promise<void> | void;
}

export default function GuruDashboard({ systemData, auth, onLogout, onUpdateProfile }: GuruDashboardProps) {
  const [view, setView] = useState<'list' | 'detail' | 'presentation' | 'recap'>('list');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [showProfileModal, setShowProfileModal] = useState(false);
  const guru = auth.userId ? systemData.gurus[auth.userId] : null;

  // Filter students based on teacher's classes
  const allowedClasses = auth.kelasDiampu || [];
  const students = Object.values(systemData.students).filter(s => allowedClasses.includes(s.kelas));
  
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const totalActivities = BLP_CATEGORIES.reduce((acc, cat) => acc + cat.activities.length, 0);

  const selectedStudent = selectedStudentId ? systemData.students[selectedStudentId] : null;
  const currentRecord = selectedStudent?.records[dateKey] || { date: dateKey, completedActivities: [] };
  const autoScore = Math.round((currentRecord.completedActivities.length / totalActivities) * 100);

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
                  const sTodayRecord = s.records[format(new Date(), 'yyyy-MM-dd')];
                  const sCount = sTodayRecord ? sTodayRecord.completedActivities.length : 0;
                  const autoStudentScore = Math.round((sCount / totalActivities) * 100);

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
                    const k = format(day, 'yyyy-MM-dd');
                    const r = s.records[k];
                    if (r && r.completedActivities.length > 0) {
                      totalScore += Math.round((r.completedActivities.length / totalActivities) * 100);
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
                            onClick={() => downloadRekapPDF(s, selectedDate)}
                            title="Unduh PDF"
                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                          >
                            <FileDown size={14} />
                          </button>
                          <button
                            onClick={() => downloadRekapExcel(s, selectedDate)}
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
      
      <div className="max-w-4xl mx-auto px-4 mt-4">
        <button
          onClick={() => setView('presentation')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <Presentation size={18} />
          Buka Mode Presentasi
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
    </div>
  );
}
