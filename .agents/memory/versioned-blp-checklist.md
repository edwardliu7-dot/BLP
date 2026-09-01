---
name: Versioned BLP checklist
description: Durable rules for changing BLP activity definitions without altering historical records.
---

BLP checklist revisions are date-versioned. A record before a changeover date must render and score
against the historical checklist; records on and after the date use the new checklist.

**Why:** Reusing an old activity ID for a new meaning makes historical completions appear to belong
to the new point and changes past scores or reports.

**How to apply:** Give every newly introduced activity a distinct versioned ID, select the activity
catalog by the record/report date, and keep database records untouched. Monthly exports should use
the catalog for the month being exported.