---
name: Rebase after merge resolution
description: How to reason about a Git rebase paused after a merge already resolved the same conflict.
---

When a rebase is paused on a commit whose changes were deliberately replaced by a later merge resolution, compare the merge-result tree with the upstream tree before deciding whether to skip the replayed commit. Preserve unrelated working-tree files and verify that no rebase metadata remains afterward.

**Why:** Replaying the old commit blindly can reintroduce code that the merge intentionally discarded, while skipping without checking can silently lose needed work.

**How to apply:** Inspect the merge parents and the resulting file tree, then use the smallest Git continuation action that matches that resolved history. Finish by checking branch status, recent history, and rebase marker directories.