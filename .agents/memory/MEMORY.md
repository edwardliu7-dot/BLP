# Memory Index

- [Workflow restart after dev script change](workflow-restart-after-script-change.md) — editing package.json's dev script does NOT restart an already-running workflow; the old process keeps serving until explicitly restarted.
- [Login identity & class field](login-identity-and-class.md) — id/login key is derived from username (not name); kelas is a fixed 3-option enum, not free text.
- [BLP activity submissions](blp-activity-submissions.md) — some checklist activities require a modal submission (audio/text) before they can be marked done; stored as JSONB per daily record.
