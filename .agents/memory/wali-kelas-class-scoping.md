---
name: Wali kelas (homeroom teacher) class scoping
description: How BLP teacher accounts are scoped to a class, and a data-quality trap in the shared students/gurus tables.
---

BLP login and student-data access must be scoped by `gurus.jabatan` (must include
`'wali_kelas'`) and `gurus.wali_kelas_kelas` (a single class name) — never by
`gurus.kelas_diampu` (TEXT[], the subjects-taught list used by the separate "tomat"
app). A guru who teaches a subject but is not wali kelas for any class must be
rejected at `/api/login/guru`, not merely hidden in the UI.

**Why:** `kelas_diampu` is shared with "tomat" (a different app, different login
population — only Matematika teachers) and represents *subjects taught*, which is a
completely different concept from *homeroom responsibility*. An earlier version of
this app mistakenly scoped guru access using `kelas_diampu`, which let any subject
teacher log into BLP and see every class they taught rather than only their homeroom
class. The user explicitly corrected this: only wali kelas may use BLP, scoped to
`wali_kelas_kelas`.

**How to apply:** `loadGuru` in `server/index.ts` returns `null` (treated as "not
a valid BLP user") for any guru row where `isWaliKelas()` is false; the login route
turns that into a 403 with a message telling the user only wali kelas can log in.
`GuruProfile.kelasWali` (frontend/shared type) holds `[wali_kelas_kelas]`, and
`GuruDashboard`'s `allowedClasses` reads from `auth.kelasWali`. Class-name spelling
is still normalized on every read via `normalizeKelas` (lowercases, strips
punctuation, collapses repeated letters) so a shared-app spelling variant (e.g.
"Batutah" vs "Batuttah") can't hide a class. If a "wali kelas can't see students" or
"wrong guru can log in" report comes up again, check `jabatan` and
`wali_kelas_kelas` in the DB first — don't assume `kelas_diampu` is relevant to BLP.
