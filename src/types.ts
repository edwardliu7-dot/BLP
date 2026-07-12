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

export interface ActivitySubmission {
  type: 'text' | 'audio' | 'checklist';
  content?: string; // free text content, or base64 data URL for audio
  charCount?: number;
  items?: Record<string, boolean>; // for checklist submissions: item id -> checked
  recordedAt: string; // ISO timestamp
}

export interface DailyRecord {
  date: string; // ISO format date (YYYY-MM-DD)
  completedActivities: string[]; // List of activity IDs
  score?: number | null; // Teacher's score 0-100
  submissions?: Record<string, ActivitySubmission>; // activityId -> submission
}

export const KELAS_OPTIONS = ['VII Ibnu Batutah', 'VIII Ibnu Sina', 'IX Al Khawarizmi'] as const;

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
  records: Record<string, DailyRecord>;
}

export interface GuruProfile {
  id: string;
  username: string;
  name: string;
  kelasDiampu: string[];
  password?: string;
  photoUrl?: string | null;
  bio?: string | null;
}

export interface SystemData {
  students: Record<string, UserProgress>;
  gurus: Record<string, GuruProfile>;
}

export type Role = 'siswa' | 'guru' | null;

export interface AuthState {
  role: Role;
  userId?: string;
  name?: string;
  kelas?: string;
  kelasDiampu?: string[];
}
