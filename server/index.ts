import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { pool } from './db';
import type { UserProgress, GuruProfile, DailyRecord, SystemData, BlpPeriod, HaidPeriod } from '../src/types';
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
    'SELECT id, username, name, kelas, email, whatsapp, photo_url, bio, quran_bookmark, jenis_kelamin FROM students WHERE id = $1',
    [id]
  );
  if (studentRes.rowCount === 0) return null;
  const row = studentRes.rows[0];

  const [recordsRes, haidRes] = await Promise.all([
    pool.query(
      'SELECT record_date, completed_activities, score, submissions FROM daily_records WHERE student_id = $1',
      [id]
    ),
    pool.query(
      'SELECT id, start_date, end_date FROM haid_periods WHERE student_id = $1 ORDER BY start_date DESC',
      [id]
    ),
  ]);

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

  const haidPeriods: HaidPeriod[] = haidRes.rows.map(r => ({
    id: r.id,
    startDate: r.start_date.toISOString().slice(0, 10),
    endDate: r.end_date ? r.end_date.toISOString().slice(0, 10) : null,
  }));

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
    jenisKelamin: row.jenis_kelamin || null,
    haidPeriods,
    records,
  };
}

// The students/gurus tables are shared with other apps (e.g. "tomat") that can
// write slightly different spellings of a class name (e.g. "Batutah" vs the
// canonical "Batuttah" used throughout this app). Normalize on read so a typo
// in kelas_diampu never silently hides an entire class's students from a wali
// kelas's dashboard.
// Lowercase, strip punctuation/spaces, and collapse repeated consecutive
// letters (so "Batuttah" and "Batutah" produce the same key) before matching
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

// Build a student profile response (no records) used by login and session restore.
// Records are loaded lazily by the dashboard on demand.
async function buildSiswaProfileResponse(userId: string): Promise<{
  student: UserProgress;
  blpPeriods: SystemData['blpPeriods'];
} | null> {
  const [profileRes, haidRes, periodsRes] = await Promise.all([
    pool.query(
      'SELECT id, username, name, kelas, email, whatsapp, photo_url, bio, quran_bookmark, jenis_kelamin FROM students WHERE id = $1',
      [userId]
    ),
    pool.query(
      'SELECT id, start_date, end_date FROM haid_periods WHERE student_id = $1 ORDER BY start_date DESC',
      [userId]
    ),
    pool.query('SELECT kelas, year, month, start_day, end_day FROM blp_periods'),
  ]);

  if ((profileRes.rowCount ?? 0) === 0) return null;
  const row = profileRes.rows[0];
  const kelas = normalizeKelas(row.kelas);

  const haidPeriods: HaidPeriod[] = haidRes.rows.map(r => ({
    id: r.id,
    startDate: r.start_date.toISOString().slice(0, 10),
    endDate: r.end_date ? r.end_date.toISOString().slice(0, 10) : null,
  }));

  const blpPeriods: SystemData['blpPeriods'] = {};
  for (const period of periodsRes.rows) {
    if (normalizeKelas(period.kelas) !== kelas) continue;
    blpPeriods[blpPeriodKey(kelas, period.year, period.month)] = {
      startDay: period.start_day,
      endDay: period.end_day,
    };
  }

  const student: UserProgress = {
    id: row.id,
    username: row.username,
    name: row.name,
    kelas,
    email: row.email,
    whatsapp: row.whatsapp,
    photoUrl: row.photo_url,
    bio: row.bio,
    quranBookmark: row.quran_bookmark || null,
    jenisKelamin: row.jenis_kelamin || null,
    haidPeriods,
    records: {}, // No records on login/restore — loaded lazily by the dashboard
  };

  return { student, blpPeriods };
}

