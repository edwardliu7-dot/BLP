import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { pool } from './db';
import type { UserProgress, GuruProfile, DailyRecord, SystemData, BlpPeriod } from '../src/types';
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
// write slightly different spellings of a class name (e.g. "Batutah" vs the
// canonical "Battutah" used throughout this app). Normalize on read so a typo
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

// Only a wali kelas (homeroom teacher) may use BLP, and their access is scoped
// to the class they are wali kelas *for* (wali_kelas_kelas), never to the
// subject classes they teach (kelas_diampu) — that scoping is "tomat"'s job.
function isWaliKelas(row: { jabatan: string[] | null; wali_kelas_kelas: string | null }): boolean {
  return !!(row.jabatan || []).includes('wali_kelas') && !!row.wali_kelas_kelas;
}

async function loadGuru(id: string): Promise<GuruProfile | null> {
  const res = await pool.query(
    'SELECT id, username, name, jabatan, wali_kelas_kelas, photo_url, bio FROM gurus WHERE id = $1',
    [id]
  );
  if (res.rowCount === 0) return null;
  const row = res.rows[0];
  if (!isWaliKelas(row)) return null;
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    kelasWali: [normalizeKelas(row.wali_kelas_kelas)],
    photoUrl: row.photo_url,
    bio: row.bio,
  };
}

function blpPeriodKey(kelas: string, year: number, month: number): string {
  return `${kelas}__${year}-${String(month).padStart(2, '0')}`;
}

async function loadBlpPeriods(): Promise<SystemData['blpPeriods']> {
  const res = await pool.query('SELECT kelas, year, month, start_day, end_day FROM blp_periods');
  const periods: SystemData['blpPeriods'] = {};
  for (const row of res.rows) {
    periods[blpPeriodKey(normalizeKelas(row.kelas), row.year, row.month)] = {
      startDay: row.start_day,
      endDay: row.end_day,
    };
  }
  return periods;
}

// GET all system data (students + gurus + BLP active-period settings), used on app load
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

    const blpPeriods = await loadBlpPeriods();

    res.json({ students, gurus, blpPeriods });
  } catch (err) {
    console.error('Failed to load system data', err);
    res.status(500).json({ error: 'Gagal memuat data sistem' });
  }
});

// Guru: set the active BLP date range (1-31) for a class in a given month.
// Days outside this range are not counted in that class's monthly recap.
// Only a guru who actually teaches the class may configure it.
app.put('/api/blp-periods', requireAuth('guru'), async (req, res) => {
  try {
    const { kelas, year, month, startDay, endDay } = req.body || {};
    if (
      typeof kelas !== 'string' || !kelas.trim() ||
      !Number.isInteger(year) || year < 2000 || year > 2100 ||
      !Number.isInteger(month) || month < 1 || month > 12 ||
      !Number.isInteger(startDay) || startDay < 1 || startDay > 31 ||
      !Number.isInteger(endDay) || endDay < 1 || endDay > 31 ||
      endDay < startDay
    ) {
      return res.status(400).json({ error: 'Data rentang tanggal aktif BLP tidak valid' });
    }
    const guru = await loadGuru(req.session.userId!);
    if (!guru) {
      return res.status(404).json({ error: 'Akun guru tidak ditemukan' });
    }
    const targetKelas = normalizeKelas(kelas);
    if (!guru.kelasWali.includes(targetKelas)) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk mengatur kelas ini' });
    }
    await pool.query(
      `INSERT INTO blp_periods (kelas, year, month, start_day, end_day, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (kelas, year, month)
       DO UPDATE SET start_day = EXCLUDED.start_day, end_day = EXCLUDED.end_day, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [targetKelas, year, month, startDay, endDay, guru.id]
    );
    res.json({ kelas: targetKelas, year, month, startDay, endDay } as { kelas: string; year: number; month: number } & BlpPeriod);
  } catch (err) {
    console.error('Failed to save BLP period', err);
    res.status(500).json({ error: 'Gagal menyimpan rentang tanggal aktif BLP' });
  }
});

// Login siswa
app.post('/api/login/siswa', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const id = toId(String(username || ''));
    const passRes = await pool.query('SELECT password FROM students WHERE id = $1', [id]);
    if (passRes.rowCount === 0) {
      return res.status(404).json({ error: 'Username atau password salah. Jika Anda belum memiliki akun, silakan hubungi wali kelas Anda.' });
    }
    const ok = await verifyPassword(String(password || ''), passRes.rows[0].password);
    if (!ok) {
      return res.status(401).json({ error: 'Username atau password salah. Silakan hubungi wali kelas Anda jika Anda lupa akun.' });
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
    // BLP is only for wali kelas (homeroom teachers) — a guru who only
    // teaches a subject (kelas_diampu, used by the "tomat" app) but is not
    // wali kelas for any class must not be able to log in here.
    const guru = await loadGuru(id);
    if (!guru) {
      return res.status(403).json({ error: 'Hanya wali kelas yang dapat login di aplikasi BLP. Akun Anda bukan wali kelas.' });
    }
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
// requesting guru is wali kelas for (kelasWali), same scoping rule used for
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
    if (!guru.kelasWali.includes(studentKelas)) {
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
    if (!guru.kelasWali.includes(studentKelas)) {
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

// In-memory cache for the Al-Qur'an text proxy (per-surah), since surah text
// never changes and the upstream API has no need to be hit more than once.
const quranSurahCache = new Map<number, { arabic: string[]; translations: string[] }>();

// Proxy for Al-Qur'an ayat text (Arabic + Indonesian translation), so the
// Qur'an reading modal can display the text to read instead of requiring the
// student to already own a physical mushaf. Fetched from equran.id (public,
// no key required) and cached in memory per surah.
app.get('/api/quran/surah/:no', async (req, res) => {
  try {
    const no = Number(req.params.no);
    if (!Number.isInteger(no) || no < 1 || no > 114) {
      return res.status(400).json({ error: 'Nomor surah tidak valid' });
    }
    if (quranSurahCache.has(no)) {
      return res.json(quranSurahCache.get(no));
    }
    const upstream = await fetch(`https://equran.id/api/v2/surat/${no}`);
    if (!upstream.ok) {
      return res.status(502).json({ error: 'Gagal mengambil teks Al-Qur\'an' });
    }
    const body = await upstream.json();
    const ayatList = body?.data?.ayat || [];
    const result = {
      arabic: ayatList.map((a: any) => a.teksArab || ''),
      translations: ayatList.map((a: any) => a.teksIndonesia || ''),
    };
    quranSurahCache.set(no, result);
    res.json(result);
  } catch (err) {
    console.error('Failed to fetch quran surah text', err);
    res.status(502).json({ error: 'Gagal mengambil teks Al-Qur\'an' });
  }
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blp_periods (
      kelas text NOT NULL,
      year integer NOT NULL,
      month integer NOT NULL,
      start_day integer NOT NULL,
      end_day integer NOT NULL,
      updated_by text,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (kelas, year, month)
    )
  `);
}

async function startServer() {
  await ensureSchema();
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
