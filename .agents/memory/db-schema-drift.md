---
name: DB schema vs server code drift
description: This app's server code can reference columns that don't actually exist in the dev database (found via runtime 42703 errors, not static analysis).
---

The `server/index.ts` queries assume columns (`username`, `photo_url`, `bio` on `students`/`gurus`; `submissions` on `daily_records`) that were missing from the actual dev database — registration/login/BLP-record-save were completely broken (500 errors) despite the code looking correct and the app "running" with no startup errors, because the tables were empty so the bug never surfaced until a real INSERT/SELECT touched the missing column.

**Why:** Schema and server code are maintained separately here (no ORM/migration file to diff against); a code review alone won't catch this — you have to actually exercise the write path (e.g. `curl` a POST/PUT) against real data, not just read the code.

**How to apply:** When bug-hunting or reviewing this app, don't trust that "server starts + no console errors" means the API works. Run `SELECT column_name FROM information_schema.columns WHERE table_name='X'` for every table touched by server/index.ts and diff against the SELECT/INSERT column lists, or just exercise each endpoint with curl.