// GET dashboard data scoped to the logged-in user's role.
// Siswa: NOT called on login anymore — profile + blpPeriods are returned by the
//   login endpoint directly, and records are lazy-loaded by the dashboard.
// Guru: only students in their wali kelas + blpPeriods for that class.
app.get('/api/me/dashboard-data', async (req, res) => {
  if (!req.session.userId || !req.session.role) {
    return res.status(401).json({ error: 'Anda harus login untuk melakukan ini' });
  }
  try {
    if (req.session.role === 'siswa') {
      // Siswa should not call this endpoint anymore — kept for backward compat only.
      const profile = await buildSiswaProfileResponse(req.session.userId);
      if (!profile) return res.status(404).json({ error: 'Siswa tidak ditemukan' });
      return res.json({ students: { [profile.student.id]: profile.student }, gurus: {}, blpPeriods: profile.blpPeriods });
    }

    // Guru — load only the wali's own class
    const guru = await loadGuru(req.session.userId);
    if (!guru) return res.status(403).json({ error: 'Hanya wali kelas yang dapat mengakses ini' });

    const kelasWali = guru.kelasWali[0];

    // Phase 1a: Resolve all DB kelas spellings that normalise to kelasWali.
    // The students table is written by an external app and may have spelling
    // variants (e.g. "Batutah" vs "Batuttah"). We cannot express our JS
    // normalisation in SQL, so we first fetch the small set of distinct kelas
    // values, find the ones that match, then use WHERE kelas = ANY($1) in the
    // heavy query — avoiding a full-table scan on students.
    const distinctKelasRes = await pool.query('SELECT DISTINCT kelas FROM students');
    const matchingKelasValues: string[] = distinctKelasRes.rows
      .map((r: { kelas: string }) => r.kelas)
      .filter((k: string) => normalizeKelas(k) === kelasWali);

    // Phase 1b: Fetch only this class's students WITHOUT photo_url (base64
    // photos can be several MB each and are the main cause of slow / timed-out
    // loads on mobile).
    const studentRes = matchingKelasValues.length > 0
      ? await pool.query(
          'SELECT id, username, name, kelas, email, whatsapp, bio, quran_bookmark, jenis_kelamin FROM students WHERE kelas = ANY($1)',
          [matchingKelasValues]
        )
      : { rows: [] as any[] };

    const classStudentIds: string[] = [];
    const classStudentRows: typeof studentRes.rows = [];
    for (const row of studentRes.rows) {
      classStudentIds.push(row.id);
      classStudentRows.push(row);
    }

    // Phase 2: Fetch only records/haid for this class's students, plus blp_periods.
    // Using ANY($1) keeps a single round-trip and avoids a full-table scan.
    const noRows = { rows: [] as any[] };
    const [recordsRes, periodsRes, haidRes] = await Promise.all([
      classStudentIds.length > 0
        ? pool.query(
            'SELECT student_id, record_date, completed_activities, score, submissions FROM daily_records WHERE student_id = ANY($1)',
            [classStudentIds]
          )
        : Promise.resolve(noRows),
      pool.query('SELECT kelas, year, month, start_day, end_day FROM blp_periods'),
      classStudentIds.length > 0
        ? pool.query(
            'SELECT id, student_id, start_date, end_date FROM haid_periods WHERE student_id = ANY($1) ORDER BY start_date DESC',
            [classStudentIds]
          )
        : Promise.resolve(noRows),
    ]);

    // Group records by student_id
    const recordsByStudent: Record<string, Record<string, DailyRecord>> = {};
    for (const r of recordsRes.rows) {
      const dateKey = r.record_date.toISOString().slice(0, 10);
      if (!recordsByStudent[r.student_id]) recordsByStudent[r.student_id] = {};
      recordsByStudent[r.student_id][dateKey] = {
        date: dateKey,
        completedActivities: r.completed_activities || [],
        score: r.score,
        submissions: r.submissions || {},
      };
    }

    // Group haid periods by student_id
    const haidByStudent: Record<string, HaidPeriod[]> = {};
    for (const r of haidRes.rows) {
      if (!haidByStudent[r.student_id]) haidByStudent[r.student_id] = [];
      haidByStudent[r.student_id].push({
        id: r.id,
        startDate: r.start_date.toISOString().slice(0, 10),
        endDate: r.end_date ? r.end_date.toISOString().slice(0, 10) : null,
      });
    }

    // Build students map — photoUrl is intentionally omitted here.
    // The frontend fetches it lazily via GET /api/students/:id/photo.
    const students: SystemData['students'] = {};
    for (const row of classStudentRows) {
      const student: UserProgress = {
        id: row.id,
        username: row.username,
        name: row.name,
        kelas: normalizeKelas(row.kelas),
        email: row.email,
        whatsapp: row.whatsapp,
        photoUrl: null, // loaded on-demand; see /api/students/:id/photo
        bio: row.bio,
        quranBookmark: row.quran_bookmark || null,
        jenisKelamin: row.jenis_kelamin || null,
        haidPeriods: haidByStudent[row.id] || [],
        records: recordsByStudent[row.id] || {},
      };
      students[student.id] = student;
    }

    // Filter blpPeriods to this class only
    const blpPeriods: SystemData['blpPeriods'] = {};
    for (const row of periodsRes.rows) {
      if (normalizeKelas(row.kelas) !== kelasWali) continue;
      blpPeriods[blpPeriodKey(normalizeKelas(row.kelas), row.year, row.month)] = {
        startDay: row.start_day,
        endDay: row.end_day,
      };
    }

    return res.json({ students, gurus: { [guru.id]: guru }, blpPeriods });
  } catch (err) {
    console.error('Failed to load dashboard data', err);
    res.status(500).json({ error: 'Gagal memuat data dashboard' });
  }
});

