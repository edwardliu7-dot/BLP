---
name: BLP activity submissions
description: How specific BLP checklist activities require proof-of-work (audio/text) before being marked complete
---

Some daily BLP checklist items cannot simply be checked off — they require the student to complete a submission first:
- "Membaca Al Qur'an" (activity id `d5`): opens a modal showing Qur'an text with an audio-recording feature (MediaRecorder API); the checkbox only ticks after a recording is finished. Audio is stored as a base64 data URL.
- "Belajar setiap hari min. 30 menit" (`rs1`) and "Evaluasi Diri Sebelum Tidur" (`rf3`): require a free-text write-up of at least 100 words before submission is allowed. The 100-word minimum is enforced in the UI but never displayed as an instruction to the student.
- All RECIPROCITY (Kemandirian) category activities (`rp1`-`rp4`): require a free-text description of the activity performed, no minimum word count.

**Why:** The school wants proof of engagement, not just a checkbox, for reflective/knowledge activities and for self-directed ones.

**How to apply:** Submissions are stored per activity per day in a `submissions` JSONB column on `daily_records` (keyed by activity id, containing `{type, content, wordCount?, recordedAt}`). If new checklist activities are added that should also require proof, extend the special-activity-id config in `SiswaDashboard.tsx` (`getSubmissionConfig` / `QURAN_ACTIVITY_ID`) rather than introducing a new mechanism. Unchecking a completed special activity clears its stored submission.
