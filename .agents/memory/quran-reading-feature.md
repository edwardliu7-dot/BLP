---
name: Quran reading activity (surah/ayat/page picker + bookmark)
description: How the "Membaca Al-Qur'an" BLP activity lets students pick what to read and resume via a bookmark.
---

The Quran reading activity (`d5`) previously always showed Al-Fatihah with no way to
track progress. It now lets the student choose Surah+ayat range OR a mushaf page
number (1-604) before recording, and keeps a persistent "bookmark" (next
surah/ayat or page) so they can continue instead of re-reading the same surah.

**Why:** teacher/user explicitly asked that students not always read the same
surah, and be able to resume from where they left off across days.

**How to apply:**
- Surah metadata (114 entries: name, ayat count, revelation place) lives in
  `src/data/quran.ts`, sourced once from the public quran.com API — if ayat
  counts ever look wrong, re-fetch from that API rather than hand-editing.
- The bookmark is per-student, not per-day, so it's stored as a `quran_bookmark`
  JSONB column directly on the `students` table (not inside `daily_records`),
  with its own `PUT /api/students/:id/quran-bookmark` route — daily records
  still only hold the submission (which surah/ayat/page was actually read that day).
- Advancing the bookmark on submit: if reading by page, bump the page by 1; if
  reading by ayat and the range reached the end of the surah, jump to ayat 1 of
  the next surah; otherwise just advance to the next ayat.
