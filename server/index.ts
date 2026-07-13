import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { pool } from './db';
import type { UserProgress, GuruProfile, DailyRecord, SystemData } from '../src/types';
import { KELAS_OPTIONS } from '../src/types';

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

// School operates on Indonesian (WIB/Jakarta) time regardless of the
// server's own timezone, so "today" for BLP purposes must be computed in
// Asia/Jakarta rather than the server's local/UTC clock.
const JAKARTA_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function getJakartaTodayDateString(): string {
  // en-CA formats as YYYY-MM-DD
  return JAKARTA_DATE_FORMATTER.format(new Date());
}

const BCRYPT_HASH_RE = /^\$2[aby]\$/;

// This database is shared with other apps (e.g. "tomat") that write plaintext
// passwords into the same students/gurus tables. Accept either: a bcrypt hash
// (accounts registered through this app) or a plaintext match (legacy/other-app
// accounts), so cross-app login keeps working without silently locking out
// accounts this app didn't create.
async function verifyPassword(inputPassword: string, storedPassword: string | null): Promise<boolean> {
  if (!storedPassword) return true;
  if (BCRYPT_HASH_RE.test(storedPassword)) {
    return bcrypt.compare(inputPassword, storedPassword);
  }
  return inputPassword === storedPassword;
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
    'SELECT id, username, name, kelas, email, whatsapp, photo_url, bio, quran_bookmark FROM students WHERE id = $1',
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
    kelas: normalizeKelas(row.kelas),
    email: row.email,
    whatsapp: row.whatsapp,
    photoUrl: row.photo_url,
    bio: row.bio,
    quranBookmark: row.quran_bookmark || null,
    records,
  };
}

// The students/gurus tables are shared with other apps (e.g. "tomat") that can
// write slightly different spellings of a class name (e.g. "Battutah" vs the
// canonical "Batutah" used throughout this app). Normalize on read so a typo
// in kelas_diampu never silently hides an entire class's students from a wali
// kelas's dashboard.
// Lowercase, strip punctuation/spaces, and collapse repeated consecutive
// letters (so "Battutah" and "Batutah" produce the same key) before matching
// against the canonical class list.
function kelasMatchKey(kelas: string): string {
  return kelas
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(.)\1+/g, '$1');
}

const KELAS_CANONICAL_BY_KEY: Record<string, string> = Object.fromEntries(
  KELAS_OPTIONS.map(k => [kelasMatchKey(k), k])
);

