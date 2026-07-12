---
name: Replit-to-GitHub push workaround
description: What to do when the built-in gitPush/createPullRequest callbacks fail against a connected GitHub repo even after reconnecting the integration.
---

Seen: `gitPush`/`createPullRequest` from a Replit session consistently failed with
`PUSH_REJECTED` / "Invalid username or token", even after two full disconnect/reconnect
cycles of the GitHub connection in Replit's Git pane, and even though repo permissions on
GitHub's side were confirmed fine (user is sole owner/admin).

**Why:** Root cause was never fully isolated (looks like a Replit-side git integration auth
bug), but a reliable workaround exists.

**How to apply:** Ask the user for a GitHub Personal Access Token (classic, `repo` scope is
simplest and reliably works; fine-grained needs "Contents: Read and write" on the specific
repo) via `requestSecrets`. Then push directly with git, bypassing Replit's git integration
entirely:
1. `git fetch <token-auth-url> main:refs/remotes/tmp-origin-main` to pull remote state without
   touching the broken `origin` credential path (fetching via plain `origin` still fails with
   the same broken credential helper — must use the authenticated URL directly for every git
   network operation, not just push).
2. Merge/rebase local work onto that ref if histories diverged (common when the user has been
   editing files manually via the GitHub web UI as their own workaround).
3. Push with `git push https://x-access-token:<url-encoded-token>@github.com/<owner>/<repo>.git HEAD:main`
   (embed as an argument, not `git remote set-url`, to avoid leaving a token in git config).
   URL-encode the token (`encodeURIComponent`) — unencoded tokens with certain characters can
   trigger a "Malformed input to a URL function" error from git that looks unrelated to auth.
4. Never print the raw token in logs/output; redact it from any captured stdout/stderr before
   logging.
Caution: if the user pastes the token directly into a chat/comment field instead of the secure
secret form, treat it as exposed — use it once if needed, then tell them to revoke and
regenerate it via GitHub settings.
