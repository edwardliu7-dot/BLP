/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Activity {
  id: string;
  name: string;
  target: string;
}

export interface Category {
  id: string;
  name: string;
  label: string;
  activities: Activity[];
}

export interface QuranReadingRef {
  surahNo: number;
  surahName: string;
  ayatFrom: number;
  ayatTo: number;
  halaman?: number | null; // optional page number (1-604), alternative to ayat
}

export interface ActivitySubmission {
  type: 'text' | 'audio' | 'checklist';
  content?: string; // free text content, or base64 data URL for audio
  charCount?: number;
  items?: Record<string, boolean>; // for checklist submissions: item id -> checked
  quranRef?: QuranReadingRef; // for Quran reading (audio) submissions: which surah/ayat/page was read
  recordedAt: string; // ISO timestamp
  reviewedAt?: string | null; // set the first time a guru opens/reviews this submission
  expired?: boolean; // true once the uploaded content (e.g. audio) has been auto-deleted, 7 days after reviewedAt
}

export interface QuranBookmark {
  surahNo: number;
  surahName: string;
  ayat: number; // next ayat to continue from
  halaman?: number | null;
  updatedAt: string; // ISO timestamp
}

export interface DailyRecord {
  date: string; // ISO format date (YYYY-MM-DD)
  completedActivities: string[]; // List of activity IDs
  score?: number | null; // Teacher's score 0-100
  submissions?: Record<string, ActivitySubmission>; // activityId -> submission
}

export const KELAS_OPTIONS = ['VII Ibnu Battutah', 'VIII Ibnu Sina', 'IX Al Khawarizmi'] as const;

export interface UserProgress {
  id: string;
  username: string;
  name: string;
  kelas: string;
  email: string;
  whatsapp: string;
  password?: string;
  photoUrl?: string | null;
  bio?: string | null;
  quranBookmark?: QuranBookmark | null;
  records: Record<string, DailyRecord>;
}

export interface GuruProfile {
  id: string;
  username: string;
  name: string;
  // The class(es) this guru is the *wali kelas* (homeroom teacher) for — not
  // the classes they teach a subject in. Only wali kelas may log into BLP,
  // and their student data access is scoped to this, not "kelas diampu".
  kelasWali: string[];
  password?: string;
  photoUrl?: string | null;
  bio?: string | null;
}

export interface BlpPeriod {
  startDay: number; // 1-31, inclusive
  endDay: number; // 1-31, inclusive
}

export interface SystemData {
  students: Record<string, UserProgress>;
  gurus: Record<string, GuruProfile>;
  blpPeriods: Record<string, BlpPeriod>; // key: `${kelas}__${year}-${month}`
}

export type Role = 'siswa' | 'guru' | null;

export interface AuthState {
  role: Role;
  userId?: string;
  name?: string;
  kelas?: string;
  kelasWali?: string[];
}
