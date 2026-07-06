import express from 'express';
import { pool } from './db';
import type { UserProgress, GuruProfile, DailyRecord, SystemData } from '../src/types';

const app = express();
app.use(express.json());

function toId(username: string) {
  return username.trim().toLowerCase().replace(/\s+/g, '-');
}

async function loadStudent(id: string): Promise<UserProgress | null> {
  const studentRes = await pool.query(
    'SELECT id, username, name, kelas, email, whatsapp, password FROM students WHERE id = $1',
    [id]
  );
  if (studentRes.rowCount === 0) return null;
  const row = studentRes.rows[0];

  const recordsRes = await pool.query(
    'SELECT record_date, completed_activities, score FROM daily_records WHERE student_id = $1',
    [id]
  );
  const records: Record<string, DailyRecord> = {};
  for (const r of recordsRes.rows) {
    const dateKey = r.record_date.toISOString().slice(0, 10);
    records[dateKey] = {
      date: dateKey,
      completedActivities: r.completed_activities || [],
      score: r.score,
    };
  }

  return {
    id: row.id,
    username: row.username,
    name: row.name,
    kelas: row.kelas,
    email: row.email,
    whatsapp: row.whatsapp,
    password: row.password,
    records,
  };
}

async function loadGuru(id: string): Promise<GuruProfile | null> {
  const res = await pool.query(
    'SELECT id, username, name, kelas_diampu, password FROM gurus WHERE id = $1',
    [id]
  );
  if (res.rowCount === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    kelasDiampu: row.kelas_diampu || [],
    password: row.password,
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
    const id = toId(username);
    const existing = await pool.query('SELECT id FROM students WHERE id = $1', [id]);
    if ((existing.rowCount ?? 0) > 0) {
      return res.status(409).json({ error: 'Username ini sudah terdaftar. Silakan login atau gunakan username lain.' });
    }
    await pool.query(
      'INSERT INTO students (id, username, name, kelas, email, whatsapp, password) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, username, name, kelas, email, whatsapp, password]
    );
    const student = await loadStudent(id);
    res.status(201).json(student);
  } catch (err) {
    console.error('Failed to register student', err);
    res.status(500).json({ error: 'Gagal mendaftarkan siswa' });
  }
});

// Register guru
app.post('/api/gurus', async (req, res) => {
  try {
    const { username, name, kelasDiampu, password } = req.body || {};
    if (!username || !String(username).trim() || !name || !String(name).trim() || !password || !String(password).trim()) {
      return res.status(400).json({ error: 'Username, Nama, dan Password wajib diisi' });
    }
    if (!Array.isArray(kelasDiampu) || kelasDiampu.length === 0) {
      return res.status(400).json({ error: 'Kelas yang diampu wajib diisi' });
    }
    const id = toId(username);
    const existing = await pool.query('SELECT id FROM gurus WHERE id = $1', [id]);
    if ((existing.rowCount ?? 0) > 0) {
      return res.status(409).json({ error: 'Username ini sudah terdaftar. Silakan login atau gunakan username lain.' });
    }
    await pool.query(
      'INSERT INTO gurus (id, username, name, kelas_diampu, password) VALUES ($1, $2, $3, $4, $5)',
      [id, username, name, kelasDiampu, password]
    );
    const guru = await loadGuru(id);
    res.status(201).json(guru);
  } catch (err) {
    console.error('Failed to register guru', err);
    res.status(500).json({ error: 'Gagal mendaftarkan guru' });
  }
});

// Login siswa
app.post('/api/login/siswa', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const id = toId(String(username || ''));
    const student = await loadStudent(id);
    if (!student) {
      return res.status(404).json({ error: 'Username Anda belum terdaftar. Silakan pindah ke tab "Daftar Baru".' });
    }
    if (student.password && student.password !== password) {
      return res.status(401).json({ error: 'Password salah!' });
    }
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
    const guru = await loadGuru(id);
    if (!guru) {
      return res.status(404).json({ error: 'Username Anda belum terdaftar. Silakan pindah ke tab "Daftar Baru".' });
    }
    if (guru.password && guru.password !== password) {
      return res.status(401).json({ error: 'Password salah!' });
    }
    res.json(guru);
  } catch (err) {
    console.error('Failed to login guru', err);
    res.status(500).json({ error: 'Gagal login' });
  }
});

// Upsert a daily record (BLP checklist + score) for a student
app.put('/api/students/:id/records/:date', async (req, res) => {
  try {
    const { id, date } = req.params;
    const { completedActivities, score } = req.body || {};
    const student = await pool.query('SELECT id FROM students WHERE id = $1', [id]);
    if (student.rowCount === 0) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }
    await pool.query(
      `INSERT INTO daily_records (student_id, record_date, completed_activities, score)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (student_id, record_date)
       DO UPDATE SET completed_activities = EXCLUDED.completed_activities, score = EXCLUDED.score, updated_at = now()`,
      [id, date, Array.isArray(completedActivities) ? completedActivities : [], score ?? null]
    );
    res.json({
      date,
      completedActivities: Array.isArray(completedActivities) ? completedActivities : [],
      score: score ?? null,
    });
  } catch (err) {
    console.error('Failed to update record', err);
    res.status(500).json({ error: 'Gagal menyimpan data BLP' });
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
