---
name: Wali kelas (homeroom teacher) class scoping
description: How teacher accounts are scoped to a class, and a data-quality trap in the shared students/gurus tables.
---

`gurus.kelas_diampu` (TEXT[]) determines which students a teacher account sees
in GuruDashboard (`allowedClasses.includes(s.kelas)`). Each real wali kelas
should be scoped to exactly one class; only genuine admin/overview accounts
(confirmed with the user) are allowed to see all three classes.

**Why:** the students/gurus tables are shared with another app ("tomat") that
also writes into them, and at one point wrote "VII Ibnu Battutah" (extra `t`)
into `kelas_diampu` while student rows used the canonical "VII Ibnu Batutah" —
that silently hid all of class VII from every teacher whose `kelas_diampu`
had the typo, and separately most teacher accounts had all 3 classes assigned
instead of just their own (a data-assignment bug, not a code bug).

**How to apply:** the server normalizes class-name spelling on every read
(`normalizeKelas` in `server/index.ts`, matches after lowercasing, stripping
punctuation, and collapsing repeated consecutive letters) so a future typo
variant from the shared app can't hide a class again — but a *wrong class
list* (e.g. a teacher assigned 3 classes when they should only see 1) is a
data problem, not something normalization can fix. If a "wali kelas can't
see students" or "sees the wrong students" report comes up again, check
`gurus.kelas_diampu` in the DB first, and confirm the intended per-teacher
class assignment with the user before changing it — don't guess from name/role.
