# Memory Index

- [Workflow restart after dev script change](workflow-restart-after-script-change.md) — editing package.json's dev script does NOT restart an already-running workflow; the old process keeps serving until explicitly restarted.
- [Login identity & class field](login-identity-and-class.md) — id/login key is derived from username (not name); kelas is a fixed 3-option enum, not free text.
- [BLP activity submissions](blp-activity-submissions.md) — some checklist activities require a modal submission (audio/text) before they can be marked done; stored as JSONB per daily record.
- [Profile photo storage](profile-photo-storage.md) — profile photos stored as base64 data URL in Postgres TEXT column, not object storage.
- [DB schema vs server code drift](db-schema-drift.md) — server code can reference DB columns that don't actually exist; verify with information_schema or curl, not just code reading.
- [Coolify/external Docker build npm failures](coolify-npm-install-flakiness.md) — real cause was Replit's internal package-firewall proxy URLs baked into package-lock.json, not VPS network flakiness; fix with a sed replace.
- [Replit-to-GitHub push failures](replit-github-push-workaround.md) — gitPush/createPullRequest can fail with invalid-token errors even after reconnecting; a user-supplied classic PAT pushed via git CLI is a working fallback.
