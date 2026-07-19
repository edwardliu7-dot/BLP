---
name: Loading performance architecture
description: How the app avoids slow initial load — key decisions for the data-fetch and bundle strategy.
---

# Loading performance architecture

## Rule
Never fetch server data before the login page is visible. All data fetching happens post-login, scoped to the logged-in user only.

**Why:** The original `/api/system-data` fetched ALL students + ALL records in a full-table scan before showing anything — the login form was blocked until this completed. With many students and records this easily exceeded 3 seconds.

**How to apply:**
- Login page (`src/components/Login.tsx`) requires zero server calls to render. `App.tsx` sets status → `'login'` from localStorage check (synchronous) with no await.
- After login, `handleLogin` in `App.tsx` calls `GET /api/me/dashboard-data` (session-auth'd). For siswa: returns only their record + their kelas blpPeriods. For guru: returns only their class's students + blpPeriods.
- The old `/api/system-data` endpoint is kept for backward compat but is no longer called by the frontend.

## Bundle splitting
- `SiswaDashboard` and `GuruDashboard` are `React.lazy` imports — a student never downloads teacher code.
- `vite.config.ts` `manualChunks`: `vendor-export` (jspdf + exceljs + xlsx), `vendor-motion`, `vendor-react`.
- `optimizeDeps.include` pre-bundles heavy libs at dev server start.

## Session restore flow
On page reload: check `localStorage` for `AUTH_KEY`. If present → `GET /api/me/dashboard-data` (validates session server-side). If 401 → clear localStorage, show login. If no stored auth → show login immediately (no network call).
