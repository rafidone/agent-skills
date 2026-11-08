---
description: Decompose a specification into ordered, verifiable tasks
argument-hint: <spec path or pasted spec>
---

Use the `planning-and-task-breakdown` skill for this request.

Break this specification into implementation tasks: $ARGUMENTS

Requirements:

1. Find the walking skeleton and make it the first slice.
2. Slice vertically by observable outcome, never by layer.
3. For each task, state: outcome, dependencies, files touched, acceptance test,
   failure cases, risk, and rollback.
4. Order by dependency, then by risk.
5. Mark which tasks can run in parallel and why they do not share files.
6. Check every acceptance criterion and non-goal against the task list.

Do not implement anything in this command. If the spec is missing or ambiguous,
say so and stop; route to `spec-driven-development` first.
