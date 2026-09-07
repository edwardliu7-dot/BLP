---
name: Shared-table SQL qualification
description: SQL query safety for joined tables in the shared EOB5guru database
---

When querying the shared students and daily_records tables together, qualify selected columns with their table name (for example, students.id, students.name, and students.kelas). The shared schema can contain an id column on both sides of a join, making an unqualified SELECT id fail with PostgreSQL error 42702.

**Why:** The guru dashboard's initial student summary failed at runtime because `SELECT id` became ambiguous after the shared database schema included an id column on the joined records table.

**How to apply:** Qualify every selected or filtered column that could exist in more than one joined table, especially id, name, date, and status fields.