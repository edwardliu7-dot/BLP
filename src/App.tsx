import { useState, useEffect } from 'react';
import { AuthState, SystemData, DailyRecord } from './types';
import Login from './components/Login';
import SiswaDashboard from './components/SiswaDashboard';
import GuruDashboard from './components/GuruDashboard';
import { format } from 'date-fns';

const STORAGE_KEY = 'blp_system_data';
const THEME_KEY = 'blp_theme';
const REMINDERS_KEY = 'blp_reminders';
const AUTH_KEY = 'blp_auth_state';

// Try to migrate old data if exists
const OLD_STORAGE_KEY = 'blp_tracker_data';

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [systemData, setSystemData] = useState<SystemData>({ students: {}, gurus: {} });
  const [auth, setAuth] = useState<AuthState>({ role: null });
  const [darkMode, setDarkMode] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  useEffect(() => {
    // 1. Load System Data
    let data: SystemData = { students: {}, gurus: {} };
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        data = {
          students: parsed.students || {},
          gurus: parsed.gurus || {}
        };
      } catch (e) {
        console.error('Failed to parse system data', e);
      }
    } else {
      // Migrate old data
      const oldData = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldData) {
        try {
          const parsed = JSON.parse(oldData);
          if (parsed.name) {
            const userId = parsed.name.toLowerCase().replace(/\s+/g, '-');
            data = {
              students: {
                [userId]: {
                  id: userId,
                  name: parsed.name,
                  kelas: '7A', // Default class for migrated data
                  email: '',
                  whatsapp: '',
                  records: parsed.records || {}
                }
              },
              gurus: {}
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    setSystemData(data);

    // 2. Load Auth State
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
  }, []);

  // Save System Data when it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(systemData));
    }
  }, [systemData, isInitialized]);

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

  const handleRegisterSiswa = (data: import('./types').UserProgress) => {
    setSystemData(prev => ({
      ...prev,
      students: { ...prev.students, [data.id]: data }
    }));
    handleLogin({ role: 'siswa', userId: data.id, name: data.name, kelas: data.kelas });
  };

  const handleRegisterGuru = (data: import('./types').GuruProfile) => {
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
  const handleUpdateRecord = (dateKey: string, updatedRecord: DailyRecord) => {
    if (auth.role === 'siswa' && auth.userId) {
      setSystemData(prev => {
        const student = prev.students[auth.userId!];
        if (!student) return prev;
        
        return {
          ...prev,
          students: {
            ...prev.students,
            [auth.userId!]: {
              ...student,
              records: {
                ...student.records,
                [dateKey]: updatedRecord
              }
            }
          }
        };
      });
    }
  };

  if (!isInitialized) return null;

  if (auth.role === 'siswa' && auth.userId) {
    const user = systemData.students[auth.userId];
    if (!user) return <Login systemData={systemData} onLogin={handleLogin} onRegisterSiswa={handleRegisterSiswa} onRegisterGuru={handleRegisterGuru} />; // Edge case fallback
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

  return <Login systemData={systemData} onLogin={handleLogin} onRegisterSiswa={handleRegisterSiswa} onRegisterGuru={handleRegisterGuru} />;
}
