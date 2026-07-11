---
name: Coolify Docker build npm install flakiness
description: BLP app deploys to a self-hosted Coolify VPS; npm install/ci during Docker build has repeatedly hung or died with "Exit handler never called!" due to that server's flaky network to the npm registry/GitHub, not app code bugs.
---

The Coolify VPS hosting this app (157.10.161.229) has unreliable outbound network to
external package sources during builds. Symptoms seen across multiple deploy attempts:
- Nixpacks build: `npm install` died with npm's own "Exit handler never called!" bug,
  and separately, fetching nixpkgs from GitHub hung for 7+ minutes before timing out.
- Switched to a plain Dockerfile (node:20-slim + `npm ci`) to avoid Nix entirely — this
  fixed the nixpkgs slowness, but `npm ci` still hit "Exit handler never called!" once
  (a real npm bug, triggered right after npm's own registry version-check network call)
  and once just hung completely for 2.5+ minutes with zero output until an external
  kill (exit code 255) — consistent with a stalled/blackholed connection to the npm
  registry, not app code.

**Why:** Root cause is network reachability/reliability from that specific VPS, not the
BLP repo. Each fix so far has addressed one specific *symptom* of that flakiness.

**How to apply:** Current mitigations in the repo: `Dockerfile` (no Nix) +
`.npmrc` (`update-notifier=false`, `audit=false`, `fund=false`,
`fetch-retries=5`, `fetch-retry-mintimeout=20000`, `fetch-retry-maxtimeout=120000`,
`fetch-timeout=300000`) to fail fast and retry instead of hanging forever. If builds
keep failing intermittently after this, the next step is diagnosing the VPS's raw
network (e.g. `curl -v https://registry.npmjs.org` timing from the server itself) or
building the image elsewhere (CI/local) and having Coolify pull a prebuilt image
instead of building on that host.
