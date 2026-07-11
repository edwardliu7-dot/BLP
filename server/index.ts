import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { pool } from './db';
import type { UserProgress, GuruProfile, DailyRecord, SystemData } from '../src/types';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    role?: 'siswa' | 'guru';
  }
}

const app = express();
app.use(express.json({ limit: '2mb' }));

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required');
}

app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));

// Only letters, numbers, spaces, dots, underscores and hyphens; collapse
// internal whitespace so visually-identical usernames can't collide/duplicate.
const USERNAME_RE = /^[a-zA-Z0-9._ -]{3,50}$/;

function normalizeUsername(username: string) {
  return username.trim().replace(/\s+/g, ' ');
}

function toId(username: string) {
  return normalizeUsername(username).toLowerCase().replace(/\s+/g, '-');
}

// Require a logged-in session whose user matches the requested role and, if
// idParam is given, whose id matches the :id route param (i.e. users can only
// act on their own account).
function requireAuth(role: 'siswa' | 'guru', idParam?: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session.userId || req.session.role !== role) {
      return res.status(401).json({ error: 'Anda harus login untuk melakukan ini' });
    }
    if (idParam && req.session.userId !== req.params[idParam]) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
    }
    next();
  };
}

async function loadStudent(id: string): Promise<UserProgress | null> {
  const studentRes = await pool.query(
    'SELECT id, username, name, kelas, email, whatsapp, photo_url, bio FROM students WHERE id = $1',
    [id]
  );
  if (studentRes.rowCount === 0) return null;
  const row = studentRes.rows[0];

  const recordsRes = await pool.query(
    'SELECT record_date, completed_activities, score, submissions FROM daily_records WHERE student_id = $1',
    [id]
  );
  const records: Record<string, DailyRecord> = {};
  for (const r of recordsRes.rows) {
    const dateKey = r.record_date.toISOString().slice(0, 10);
    records[dateKey] = {
      date: dateKey,
      completedActivities: r.completed_activities || [],
      score: r.score,
      submissions: r.submissions || {},
    };
  }

  return {
    id: row.id,
    username: row.username,
    name: row.name,
    kelas: row.kelas,
    email: row.email,
    whatsapp: row.whatsapp,
    photoUrl: row.photo_url,
    bio: row.bio,
    records,
  };
}

async function loadGuru(id: string): Promise<GuruProfile | null> {
  const res = await pool.query(
    'SELECT id, username, name, kelas_diampu, photo_url, bio FROM gurus WHERE id = $1',
    [id]
  );
  if (res.rowCount === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    kelasDiampu: row.kelas_diampu || [],
    photoUrl: row.photo_url,
    bio: row.bio,
  };
}

// GET all system data (students + gurus), used on app load
app.get('/api/system-data', async (_req, res) => {
  try {
    const studentIdsRes = await pool.query('SELECT id FROM students');
    const guruIdsRes = await pool.query('SELECT id FROM gurus');

    const students: SystemData['students'] = {};
    for (const row of studentIdsRes.rows) {
      const student = await loadStudent(row.id);
      if (student) students[student.id] = student;
    }

    const gurus: SystemData['gurus'] = {};
    for (const row of guruIdsRes.rows) {
      const guru = await loadGuru(row.id);
      if (guru) gurus[guru.id] = guru;
    }

    res.json({ students, gurus });
  } catch (err) {
    console.error('Failed to load system data', err);
    res.status(500).json({ error: 'Gagal memuat data sistem' });
  }
});

// Register siswa
app.post('/api/students', async (req, res) => {
  try {
    const { username, name, kelas, email, whatsapp, password } = req.body || {};
    if (!username || !String(username).trim() || !name || !String(name).trim() || !password || !String(password).trim()) {
      return res.status(400).json({ error: 'Username, Nama, dan Password wajib diisi' });
    }
    if (!kelas || !email || !whatsapp) {
      return res.status(400).json({ error: 'Semua field wajib diisi untuk siswa' });
    }
    if (!USERNAME_RE.test(normalizeUsername(String(username)))) {
      return res.status(400).json({ error: 'Username hanya boleh berisi huruf, angka, spasi, titik, underscore, dan tanda hubung (3-50 karakter)' });
    }
    const cleanUsername = normalizeUsername(String(username));
    const id = toId(cleanUsername);
    const existing = await pool.query('SELECT id FROM students WHERE id = $1', [id]);
    if ((existing.rowCount ?? 0) > 0) {
      return res.status(409).json({ error: 'Username ini sudah terdaftar. Silakan login atau gunakan username lain.' });
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    await pool.query(
      'INSERT INTO students (id, username, name, kelas, email, whatsapp, password) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, cleanUsername, name, kelas, email, whatsapp, passwordHash]
    );
    const student = await loadStudent(id);
    req.session.userId = id;
    req.session.role = 'siswa';
    res.status(201).json(student);
  } catch (err) {
    console.error('Failed to register student', err);
    res.status(500).json({ error: 'Gagal mendaftarkan siswa' });
  }
});

// Login siswa
app.post('/api/login/siswa', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const id = toId(String(username || ''));
    const passRes = await pool.query('SELECT password FROM students WHERE id = $1', [id]);
    if (passRes.rowCount === 0) {
      return res.status(404).json({ error: 'Username Anda belum terdaftar. Silakan pindah ke tab "Daftar Baru".' });
    }
    const storedHash = passRes.rows[0].password;
    const ok = storedHash ? await bcrypt.compare(String(password || ''), storedHash) : true;
    if (!ok) {
      return res.status(401).json({ error: 'Password salah!' });
    }
    const student = await loadStudent(id);
    req.session.userId = id;
    req.session.role = 'siswa';
    res.json(student);
  } catch (err) {
    console.error('Failed to login siswa', err);
    res.status(500).json({ error: 'Gagal login' });
  }
});

