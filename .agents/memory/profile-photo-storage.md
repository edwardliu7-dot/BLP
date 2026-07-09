---
name: Profile photo storage
description: How user profile photos (siswa/guru) are stored and constrained in this app
---

Profile photos are resized client-side to 320x320 JPEG (canvas, quality ~0.82) and stored as a base64 data URL directly in a Postgres TEXT column (`photo_url`) on `students`/`gurus`, not in object storage.

**Why:** Consistent with the existing pattern already used for Qur'an audio submissions (base64 in DB), and avoids adding an object-storage integration for a small-image use case.

**How to apply:** Backend enforces a size guard (~1MB decoded / 1.5M base64 chars) on the `photoUrl` string in the profile update endpoints. Photo upload flow: file select → crop UI (react-easy-crop, round crop, zoom slider) → canvas-based compress loop that reduces JPEG quality then output size until under 1MB, then submit. If photo requirements grow (e.g. many large images, video), reconsider moving to object storage instead of growing this pattern further.

Express's `express.json()` defaults to a 100KB body limit — this silently 413s any request with a base64 photo over ~75KB decoded, with no useful error message (body-parser rejects before the route's own size-guard code even runs). Any endpoint accepting base64 file data in JSON must set `express.json({ limit: '<size>' })` sized to the largest expected payload, not rely on app-level checks alone.

A separate "tomat" app (SMP TISA math app) shares the same Neon Postgres DB and reads/writes the exact same `students`/`gurus` tables (same `id`/`username`/`photo_url`/`bio` columns) — so profile edits in either app are automatically visible in the other with no extra sync code, as long as both apps keep using this shared schema.
