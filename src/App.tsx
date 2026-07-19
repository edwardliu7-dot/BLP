import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AuthState, SystemData, DailyRecord, UserProgress, GuruProfile, QuranBookmark } from './types';
import Login from './components/Login';
import LoadingScreen from './components/LoadingScreen';

// Lazy-load dashboards so the login page bundle is tiny and each role only
// downloads its own code.
const SiswaDashboard = lazy(() => import('./components/SiswaDashboard'));
const GuruDashboard = lazy(() => import('./components/GuruDashboard'));

const THEME_KEY = 'blp_theme';
const REMINDERS_KEY = 'blp_reminders';
const AUTH_KEY = 'blp_auth_state';

type AppStatus = 'booting' | 'login' | 'ready';

export default function App() {
  const [status, setStatus] = useState<AppStatus>('booting');
  const [systemData, setSystemData] = useState<SystemData>({ students: {}, gurus: {}, blpPeriods: {} });
  const [auth, setAuth] = useState<AuthState>({ role: null });
  const [darkMode, setDarkMode] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  // Fetch data scoped to the currently logged-in user (via session cookie).
  const fetchDashboardData = useCallback(async (): Promise<SystemData> => {
    const res = await fetch('/api/me/dashboard-data');
    if (!res.ok) throw Object.assign(new Error('fetch failed'), { status: res.status });
    return res.json();
  }, []);

  useEffect(() => {
    // Apply theme synchronously before any async work so there is no flash.
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    const storedReminders = localStorage.getItem(REMINDERS_KEY);
    if (storedReminders === 'true' && 'Notification' in window && Notification.permission === 'granted') {
      setRemindersEnabled(true);
    }

    const storedAuth = localStorage.getItem(AUTH_KEY);
    if (!storedAuth) {
      // No stored session — show login immediately, no server round-trip needed.
      setStatus('login');
      return;
    }

    // Stored session found — validate it by fetching scoped dashboard data.
    (async () => {
      try {
        const parsed: AuthState = JSON.parse(storedAuth);
        const data = await fetchDashboardData();
        setSystemData(data);
        setAuth(parsed);
        setStatus('ready');
      } catch {
        // Session expired or invalid — clear and show login.
        localStorage.removeItem(AUTH_KEY);
        setStatus('login');
      }
    })();
  }, [fetchDashboardData]);

  // Handle Theme
  useEffect(() => {
    if (status === 'booting') return;
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [darkMode, status]);

  // Called by Login after the login API succeeds.
  // Returns a Promise so Login can keep its spinner running until data is ready.
  const handleLogin = useCallback(async (newAuth: AuthState) => {
    const data = await fetchDashboardData();
    setSystemData(data);
    setAuth(newAuth);
    localStorage.setItem(AUTH_KEY, JSON.stringify(newAuth));
    setStatus('ready');
  }, [fetchDashboardData]);

  const handleLogout = () => {
    setAuth({ role: null });
    setSystemData({ students: {}, gurus: {}, blpPeriods: {} });
    localStorage.removeItem(AUTH_KEY);
    setStatus('login');
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

  // Still booting (checking localStorage / restoring session)
  if (status === 'booting') return <LoadingScreen message="Memeriksa sesi..." />;

  if (status === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  // status === 'ready'
  if (auth.role === 'siswa' && auth.userId) {
    const user = systemData.students[auth.userId];
    if (!user) return <Login onLogin={handleLogin} />;
    return (
      <Suspense fallback={null}>
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
      </Suspense>
    );
  }

  if (auth.role === 'guru') {
    return (
      <Suspense fallback={null}>
        <GuruDashboard
          systemData={systemData}
          auth={auth}
          onLogout={handleLogout}
          onUpdateProfile={handleUpdateGuruProfile}
          onDeleteStudent={handleDeleteStudent}
          onReviewSubmission={handleReviewSubmission}
          onSaveBlpPeriod={handleSaveBlpPeriod}
        />
      </Suspense>
    );
  }

  return <Login onLogin={handleLogin} />;
}
