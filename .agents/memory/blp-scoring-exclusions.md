---
name: BLP scoring exclusions
description: How weekend exclusion and per-class active periods affect BLP daily/recap scoring without blocking student input.
---

Two independent exclusion rules affect BLP (Buku Laporan Pribadi) scoring, both implemented
as pure helpers in `src/utils/blpScoring.ts` and consumed by both `GuruDashboard.tsx` and
`SiswaDashboard.tsx` (and `rekapExport.ts` for PDF/Excel export) so the three surfaces never
drift out of sync:

1. **Weekend exclusion for school-only activities.** Only two activity ids (`r1` — datang ke
   sekolah tepat waktu, `rp1` — menyiapkan perlengkapan sekolah sendiri) are excluded on
   Saturday/Sunday, since school only runs Mon–Fri. All other activities still count on
   weekends.
2. **Per-class-per-month active scoring period.** A wali kelas sets a start/end day (1–31)
   per class per month via `blp_periods` (kelas+year+month primary key). Days outside that
   range are **not blocked** — students can still fill the checklist normally — but those
   days are silently excluded from averages/recap/PDF/Excel totals.

**Why:** Both rules change what counts toward the denominator/numerator of a score, not
whether a student can act. Mixing "excluded from scoring" with "disabled in UI" caused
confusion early on — the decision was: input always allowed, exclusion is scoring-only.

**How to apply:** Any new place that computes a completion percentage, average, or count
for BLP data must use `getEffectiveTotalActivities`/`getEffectiveCompletedCount` (per-day)
and `isDateCountedForRecap` (per-day-in-range) from `blpScoring.ts` instead of hand-rolling
`ALL_ACTIVITY_IDS.length` or `daysInMonth.length` — otherwise it will silently disagree with
the dashboards and exports.
