/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BLP_CATEGORIES } from '../data/activities';
import type { HaidPeriod } from '../types';

// Points that only make sense on a school day *and* only blocked on both
// Saturday AND Sunday (e.g. "datang ke sekolah tepat waktu").
export const SCHOOL_ONLY_ACTIVITY_IDS = ['r1'];

// Points that are only blocked on Saturday (not Sunday): preparing school
// equipment the night before makes sense on Sunday night for Monday school.
export const SATURDAY_ONLY_BLOCK_IDS = ['rp1'];

// During haid, these activities are automatically credited so female students
// are not penalised for exemptions mandated by Islamic jurisprudence.
export const HAID_AUTO_CREDIT_IDS = ['d1', 'd5'];

export const ALL_ACTIVITY_IDS: string[] = BLP_CATEGORIES.flatMap(cat => cat.activities.map(a => a.id));

// School days are Monday - Friday; Saturday/Sunday are non-school days.
export function isSchoolDay(date: Date): boolean {
  const dow = date.getDay(); // 0 = Sunday, 6 = Saturday
  return dow >= 1 && dow <= 5;
}

export function isSaturday(date: Date): boolean {
  return date.getDay() === 6;
}

export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

// Which activity ids actually apply/count for a given date.
// • r1  — blocked on Saturday AND Sunday
// • rp1 — blocked only on Saturday (allowed on Sunday: prepare tonight for Monday)
export function getEffectiveActivityIds(date: Date): string[] {
  return ALL_ACTIVITY_IDS.filter(id => {
    if (SCHOOL_ONLY_ACTIVITY_IDS.includes(id) && !isSchoolDay(date)) return false;
    if (SATURDAY_ONLY_BLOCK_IDS.includes(id) && isSaturday(date)) return false;
    return true;
  });
}

export function getEffectiveTotalActivities(date: Date): number {
  return getEffectiveActivityIds(date).length;
}

// Convert a Date to a YYYY-MM-DD string in local time (safe for comparisons
// with date strings stored in the database).
export function dateToKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Return true if `date` falls within any of the student's haid periods.
export function isHaidDay(date: Date, haidPeriods?: HaidPeriod[]): boolean {
  if (!haidPeriods || haidPeriods.length === 0) return false;
  const key = dateToKey(date);
  return haidPeriods.some(p => p.startDate <= key && (p.endDate === null || p.endDate >= key));
}

// How many of a day's completed activities actually count toward that day's
// score. On haid days, HAID_AUTO_CREDIT_IDS are added automatically so
// female students are not penalised for prayer/Quran exemptions.
export function getEffectiveCompletedCount(
  date: Date,
  completedActivities: string[],
  haidPeriods?: HaidPeriod[],
): number {
  const effective = new Set(getEffectiveActivityIds(date));
  const completed = new Set(completedActivities.filter(id => effective.has(id)));

  // Auto-credit haid activities on qualifying days
  if (isHaidDay(date, haidPeriods)) {
    for (const id of HAID_AUTO_CREDIT_IDS) {
      if (effective.has(id)) completed.add(id);
    }
  }

  return completed.size;
}

export interface BlpPeriod {
  startDay: number; // 1-31, inclusive
  endDay: number; // 1-31, inclusive
}

// Key used to store/look up a class's active BLP period for a given month in
// SystemData.blpPeriods, e.g. "VII Ibnu Batuttah__2026-07".
export function getBlpPeriodKey(kelas: string, year: number, month: number): string {
  return `${kelas}__${year}-${String(month).padStart(2, '0')}`;
}

export function getBlpPeriodKeyForDate(kelas: string, date: Date): string {
  return getBlpPeriodKey(kelas, date.getFullYear(), date.getMonth() + 1);
}

// Whether a given date falls inside the class's configured active BLP
// period for that month. If no period has been configured for that
// kelas+month, every day counts (backward-compatible default).
export function isDateWithinActivePeriod(
  date: Date,
  kelas: string,
  blpPeriods: Record<string, BlpPeriod> | undefined
): boolean {
  if (!blpPeriods) return true;
  const period = blpPeriods[getBlpPeriodKeyForDate(kelas, date)];
  if (!period) return true;
  const day = date.getDate();
  return day >= period.startDay && day <= period.endDay;
}

// Whether a record for this date should count toward the monthly recap/score
// at all: it must both fall within the class's active period.
export function isDateCountedForRecap(
  date: Date,
  kelas: string,
  blpPeriods: Record<string, BlpPeriod> | undefined
): boolean {
  return isDateWithinActivePeriod(date, kelas, blpPeriods);
}
