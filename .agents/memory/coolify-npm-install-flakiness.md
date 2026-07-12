---
name: Coolify/external Docker build npm install failures
description: BLP app deploys to a self-hosted Coolify VPS; npm ci during Docker build repeatedly hung or died with cryptic errors. Root cause was NOT VPS network flakiness — it was Replit's internal package-firewall proxy baked into the committed lockfile.
---

**Real root cause (confirmed):** This Replit project's local npm is configured to resolve
packages through Replit's internal proxy (`http://package-firewall.replit.local/npm/...`),
which only resolves inside the Replit sandbox. When `package-lock.json` is generated/updated
from inside Replit, many `"resolved"` fields get written pointing at that internal host.
`npm ci` trusts those exact URLs, so any build running outside Replit (GitHub Actions runner,
a Coolify VPS, any external CI) gets `ENOTFOUND`/hangs/timeouts trying to reach a hostname
that doesn't exist outside Replit's network. This produced misleading symptoms that looked
like network flakiness or npm bugs: multi-minute hangs, exit code 255, and npm's own
"Exit handler never called!" defect surfacing after failed fetches.

**Why:** Earlier debugging wrongly concluded the *target VPS's* network was flaky. The real
signal was in `package-lock.json` itself — grep it for `package-firewall.replit.local` in
`"resolved"` fields whenever a Docker/CI build that runs *outside* Replit fails to install
dependencies with hangs or unresolved-host errors.

**How to apply / fix:** Since `package-firewall` proxy URLs use the exact same path structure
as the public registry (just `http://package-firewall.replit.local/npm/<pkg>/-/<file>.tgz` vs
`https://registry.npmjs.org/<pkg>/-/<file>.tgz`), a safe fix is a straight string replace in
`package-lock.json`:
`sed -i 's#http://package-firewall.replit.local/npm/#https://registry.npmjs.org/#g' package-lock.json`
This preserves versions/integrity hashes (content-identical tarballs) and made `npm ci` work
cleanly in a clean external test directory. Do NOT try to fix this by deleting/regenerating
the lockfile with `npm install --package-lock-only` from inside Replit — the sandbox's global
npm config (`omit-lockfile-registry-resolved`, custom registry) produces a lockfile with no
`"resolved"`/`"integrity"` fields at all, which is not portable either. Always verify the fix
by running `npm ci` against the fixed lockfile in a directory/environment without Replit's
npm config present.
