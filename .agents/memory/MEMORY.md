# Memory Index

- [Workflow restart after dev script change](workflow-restart-after-script-change.md) — editing package.json's dev script does NOT restart an already-running workflow; the old process keeps serving until explicitly restarted.
- [Login identity & class field](login-identity-and-class.md) — id/login key is derived from username (not name); kelas is a fixed 3-option enum, not free text.
- [BLP activity submissions](blp-activity-submissions.md) — some checklist activities require a modal submission (audio/text) before they can be marked done; stored as JSONB per daily record.
- [Profile photo storage](profile-photo-storage.md) — profile photos stored as base64 data URL in Postgres TEXT column, not object storage.
- [DB schema vs server code drift](db-schema-drift.md) — server code can reference DB columns that don't actually exist; verify with information_schema or curl, not just code reading.
- [Coolify/external Docker build npm failures](coolify-npm-install-flakiness.md) — real cause was Replit's internal package-firewall proxy URLs baked into package-lock.json, not VPS network flakiness; fix with a sed replace.
- [Replit-to-GitHub push failures](replit-github-push-workaround.md) — gitPush/createPullRequest can fail with invalid-token errors even after reconnecting; a user-supplied classic PAT pushed via git CLI is a working fallback.
- [Coolify healthcheck needs curl](coolify-healthcheck-curl.md) — Coolify rolls back an otherwise-healthy deploy if the image lacks curl/wget for its healthcheck probe.
- [Quran reading feature](quran-reading-feature.md) — surah/ayat/page picker + per-student bookmark for the "Membaca Al-Qur'an" activity; bookmark lives on students table, not daily_records.
- [Wali kelas class scoping](wali-kelas-class-scoping.md) — gurus.kelas_diampu typos/over-broad assignments can hide or leak students; server normalizes spelling but class-list correctness needs user confirmation.
- [BLP scoring exclusions](blp-scoring-exclusions.md) — school-only activities (r1/rp1) skip weekends; per-class-per-month active period excludes days from averages without blocking input; shared blpScoring.ts is the single source of truth.
- [Redacting secrets in exec output](redact-secret-in-exec-output.md) — mask both raw AND URL-encoded/transformed forms of a secret before logging command output, or transformed forms leak past a naive string replace.
