---
name: Workflow restart after dev script change
description: Editing package.json scripts (e.g. dev command) does not affect an already-running workflow process; must explicitly restart it.
---

When package.json's `dev`/`start` script is changed (e.g. switching from a plain `vite` dev server to a custom Express+Vite middleware server), the currently running workflow process keeps executing the OLD command until it is explicitly restarted. File edits alone (even ones that trigger Vite HMR reconnects) do not respawn the underlying shell process that the workflow launched.

**Why:** After rewriting the dev command from `vite --port=5000` to `tsx watch server/index.ts`, new API routes returned the SPA's `index.html` instead of JSON for a while — the browser was still being served by the stale `vite` process from before the script change, not the new server. `ps aux` confirmed the old `vite` binary was still running.

**How to apply:** Any time you change the command a workflow runs (package.json scripts, run command, entrypoint), explicitly call the workflow restart tool afterward and verify with `ps aux` / a direct `curl` to the new routes before assuming the change took effect. Don't rely on HMR log activity as a sign the new process is live.
