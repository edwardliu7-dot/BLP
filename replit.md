# BLP Harian — SMP TISA Islamic School

A daily behaviour log (Buku Laporan Perilaku) app for SMP TISA Islamic School. Students record their daily Islamic activities; wali kelas (homeroom teachers) review and score them.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS 4
- **Backend:** Express + tsx (TypeScript, no build step in dev)
- **Database:** PostgreSQL (Replit built-in, accessed via `DATABASE_URL`)
- **Session:** express-session, secret in `SESSION_SECRET`

## Run

```
npm run dev     # development (Vite middleware + tsx watch)
npm run build   # production build
npm run start   # production server
```

The workflow "Start application" runs `npm run dev` and serves on port 5000.

## Environment secrets

| Key | Required | Notes |
|-----|----------|-------|
| `SESSION_SECRET` | ✅ set | Express session signing key |

The database is Replit's built-in PostgreSQL — `DATABASE_URL` is injected automatically at runtime.

## Database schema

Tables: `students`, `gurus`, `daily_records`, `nilai`, `blp_periods`.

- `students` / `gurus` — user accounts. **Accounts are NOT created by this app.** They are provisioned by the companion EOB5guru app into the shared database.
- `daily_records` — per-student daily activity completion, score, and submission attachments (audio/text stored as base64 JSONB for up to 7 days).
- `nilai` — quiz/assessment scores per student.
- `blp_periods` — configurable active period (start/end day) per class per month.

## User preferences
