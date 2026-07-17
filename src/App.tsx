import { useState, useEffect, useCallback } from 'react';
import { AuthState, SystemData, DailyRecord, UserProgress, GuruProfile, QuranBookmark } from './types';
import Login from './components/Login';
import SiswaDashboard from './components/SiswaDashboard';
import GuruDashboard from './components/GuruDashboard';

const THEME_KEY = 'blp_theme';
const REMINDERS_KEY = 'blp_reminders';
const AUTH_KEY = 'blp_auth_state';

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [systemData, setSystemData] = useState<SystemData>({ students: {}, gurus: {}, blpPeriods: {} });
  const [auth, setAuth] = useState<AuthState>({ role: null });
  const [darkMode, setDarkMode] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchSystemData = useCallback(async () => {
    const res = await fetch('/api/system-data');
    if (!res.ok) throw new Error('Gagal memuat data dari server');
    const data: SystemData = await res.json();
    setSystemData(data);
  }, []);

  useEffect(() => {
    (async () => {
      // 1. Load System Data from database
      try {
        await fetchSystemData();
      } catch (e) {
        console.error('Failed to load system data', e);
        setLoadError('Gagal terhubung ke server. Silakan muat ulang halaman.');
      }

      // 2. Load Auth State — restore from localStorage then validate/refresh
      //    against the server so stale cached values (e.g. missing kelasWali)
      //    don't silently break the dashboard.
      const storedAuth = localStorage.getItem(AUTH_KEY);
      if (storedAuth) {
        try {
          const parsed: AuthState = JSON.parse(storedAuth);
          // A guru session is stale if kelasWali is missing — fetch fresh data.
          const needsRefresh = parsed.role === 'guru' && (!parsed.kelasWali || parsed.kelasWali.length === 0);
          if (needsRefresh) {
            const meRes = await fetch('/api/auth/me');
            if (meRes.ok) {
              const fresh: AuthState = await meRes.json();
              setAuth(fresh);
              localStorage.setItem(AUTH_KEY, JSON.stringify(fresh));
            } else {
              // Session expired or invalid — clear and force re-login
              localStorage.removeItem(AUTH_KEY);
            }
          } else {
            setAuth(parsed);
          }
        } catch (e) {}
      }

      // 3. Load Preferences
      const storedTheme = localStorage.getItem(THEME_KEY);
      if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true);
      }

      const storedReminders = localStorage.getItem(REMINDERS_KEY);
      if (storedReminders === 'true' && 'Notification' in window && Notification.permission === 'granted') {
        setRemindersEnabled(true);
      }

      setIsInitialized(true);
    })();
  }, [fetchSystemData]);

  // Handle Theme
  useEffect(() => {
    if (isInitialized) {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem(THEME_KEY, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(THEME_KEY, 'light');
      }
    }
  }, [darkMode, isInitialized]);

  const handleLogin = (newAuth: AuthState) => {
    setAuth(newAuth);
    localStorage.setItem(AUTH_KEY, JSON.stringify(newAuth));
  };

  const handleLogout = () => {
    setAuth({ role: null });
    localStorage.removeItem(AUTH_KEY);
  };

  // Notifications
  const toggleReminders = async () => {
    if (!remindersEnabled) {
      if (!('Notification' in window)) {
        alert('Browser Anda tidak mendukung notifikasi.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setRemindersEnabled(true);
        localStorage.setItem(REMINDERS_KEY, 'true');
        new Notification('BLP Harian', {
          body: 'Pengingat berhasil diaktifkan! Kami akan mengingatkan Anda setiap sore.',
          icon: '/favicon.ico'
        });
      }
    } else {
      setRemindersEnabled(false);
      localStorage.setItem(REMINDERS_KEY, 'false');
    }
  };

  // Siswa functions
  const handleUpdateRecord = async (dateKey: string, updatedRecord: DailyRecord) => {
    if (auth.role === 'siswa' && auth.userId) {
      const userId = auth.userId;

      // Optimistic update
      setSystemData(prev => {
        const student = prev.students[userId];
        if (!student) return prev;

        return {
          ...prev,
          students: {
            ...prev.students,
            [userId]: {
              ...student,
              records: {
                ...student.records,
                [dateKey]: updatedRecord
              }
            }
          }
        };
      });

      try {
        const res = await fetch(`/api/students/${encodeURIComponent(userId)}/records/${encodeURIComponent(dateKey)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            completedActivities: updatedRecord.completedActivities,
            score: updatedRecord.score ?? null,
            submissions: updatedRecord.submissions ?? {},
          }),
        });
        if (!res.ok) throw new Error('Gagal menyimpan data BLP');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUpdateStudentProfile = async (photoUrl: string | null, bio: string) => {
    if (auth.role !== 'siswa' || !auth.userId) return;
    const userId = auth.userId;
    const res = await fetch(`/api/students/${encodeURIComponent(userId)}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoUrl, bio }),
    });
    if (!res.ok) throw new Error('Gagal menyimpan profil');
    const updated: UserProgress = await res.json();
    setSystemData(prev => ({
      ...prev,
      students: { ...prev.students, [userId]: updated },
    }));
  };

  const handleUpdateQuranBookmark = async (bookmark: QuranBookmark) => {
    if (auth.role !== 'siswa' || !auth.userId) return;
    const userId = auth.userId;

    // Optimistic update
    setSystemData(prev => {
      const student = prev.students[userId];
      if (!student) return prev;
      return {
        ...prev,
        students: {
          ...prev.students,
          [userId]: { ...student, quranBookmark: bookmark },
        },
      };
    });

    try {
      const res = await fetch(`/api/students/${encodeURIComponent(userId)}/quran-bookmark`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookmark),
      });
      if (!res.ok) throw new Error('Gagal menyimpan penanda bacaan');
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateGuruProfile = async (photoUrl: string | null, bio: string) => {
    if (auth.role !== 'guru' || !auth.userId) return;
    const userId = auth.userId;
    const res = await fetch(`/api/gurus/${encodeURIComponent(userId)}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoUrl, bio }),
    });
    if (!res.ok) throw new Error('Gagal menyimpan profil');
    const updated: GuruProfile = await res.json();
    setSystemData(prev => ({
      ...prev,
      gurus: { ...prev.gurus, [userId]: updated },
    }));
  };

  const handleDeleteStudent = async (studentId: string) => {
    const res = await fetch(`/api/students/${encodeURIComponent(studentId)}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || 'Gagal menghapus akun siswa');
    }
    setSystemData(prev => {
      const { [studentId]: _removed, ...rest } = prev.students;
      return { ...prev, students: rest };
    });
  };

  const handleReviewSubmission = async (studentId: string, dateKey: string, activityId: string) => {
    const res = await fetch(
      `/api/students/${encodeURIComponent(studentId)}/records/${encodeURIComponent(dateKey)}/submissions/${encodeURIComponent(activityId)}/review`,
      { method: 'PUT' }
    );
    if (!res.ok) return;
    const updatedSubmission = await res.json();
    setSystemData(prev => {
      const student = prev.students[studentId];
      const record = student?.records[dateKey];
      if (!student || !record) return prev;
      return {
        ...prev,
        students: {
          ...prev.students,
          [studentId]: {
            ...student,
            records: {
              ...student.records,
              [dateKey]: {
                ...record,
                submissions: { ...record.submissions, [activityId]: updatedSubmission },
              },
            },
          },
        },
      };
    });
  };

  const handleSaveBlpPeriod = async (kelas: string, year: number, month: number, startDay: number, endDay: number) => {
    const res = await fetch('/api/blp-periods', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kelas, year, month, startDay, endDay }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || 'Gagal menyimpan rentang tanggal aktif BLP');
    }
    const saved = await res.json();
    setSystemData(prev => ({
      ...prev,
      blpPeriods: {
        ...prev.blpPeriods,
        [`${saved.kelas}__${saved.year}-${String(saved.month).padStart(2, '0')}`]: {
          startDay: saved.startDay,
          endDay: saved.endDay,
        },
      },
    }));
  };

  if (!isInitialized) return null;

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center text-red-600 dark:text-red-400 font-medium">{loadError}</div>
      </div>
    );
  }

  if (auth.role === 'siswa' && auth.userId) {
    const user = systemData.students[auth.userId];
    if (!user) return <Login onLogin={handleLogin} />; // Edge case fallback
    return (
      <SiswaDashboard 
        user={user}
        blpPeriods={systemData.blpPeriods}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        remindersEnabled={remindersEnabled}
        toggleReminders={toggleReminders}
        onUpdateRecord={handleUpdateRecord}
        onUpdateProfile={handleUpdateStudentProfile}
        onUpdateQuranBookmark={handleUpdateQuranBookmark}
        onLogout={handleLogout}
      />
    );
  }

  if (auth.role === 'guru') {
    return (
      <GuruDashboard 
        systemData={systemData}
        auth={auth}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateGuruProfile}
        onDeleteStudent={handleDeleteStudent}
        onReviewSubmission={handleReviewSubmission}
        onSaveBlpPeriod={handleSaveBlpPeriod}
      />
    );
  }

  return <Login onLogin={handleLogin} />;
}
