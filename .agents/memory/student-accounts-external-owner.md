---
name: Student accounts owned by EOB5guru
description: This BLP app must never create, register, or generate student/guru accounts itself — that is the exclusive job of a separate app.
---

Student (and guru) accounts for this BLP app are provisioned by a completely different
application called **EOB5guru**, used by wali kelas outside of this codebase. This BLP app
only ever *reads* those accounts from the shared Postgres database (`students`, `gurus`
tables) — the same sharing pattern already known for the "tomat" app.

**Why:** An earlier session misread "wali kelas generates accounts" as a feature request
for *this* app and built a full generate-account UI + endpoint inside BLP. The user
corrected this firmly — account creation for students/guru must stay entirely outside this
app's responsibility. It was fully reverted.

**How to apply:** Do not add any student/guru registration, account-generation, or
password-reset feature to this app, even if a request sounds like it implies one. If a
request talks about accounts being created "by wali kelas" or "by admin," ask explicitly
whether that happens in this app or in EOB5guru/another external app before writing any
code. This app's job is strictly: authenticate against existing rows, and otherwise treat
account lifecycle as owned externally.