// Login guru
app.post('/api/login/guru', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const id = toId(String(username || ''));
    const passRes = await pool.query('SELECT password FROM gurus WHERE id = $1', [id]);
    if (passRes.rowCount === 0) {
      return res.status(404).json({ error: 'Username Anda belum terdaftar sebagai wali kelas. Silakan hubungi admin.' });
    }
    const storedHash = passRes.rows[0].password;
    const ok = storedHash ? await bcrypt.compare(String(password || ''), storedHash) : true;
    if (!ok) {
      return res.status(401).json({ error: 'Password salah!' });
    }
    const guru = await loadGuru(id);
    req.session.userId = id;
    req.session.role = 'guru';
    res.json(guru);
  } catch (err) {
    console.error('Failed to login guru', err);
    res.status(500).json({ error: 'Gagal login' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// Upsert a daily record (BLP checklist + score) for a student
app.put('/api/students/:id/records/:date', requireAuth('siswa', 'id'), async (req, res) => {
  try {
    const { id, date } = req.params;
    const { completedActivities, score, submissions } = req.body || {};
    const student = await pool.query('SELECT id FROM students WHERE id = $1', [id]);
    if (student.rowCount === 0) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }
    const submissionsJson = JSON.stringify(submissions && typeof submissions === 'object' ? submissions : {});
    await pool.query(
      `INSERT INTO daily_records (student_id, record_date, completed_activities, score, submissions)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (student_id, record_date)
       DO UPDATE SET completed_activities = EXCLUDED.completed_activities, score = EXCLUDED.score, submissions = EXCLUDED.submissions, updated_at = now()`,
      [id, date, Array.isArray(completedActivities) ? completedActivities : [], score ?? null, submissionsJson]
    );
    res.json({
      date,
      completedActivities: Array.isArray(completedActivities) ? completedActivities : [],
      score: score ?? null,
      submissions: submissions && typeof submissions === 'object' ? submissions : {},
    });
  } catch (err) {
    console.error('Failed to update record', err);
    res.status(500).json({ error: 'Gagal menyimpan data BLP' });
  }
});

// Update siswa profile (photo + bio)
app.put('/api/students/:id/profile', requireAuth('siswa', 'id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { photoUrl, bio } = req.body || {};
    const student = await pool.query('SELECT id FROM students WHERE id = $1', [id]);
    if (student.rowCount === 0) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }
    if (typeof photoUrl === 'string' && photoUrl.length > 1_500_000) {
      return res.status(413).json({ error: 'Ukuran foto terlalu besar (maks 1MB)' });
    }
    await pool.query(
      'UPDATE students SET photo_url = $2, bio = $3 WHERE id = $1',
      [id, typeof photoUrl === 'string' ? photoUrl : null, typeof bio === 'string' ? bio : null]
    );
    const updated = await loadStudent(id);
    res.json(updated);
  } catch (err) {
    console.error('Failed to update student profile', err);
    res.status(500).json({ error: 'Gagal menyimpan profil' });
  }
});

// Update guru profile (photo + bio)
app.put('/api/gurus/:id/profile', requireAuth('guru', 'id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { photoUrl, bio } = req.body || {};
    const guru = await pool.query('SELECT id FROM gurus WHERE id = $1', [id]);
    if (guru.rowCount === 0) {
      return res.status(404).json({ error: 'Guru tidak ditemukan' });
    }
    if (typeof photoUrl === 'string' && photoUrl.length > 1_500_000) {
      return res.status(413).json({ error: 'Ukuran foto terlalu besar (maks 1MB)' });
    }
    await pool.query(
      'UPDATE gurus SET photo_url = $2, bio = $3 WHERE id = $1',
      [id, typeof photoUrl === 'string' ? photoUrl : null, typeof bio === 'string' ? bio : null]
    );
    const updated = await loadGuru(id);
    res.json(updated);
  } catch (err) {
    console.error('Failed to update guru profile', err);
    res.status(500).json({ error: 'Gagal menyimpan profil' });
  }
});

async function startServer() {
  const port = Number(process.env.PORT) || 5000;

  if (process.env.NODE_ENV === 'production') {
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const buildPath = path.resolve(currentDir, '../dist');
    app.use(express.static(buildPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
