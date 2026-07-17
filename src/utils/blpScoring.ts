/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BLP_CATEGORIES } from '../data/activities';

// Points that only make sense on a school day (e.g. "datang ke sekolah tepat
// waktu"). They are excluded from the daily total and from monthly recap
// scoring on Saturday/Sunday, per the school's own weekday-only policy.
export const SCHOOL_ONLY_ACTIVITY_IDS = ['r1', 'rp1'];

export const ALL_ACTIVITY_IDS: string[] = BLP_CATEGORIES.flatMap(cat => cat.activities.map(a => a.id));

// School days are Monday - Friday; Saturday/Sunday are non-school days.
export function isSchoolDay(date: Date): boolean {
  const dow = date.getDay(); // 0 = Sunday, 6 = Saturday
  return dow >= 1 && dow <= 5;
}

// Which activity ids actually apply/count for a given date.
export function getEffectiveActivityIds(date: Date): string[] {
  if (isSchoolDay(date)) return ALL_ACTIVITY_IDS;
  return ALL_ACTIVITY_IDS.filter(id => !SCHOOL_ONLY_ACTIVITY_IDS.includes(id));
}

export function getEffectiveTotalActivities(date: Date): number {
  return getEffectiveActivityIds(date).length;
}

// How many of a day's completed activities actually count toward that day's
// score (in case a school-only activity was somehow marked done on a
// non-school day, e.g. a record filled before the class's period was set).
export function getEffectiveCompletedCount(date: Date, completedActivities: string[]): number {
  const effective = new Set(getEffectiveActivityIds(date));
  return completedActivities.filter(id => effective.has(id)).length;
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
