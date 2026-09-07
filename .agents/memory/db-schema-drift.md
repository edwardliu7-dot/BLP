---
name: DB schema vs server code drift
description: This app's server code can reference columns that don't actually exist, and the running app may use Neon rather than the Replit database callback target.
---

The `server/index.ts` queries assume columns (`username`, `photo_url`, `bio` on `students`/`gurus`; `submissions` on `daily_records`) that were missing from an earlier development database — registration/login/BLP-record-save were completely broken (500 errors) despite the code looking correct and the app "running" with no startup errors, because the tables were empty so the bug never surfaced until a real INSERT/SELECT touched the missing column. The server prefers `NEON_DATABASE_URL` over `DATABASE_URL`, so `executeSql()` against Replit's built-in database may not represent the database used by the running workflow.

**Why:** Schema and server code are maintained separately here (no ORM/migration file to diff against), and there can be more than one configured database — a code review or query against the wrong database won't catch this. You have to exercise the endpoint against the same environment the workflow uses.

**How to apply:** When bug-hunting or reviewing this app, first confirm which connection string `server/db.ts` selects without printing its value. Then run schema checks against that same database or exercise each endpoint with curl; don't trust that "server starts + no console errors" means the API works.
