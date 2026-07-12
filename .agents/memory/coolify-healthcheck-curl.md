---
name: Coolify healthcheck needs curl/wget in image
description: Coolify rolls back an otherwise-healthy Docker deployment if the image has no curl/wget for its healthcheck probe.
---

Coolify's rolling-update healthcheck runs curl (or wget) *inside* the deployed
container to confirm it's up. Minimal base images like `node:20-slim` don't
ship either binary, so even when the app logs show it started fine (e.g.
"Server running on http://0.0.0.0:5000"), Coolify logs
"WARNING: ... healthcheck needs a curl or wget command ..." and rolls back to
the previous container, making a successful deploy look like a failure.

**Why:** the deploy log can look like total success (build completes, app
starts, no app-level errors) right up until the very end, where the rollback
happens silently due to the healthcheck infra — easy to misdiagnose as an app
crash if you only skim the top of the log.

**How to apply:** for Dockerfile-based Coolify deployments on slim/minimal
base images, install curl in the Dockerfile (`apt-get install -y curl`) and
add a `HEALTHCHECK ... CMD curl -f http://localhost:<port>/ || exit 1`
instruction, or otherwise disable Coolify's healthcheck in its UI. Always read
the full deployment log (including the tail) before concluding an app itself
is broken.