function normalizeKelas(kelas: string): string {
  return KELAS_CANONICAL_BY_KEY[kelasMatchKey(kelas)] || kelas;
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
    kelasDiampu: (row.kelas_diampu || []).map(normalizeKelas),
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
    const ok = await verifyPassword(String(password || ''), passRes.rows[0].password);
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
    const ok = await verifyPassword(String(password || ''), passRes.rows[0].password);
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
    if (date !== getJakartaTodayDateString()) {
      return res.status(403).json({ error: 'BLP hanya bisa diisi untuk hari ini. Tanggal yang sudah lewat atau belum tiba tidak dapat diubah.' });
    }
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

// Update siswa's Al-Qur'an reading bookmark (persists across days)
app.put('/api/students/:id/quran-bookmark', requireAuth('siswa', 'id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { surahNo, surahName, ayat, halaman } = req.body || {};
    if (typeof surahNo !== 'number' || typeof surahName !== 'string' || typeof ayat !== 'number') {
      return res.status(400).json({ error: 'Data penanda tidak valid' });
    }
    const student = await pool.query('SELECT id FROM students WHERE id = $1', [id]);
    if (student.rowCount === 0) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }
    const bookmark = {
      surahNo,
      surahName,
      ayat,
      halaman: typeof halaman === 'number' ? halaman : null,
      updatedAt: new Date().toISOString(),
    };
    await pool.query(
      'UPDATE students SET quran_bookmark = $2::jsonb WHERE id = $1',
      [id, JSON.stringify(bookmark)]
    );
    res.json(bookmark);
  } catch (err) {
    console.error('Failed to update quran bookmark', err);
    res.status(500).json({ error: 'Gagal menyimpan penanda bacaan' });
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

// Guru: delete a student's account permanently. Only allowed for a class the
// requesting guru actually teaches (kelasDiampu), same scoping rule used for
// viewing the class roster.
app.delete('/api/students/:id', requireAuth('guru'), async (req, res) => {
  try {
    const { id } = req.params;
    const guru = await loadGuru(req.session.userId!);
    if (!guru) {
      return res.status(404).json({ error: 'Akun guru tidak ditemukan' });
    }
    const studentRes = await pool.query('SELECT id, kelas FROM students WHERE id = $1', [id]);
    if (studentRes.rowCount === 0) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }
    const studentKelas = normalizeKelas(studentRes.rows[0].kelas);
    if (!guru.kelasDiampu.includes(studentKelas)) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk menghapus siswa dari kelas ini' });
    }
    // Clean up every table known to reference students(id) before deleting
    // the student itself, so a stray foreign key from an unrelated feature
    // (e.g. quiz scores in `nilai`) never silently blocks the deletion.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM daily_records WHERE student_id = $1', [id]);
      await client.query('DELETE FROM nilai WHERE student_id = $1', [id]);
      await client.query('DELETE FROM students WHERE id = $1', [id]);
      await client.query('COMMIT');
    } catch (innerErr) {
      await client.query('ROLLBACK');
      throw innerErr;
    } finally {
      client.release();
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete student', err);
    const detail = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Gagal menghapus akun siswa: ${detail}` });
  }
});

// Guru: mark a submission as reviewed (first-open only; re-opening does not
// reset the clock). This starts the 7-day countdown before the uploaded
// content (e.g. an audio recording) is auto-deleted by purgeExpiredSubmissions.
app.put('/api/students/:id/records/:date/submissions/:activityId/review', requireAuth('guru'), async (req, res) => {
  try {
    const { id, date, activityId } = req.params;
    const guru = await loadGuru(req.session.userId!);
    if (!guru) {
      return res.status(404).json({ error: 'Akun guru tidak ditemukan' });
    }
    const studentRes = await pool.query('SELECT kelas FROM students WHERE id = $1', [id]);
    if (studentRes.rowCount === 0) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }
    const studentKelas = normalizeKelas(studentRes.rows[0].kelas);
    if (!guru.kelasDiampu.includes(studentKelas)) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke data siswa ini' });
    }
    const recordRes = await pool.query(
      'SELECT submissions FROM daily_records WHERE student_id = $1 AND record_date = $2',
      [id, date]
    );
    if (recordRes.rowCount === 0) {
      return res.status(404).json({ error: 'Data BLP untuk tanggal ini tidak ditemukan' });
    }
    const submissions = recordRes.rows[0].submissions || {};
    const submission = submissions[activityId];
    if (!submission) {
      return res.status(404).json({ error: 'Tidak ada tugas yang dikumpulkan untuk kegiatan ini' });
    }
    if (!submission.reviewedAt) {
      submission.reviewedAt = new Date().toISOString();
      submissions[activityId] = submission;
      await pool.query(
        'UPDATE daily_records SET submissions = $3::jsonb WHERE student_id = $1 AND record_date = $2',
        [id, date, JSON.stringify(submissions)]
      );
    }
    res.json(submission);
  } catch (err) {
    console.error('Failed to mark submission reviewed', err);
    res.status(500).json({ error: 'Gagal menandai tugas sebagai ditinjau' });
  }
});

const SUBMISSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// Uploaded submission content (e.g. base64 audio recordings) is deleted 7
// days after a guru first reviews it, to avoid keeping large media forever.
// The submission's metadata (recordedAt, quranRef, charCount) is kept so the
// activity still shows as completed; only the heavy `content` is wiped.
async function purgeExpiredSubmissions() {
  const cutoff = Date.now() - SUBMISSION_EXPIRY_MS;
  try {
    const res = await pool.query(
      `SELECT student_id, record_date, submissions FROM daily_records
       WHERE submissions IS NOT NULL AND submissions::text LIKE '%reviewedAt%'`
    );
    for (const row of res.rows) {
      const submissions = row.submissions || {};
      let changed = false;
      for (const activityId of Object.keys(submissions)) {
        const sub = submissions[activityId];
        if (sub && sub.content && sub.reviewedAt && !sub.expired) {
          const reviewedTime = new Date(sub.reviewedAt).getTime();
          if (!isNaN(reviewedTime) && reviewedTime <= cutoff) {
            const { content, ...rest } = sub;
            submissions[activityId] = { ...rest, expired: true };
            changed = true;
          }
        }
      }
      if (changed) {
        const dateKey = row.record_date.toISOString().slice(0, 10);
        await pool.query(
          'UPDATE daily_records SET submissions = $3::jsonb WHERE student_id = $1 AND record_date = $2',
          [row.student_id, dateKey, JSON.stringify(submissions)]
        );
      }
    }
  } catch (err) {
    console.error('Failed to purge expired submissions', err);
  }
}

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

  // Run once at startup, then hourly, so expired attachments don't linger
  // indefinitely if the server was down when they crossed the 7-day mark.
  purgeExpiredSubmissions();
  setInterval(purgeExpiredSubmissions, 60 * 60 * 1000);
}

startServer();
