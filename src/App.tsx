import { useState, useEffect, useCallback } from 'react';
import { AuthState, SystemData, DailyRecord, UserProgress, GuruProfile } from './types';
import Login from './components/Login';
import SiswaDashboard from './components/SiswaDashboard';
import GuruDashboard from './components/GuruDashboard';

const THEME_KEY = 'blp_theme';
const REMINDERS_KEY = 'blp_reminders';
const AUTH_KEY = 'blp_auth_state';

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [systemData, setSystemData] = useState<SystemData>({ students: {}, gurus: {} });
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

      // 2. Load Auth State (session only, not source of truth)
      const storedAuth = localStorage.getItem(AUTH_KEY);
      if (storedAuth) {
        try {
          setAuth(JSON.parse(storedAuth));
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

  const handleRegisterSiswa = (data: UserProgress) => {
    setSystemData(prev => ({
      ...prev,
      students: { ...prev.students, [data.id]: data }
    }));
    handleLogin({ role: 'siswa', userId: data.id, name: data.name, kelas: data.kelas });
  };

  const handleRegisterGuru = (data: GuruProfile) => {
    setSystemData(prev => ({
      ...prev,
      gurus: { ...prev.gurus, [data.id]: data }
    }));
    handleLogin({ role: 'guru', userId: data.id, name: data.name, kelasDiampu: data.kelasDiampu });
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
    if (!user) return <Login onLogin={handleLogin} onRegisterSiswa={handleRegisterSiswa} onRegisterGuru={handleRegisterGuru} />; // Edge case fallback
    return (
      <SiswaDashboard 
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        remindersEnabled={remindersEnabled}
        toggleReminders={toggleReminders}
        onUpdateRecord={handleUpdateRecord}
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
      />
    );
  }

  return <Login onLogin={handleLogin} onRegisterSiswa={handleRegisterSiswa} onRegisterGuru={handleRegisterGuru} />;
}