// GET all system data (students + gurus + BLP active-period settings), used on app load.
// Uses bulk queries instead of per-row queries to avoid N+1 performance issues.
app.get('/api/system-data', async (_req, res) => {
  try {
    // Three bulk queries instead of 2N+M individual queries
    const [studentRes, recordsRes, guruRes] = await Promise.all([
      pool.query(
        'SELECT id, username, name, kelas, email, whatsapp, photo_url, bio, quran_bookmark FROM students'
      ),
      pool.query(
        'SELECT student_id, record_date, completed_activities, score, submissions FROM daily_records'
      ),
      pool.query(
        'SELECT id, username, name, jabatan, wali_kelas_kelas, photo_url, bio FROM gurus'
      ),
    ]);

    // Group daily records by student_id in memory
    const recordsByStudent: Record<string, Record<string, DailyRecord>> = {};
    for (const r of recordsRes.rows) {
      const dateKey = r.record_date.toISOString().slice(0, 10);
      if (!recordsByStudent[r.student_id]) recordsByStudent[r.student_id] = {};
      recordsByStudent[r.student_id][dateKey] = {
        date: dateKey,
        completedActivities: r.completed_activities || [],
        score: r.score,
        submissions: r.submissions || {},
      };
    }

    // Assemble student map
    const students: SystemData['students'] = {};
    for (const row of studentRes.rows) {
      const student: UserProgress = {
        id: row.id,
        username: row.username,
        name: row.name,
        kelas: normalizeKelas(row.kelas),
        email: row.email,
        whatsapp: row.whatsapp,
        photoUrl: row.photo_url,
        bio: row.bio,
        quranBookmark: row.quran_bookmark || null,
        records: recordsByStudent[row.id] || {},
      };
      students[student.id] = student;
    }

    // Assemble guru map (wali kelas only)
    const gurus: SystemData['gurus'] = {};
    for (const row of guruRes.rows) {
      if (!isWaliKelas(row)) continue;
      const guru: GuruProfile = {
        id: row.id,
        username: row.username,
        name: row.name,
        kelasWali: [normalizeKelas(row.wali_kelas_kelas)],
        photoUrl: row.photo_url,
        bio: row.bio,
      };
      gurus[guru.id] = guru;
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
    // Verify password first (cheap query), then fetch full profile.
    const userRes = await pool.query(
      'SELECT password FROM students WHERE id = $1',
      [id]
    );
    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: 'Username atau password salah. Jika Anda belum memiliki akun, silakan hubungi wali kelas Anda.' });
    }
    const ok = await verifyPassword(String(password || ''), userRes.rows[0].password);
    if (!ok) {
      return res.status(401).json({ error: 'Username atau password salah. Silakan hubungi wali kelas Anda jika Anda lupa akun.' });
    }
    req.session.userId = id;
    req.session.role = 'siswa';
    // Return full profile + blpPeriods (no records) so the dashboard can
    // render immediately without a second round-trip after login.
    const profile = await buildSiswaProfileResponse(id);
    if (!profile) return res.status(404).json({ error: 'Data siswa tidak ditemukan' });
    res.json({ id, name: profile.student.name, kelas: profile.student.kelas, student: profile.student, blpPeriods: profile.blpPeriods });
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
    // Fetch password + wali kelas check fields in one query (was two round-trips).
    const userRes = await pool.query(
      'SELECT password, name, jabatan, wali_kelas_kelas FROM gurus WHERE id = $1',
      [id]
    );
    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: 'Username Anda belum terdaftar sebagai wali kelas. Silakan hubungi admin.' });
    }
    const ok = await verifyPassword(String(password || ''), userRes.rows[0].password);
    if (!ok) {
      return res.status(401).json({ error: 'Password salah!' });
    }
    // BLP is only for wali kelas (homeroom teachers) — a guru who only
    // teaches a subject (kelas_diampu, used by the "tomat" app) but is not
    // wali kelas for any class must not be able to log in here.
    const row = userRes.rows[0];
    if (!isWaliKelas(row)) {
      return res.status(403).json({ error: 'Hanya wali kelas yang dapat login di aplikasi BLP. Akun Anda bukan wali kelas.' });
    }
    req.session.userId = id;
    req.session.role = 'guru';
    // Return only what the client uses; dashboard data loaded via /api/me/dashboard-data.
    res.json({ id, name: row.name, kelasWali: [normalizeKelas(row.wali_kelas_kelas)] });
  } catch (err) {
    console.error('Failed to login guru', err);
    res.status(500).json({ error: 'Gagal login' });
  }
});

