---
name: Profile photo storage
description: How user profile photos (siswa/guru) are stored and constrained in this app
---

Profile photos are resized client-side to 320x320 JPEG (canvas, quality ~0.82) and stored as a base64 data URL directly in a Postgres TEXT column (`photo_url`) on `students`/`gurus`, not in object storage.

**Why:** Consistent with the existing pattern already used for Qur'an audio submissions (base64 in DB), and avoids adding an object-storage integration for a small-image use case.

**How to apply:** Backend enforces a size guard (~3MB) on the `photoUrl` string in the profile update endpoints. If photo requirements grow (e.g. many large images, video), reconsider moving to object storage instead of growing this pattern further.
