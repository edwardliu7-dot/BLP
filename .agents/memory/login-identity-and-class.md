---
name: Login identity & class field decisions
description: How student/teacher login identity (username vs id vs name) and the kelas (class) field are structured
---

- The database `id` primary key is derived from `username` (slugified: lowercase, spaces→hyphens), not from `name`. Both `students` and `gurus` tables have a separate `username` column (unique) alongside `id`, `name`.
- Login endpoints (`/api/login/siswa`, `/api/login/guru`) look up by slugified `username`, not by `name`. Registration endpoints require `username` to be unique (checked via `id` collision since `id = toId(username)`).

**Why:** The user wanted an easy, stable login identifier separate from a person's full display name (which can have duplicates or change). Name remains a free-text display field; username is the login key.

**How to apply:** If adding new user-facing identity fields, keep this split — `id` (internal key) is always derived from `username`, never from `name`. Any future auth flow should query by username, not name.

- `kelas` (class) is a fixed enum of exactly 3 values, exported as `KELAS_OPTIONS` in `src/types.ts`: "VII Ibnu Batutah", "VIII Ibnu Sina", "IX Al Khawarizmi". Students pick one via a `<select>`; teachers (`kelasDiampu`) pick a subset via checkboxes. This is not free text — do not revert to a text input without explicit user request.