// GET lightweight calendar presence check for the logged-in student.
// Returns only { dates: string[] } — the dates that have at least 1 activity
// checked. Keeps the calendar dot query as cheap as possible: one row per
// filled day, no activity details, no submissions.
app.get('/api/me/calendar/:year/:month', requireAuth('siswa'), async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Tahun/bulan tidak valid' });
    }
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear  = month === 12 ? year + 1 : year;
    const endDate   = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const result = await pool.query(
      `SELECT record_date
         FROM daily_records
        WHERE student_id = $1
          AND record_date >= $2
          AND record_date < $3
          AND array_length(completed_activities, 1) > 0
        ORDER BY record_date`,
      [req.session.userId!, startDate, endDate]
    );

    const dates = result.rows.map(r => (r.record_date as Date).toISOString().slice(0, 10));
    return res.json({ dates });
  } catch (err) {
    console.error('Failed to load calendar data', err);
    return res.status(500).json({ error: 'Gagal memuat kalender' });
  }
});

// Return the current session's user profile (used to restore session on page load).
// Siswa: returns full profile + blpPeriods (no records — loaded lazily by dashboard).
// Guru: returns minimal auth info — full data comes from /api/me/dashboard-data.
app.get('/api/auth/me', async (req, res) => {
  try {
    if (!req.session.userId || !req.session.role) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    if (req.session.role === 'guru') {
      const guru = await loadGuru(req.session.userId);
      if (!guru) return res.status(403).json({ error: 'Not a wali kelas' });
      return res.json({ role: 'guru', userId: guru.id, name: guru.name, kelasWali: guru.kelasWali });
    } else {
      const profile = await buildSiswaProfileResponse(req.session.userId);
      if (!profile) return res.status(404).json({ error: 'Student not found' });
      return res.json({ role: 'siswa', userId: profile.student.id, name: profile.student.name, kelas: profile.student.kelas, student: profile.student, blpPeriods: profile.blpPeriods });
    }
  } catch (err) {
    console.error('Failed to fetch auth/me', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET a single day's full record for the logged-in student (on-demand when user taps a date).
app.get('/api/me/record/:date', requireAuth('siswa'), async (req, res) => {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Format tanggal tidak valid' });
    }
    const result = await pool.query(
      'SELECT record_date, completed_activities, score, submissions FROM daily_records WHERE student_id = $1 AND record_date = $2',
      [req.session.userId!, date]
    );
    if ((result.rowCount ?? 0) === 0) {
      // No record yet — return an empty record (student hasn't filled BLP for this date)
      return res.json({ date, completedActivities: [], score: null, submissions: {} });
    }
    const r = result.rows[0];
    return res.json({
      date,
      completedActivities: r.completed_activities || [],
      score: r.score ?? null,
      submissions: r.submissions || {},
    });
  } catch (err) {
    console.error('Failed to load record', err);
    return res.status(500).json({ error: 'Gagal memuat data harian' });
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

// Start a haid period for a female student (today becomes start_date)
app.post('/api/students/:id/haid', requireAuth('siswa', 'id'), async (req, res) => {
  try {
    const { id } = req.params;
    const today = getJakartaTodayDateString();

    const studentRes = await pool.query('SELECT jenis_kelamin FROM students WHERE id = $1', [id]);
    if (studentRes.rowCount === 0) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }
    if (studentRes.rows[0].jenis_kelamin === 'L') {
      return res.status(400).json({ error: 'Fitur ini hanya tersedia untuk siswa perempuan' });
    }

    // Prevent double-open periods
    const openRes = await pool.query(
      'SELECT id FROM haid_periods WHERE student_id = $1 AND end_date IS NULL',
      [id]
    );
    if ((openRes.rowCount ?? 0) > 0) {
      return res.status(409).json({ error: 'Masih ada periode haid yang belum ditutup' });
    }

    const result = await pool.query(
      'INSERT INTO haid_periods (student_id, start_date) VALUES ($1, $2) RETURNING id, start_date',
      [id, today]
    );
    res.json({
      id: result.rows[0].id,
      startDate: result.rows[0].start_date.toISOString().slice(0, 10),
      endDate: null,
    } satisfies HaidPeriod);
  } catch (err) {
    console.error('Failed to start haid period', err);
    res.status(500).json({ error: 'Gagal mencatat awal haid' });
  }
});

// End the current open haid period (today becomes end_date)
app.put('/api/students/:id/haid/end', requireAuth('siswa', 'id'), async (req, res) => {
  try {
    const { id } = req.params;
    const today = getJakartaTodayDateString();

    const result = await pool.query(
      `UPDATE haid_periods
       SET end_date = $2, updated_at = now()
       WHERE student_id = $1 AND end_date IS NULL
       RETURNING id, start_date, end_date`,
      [id, today]
    );
    if ((result.rowCount ?? 0) === 0) {
      return res.status(404).json({ error: 'Tidak ada periode haid yang sedang aktif' });
    }
    res.json({
      id: result.rows[0].id,
      startDate: result.rows[0].start_date.toISOString().slice(0, 10),
      endDate: result.rows[0].end_date.toISOString().slice(0, 10),
    } satisfies HaidPeriod);
  } catch (err) {
    console.error('Failed to end haid period', err);
    res.status(500).json({ error: 'Gagal mencatat akhir haid' });
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

// Guru: fetch a single student's photo on-demand.
// Photo (base64) is excluded from /api/me/dashboard-data to keep that
// response small enough to load quickly on mobile connections.
app.get('/api/students/:id/photo', requireAuth('guru'), async (req, res) => {
  try {
    const guru = await loadGuru(req.session.userId!);
    if (!guru) return res.status(403).json({ error: 'Akses ditolak' });

    const result = await pool.query(
      'SELECT photo_url, kelas FROM students WHERE id = $1',
      [req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Siswa tidak ditemukan' });

    const row = result.rows[0];
    if (!guru.kelasWali.includes(normalizeKelas(row.kelas))) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    res.json({ photoUrl: row.photo_url || null });
  } catch (err) {
    console.error('Failed to fetch student photo', err);
    res.status(500).json({ error: 'Gagal mengambil foto' });
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
  // Add jenis_kelamin column to students if not yet present (idempotent migration).
  // students is owned by the external EOB5guru app — skip gracefully if not present.
  await pool.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'jenis_kelamin' AND table_schema = 'public') THEN
          ALTER TABLE students ADD COLUMN jenis_kelamin text CHECK (jenis_kelamin IN ('L', 'P'));
        END IF;
      END IF;
    END $$
  `);
  // Haid period tracking for female students.
  // Conditional: haid_periods references students(id) — skip if students doesn't exist yet.
  await pool.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'haid_periods' AND table_schema = 'public') THEN
          CREATE TABLE haid_periods (
            id serial PRIMARY KEY,
            student_id text NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            start_date date NOT NULL,
            end_date date,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
          );
        END IF;
      END IF;
    END $$
  `);
  // Performance indexes — only if the referenced tables exist (students is owned
  // by the external EOB5guru app and may not be present in a fresh dev DB).
  await pool.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students' AND table_schema = 'public') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_students_kelas ON students (kelas)';
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'haid_periods' AND table_schema = 'public') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_haid_periods_student_id ON haid_periods (student_id)';
      END IF;
    END $$
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
