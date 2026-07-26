---
name: Mockup sandbox dependency setup
description: Dependency and preview-server constraints for the generated mockup sandbox.
---

# Mockup sandbox dependency setup

When the generated mockup sandbox is created in a workspace with pnpm-managed dependencies, its package manifest may not correspond to a local `node_modules` tree. Optional Replit Vite plugins and sandbox-only watcher packages can therefore fail at preview startup even though the main application is healthy.

**Why:** The sandbox workflow can resolve its Vite config through the workspace dependency tree, exposing missing optional packages as startup failures.

**How to apply:** Keep mockups self-contained and verify the sandbox workflow before presenting. If a generated sandbox imports unavailable optional plugins or watcher libraries, prefer removing those optional imports or using built-in Node APIs in the sandbox config rather than changing the main app's dependencies.