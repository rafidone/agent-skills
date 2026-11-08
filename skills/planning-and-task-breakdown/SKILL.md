---
name: planning-and-task-breakdown
description: Decomposes a specification into small, ordered, verifiable tasks. Use when a spec exists and you need implementable units, dependency ordering, or a task list with acceptance criteria and clear ownership.
license: MIT
compatibility: opencode, claude-code, cursor, copilot, codex
metadata:
  version: 1.0.0
  phase: plan
---

# Planning and Task Breakdown

## Overview

A specification says what should be true. A plan says how the work gets there in
units small enough to verify. Skipping the plan turns a spec into an improvised
sequence of edits where progress is measured by activity rather than evidence.

A good task is independently verifiable. Someone should be able to pick it up,
know when it is done, and know what it depends on without reading the author's
mind. If a task cannot be verified, it is a phase, not a task.

The plan is not a promise about time. It is a map of dependencies and evidence.

## When to Use

Use this skill when:

- A spec exists and implementation has not started.
- The work spans multiple files, services, or people.
- The order of work is not obvious.
- Several tasks could run in parallel and the boundaries matter.
- A previous attempt failed because the work was too large or poorly sequenced.

Do not use it for:

- A single-behavior change with one obvious test.
- Work already broken into tasks by an accepted plan.
- A rename or formatting pass.

Related: use the `spec-driven-development` skill first, and the
`incremental-implementation` skill to execute each slice.

## Core Process

### 1. Read the spec and the constraints

Extract every acceptance criterion, failure mode, and non-goal. If the spec is
missing or ambiguous, stop and use the `spec-driven-development` skill. A plan
built on an unclear spec only makes the confusion more organized.

### 2. Find the walking skeleton

Identify the smallest end-to-end path that proves the architecture. That path
becomes the first group of tasks. It usually touches storage, business logic,
interface, and a test.

### 3. Slice vertically

Each task should deliver or enable one observable outcome. Prefer ten small
tasks over three large ones. A useful ceiling is roughly half a day of work; if
a task is larger, split it by behavior.

### 4. Write the task record

Every task contains:

```markdown
### Task: A signed-in user can save a draft

- Outcome: POST /drafts persists a draft for the current user.
- Depends on: auth middleware, drafts table, request validation.
- Touches: src/drafts/*, db/migrations/0032_drafts.sql, tests/drafts/*.
- Acceptance test: posting a valid draft returns 201 and the row exists.
- Failure cases: missing title returns 422; unauthenticated returns 401.
- Risk: migration adds a table; no existing data affected.
- Rollback: drop the table and remove the route behind a flag.
```

The acceptance test is the task's definition of done. If you cannot name it,
the task is not ready.

### 5. Order by dependency, then risk

- Resolve blockers before dependants.
- Put the largest unknown early, while the change is cheap to abandon.
- Keep the suite green between tasks.
- Group tasks that must land together, and mark them as one slice.

### 6. Mark what can run in parallel

Two tasks can run in parallel when they touch different files and neither
depends on the other's output. Parallel work that shares a file creates merge
conflicts and duplicated decisions, so serialize it instead.

### 7. Check coverage against the spec

Walk the acceptance criteria and failure modes one by one. Each must map to at
least one task and one test. Then check the non-goals: no task should quietly
implement one.

### 8. Review the plan before executing

A reviewer should be able to answer:

- Which task proves the riskiest assumption?
- What is the first shippable slice?
- Which tasks are independent?
- Where could this plan stall?
- How do we know each task is done?

**Exit condition:** every acceptance criterion maps to a task with a named test,
dependencies are explicit, and no task mixes unrelated concerns.

## Common Rationalizations

| Rationalization | Why it is wrong | Required action |
| --- | --- | --- |
| "The plan is in my head." | An unwritten plan cannot be reviewed, shared, or checked for gaps. | Write the task list in the pull request or issue. |
| "Tasks are just the spec restated." | The spec states outcomes; the plan states sequence, ownership, and proof. | Add dependencies and acceptance tests to each task. |
| "We will parallelize everything." | Parallel tasks that share files create conflicts and duplicated work. | Parallelize only independent file sets. |
| "Estimates are unreliable, so planning is pointless." | The plan is for dependencies and evidence, not for a precise date. | Plan the order and the proof, not the hours. |
| "I will adjust as I go." | Adjusting is fine; adjusting without updating the plan hides drift. | Update the task list when the plan changes. |
| "This task is too big to split." | That usually means the outcome is not yet understood. | Split by observable behavior or by risk. |
| "The acceptance test can come later." | A task without a test has no definition of done. | Name the test before starting. |
| "Planning is waterfall." | A plan is a working map. It is revised as evidence arrives. | Keep it short and update it. |

## Red Flags

- Tasks are organized by layer rather than by outcome.
- A task has no acceptance test.
- Dependencies are discovered during implementation instead of stated.
- One task spans unrelated concerns.
- The plan omits failure cases and non-goals.
- Everything is marked parallel with no file boundaries.
- The plan has no verification or release task.
- The task list is longer than the work it describes because it restates the
  spec line by line.
- Work starts before the riskiest assumption has a task.

## Verification

- [ ] Every acceptance criterion maps to at least one task.
- [ ] Every failure mode maps to at least one task.
- [ ] Each task names an observable outcome and an acceptance test.
- [ ] Dependencies are explicit and acyclic.
- [ ] The first slice is a walking skeleton.
- [ ] The riskiest assumption is tested early.
- [ ] Parallel tasks touch disjoint files.
- [ ] No task implements a non-goal.
- [ ] Each task is small enough to review in one sitting.
- [ ] The plan includes verification, cleanup, and release steps.
