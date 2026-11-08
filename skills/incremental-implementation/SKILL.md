---
name: incremental-implementation
description: Delivers work in thin vertical slices and a walking skeleton that can be tested and shipped independently. Use when a change touches multiple files, when a feature is too large for one review, or when risky work needs safe defaults and a rollback path.
license: MIT
compatibility: opencode, claude-code, cursor, copilot, codex
metadata:
  version: 1.0.0
  phase: build
---

# Incremental Implementation

## Overview

A large change held back until it is perfect is a large change that cannot be
reviewed, tested in production, or rolled back cleanly. Incremental
implementation ships a thin vertical slice at a time: a little behavior, wired
end to end, verified, and committed.

The unit of progress is a working system, not a finished layer. "The schema is
done" is not progress if nothing can use it. "A user can create one draft" is
progress, even if editing and publishing are still missing.

Small slices also make agent work reviewable. A 900-line diff hides mistakes; a
90-line diff invites scrutiny.

## When to Use

Use this skill when:

- A change touches more than one file or layer.
- A feature will take more than one sitting to finish.
- The work is risky enough to need a flag, a safe default, or a rollback plan.
- A migration must run while old and new code coexist.
- A reviewer could not meaningfully review the whole change at once.

Do not use it for:

- A single-file change with one behavior, already covered by a red test.
- A mechanical rename enforced by the compiler.
- A dependency upgrade with no code changes.

Related: use the `planning-and-task-breakdown` skill to choose the slices, and
the `test-driven-development` skill inside each slice.

## Core Process

### 1. Slice by behavior, not by layer

A vertical slice crosses the layers needed to deliver one observable outcome.
A horizontal slice finishes one layer for every outcome and delivers nothing
until the end.

| Weak horizontal slice | Strong vertical slice |
| --- | --- |
| Add every database column | A user can save one draft |
| Build the whole API surface | A draft can be listed |
| Build every UI screen | A draft can be published |
| Wire it all together at the end | A published draft is visible |

### 2. Build a walking skeleton first

The first slice should touch every layer once, with the simplest possible
behavior. It proves the wiring, the deploy path, and the test harness before
the complexity arrives.

For a new service, that might be a health endpoint that reads one row. For a new
screen, a rendered empty state behind a flag. For a migration, a dual-write that
is verified but not read yet.

### 3. Order by dependency, then by risk

- Unblock other work first.
- Put the riskiest unknown early, while the change is small.
- Defer cosmetic work until the behavior is proven.
- Keep each slice independently revertible.

### 4. Run a full cycle per slice

For each slice:

1. Write or update the spec delta, even if it is one paragraph.
2. Write the failing test.
3. Implement the minimum to pass.
4. Run the slice's tests and the adjacent tests.
5. Run lint, type check, and build if the slice touches them.
6. Commit with a message that names the slice.

The suite stays green at every commit. A red commit is not a checkpoint.

### 5. Protect incomplete work

When a slice is not ready for users:

- Put it behind a feature flag that defaults off.
- Add the new path without removing the old one.
- Dual-write and verify before switching reads.
- Use additive schema changes; make destructive changes in a later release.

Never ship a half-wired path that users can reach.

### 6. Keep the diff reviewable

As a rule of thumb, a slice should be reviewable in one sitting. If the diff has
several unrelated concerns, split it. If the test is larger than the
implementation, that is usually a good sign.

### 7. Close the loop

After the last slice:

- Remove the flag or record why it stays.
- Delete the old path if it is now dead.
- Run the full suite and the release checks.
- Update the spec to match what shipped.

**Exit condition:** every slice is committed with its tests green, the feature
is reachable only when intended, and the final state has no dead scaffolding.

## Common Rationalizations

| Rationalization | Why it is wrong | Required action |
| --- | --- | --- |
| "It is cleaner to build all the layers first." | Nothing works until the end, so nothing is verified until the end. | Build one outcome end to end, then widen. |
| "The feature is not usable until it is complete." | Incomplete work can still be merged behind a flag and tested. | Ship the slice dark, then enable it. |
| "Feature flags are overhead." | They are cheaper than a rollback of a half-finished release. | Use the smallest flag that lets you disable the new path. |
| "I will commit when it is all working." | One large commit hides regressions and cannot be bisected. | Commit each green slice. |
| "Splitting will take longer." | It takes less time than reviewing and debugging a monolith. | Split by behavior, not by file. |
| "The refactor is small enough to include." | Mixing refactor and behavior makes both harder to review. | Land the refactor separately. |
| "We can clean up the old path later." | Old paths become permanent when no one owns the cleanup. | Record the cleanup task with the slice that enables it. |
| "The flag will never be turned off." | Then it is not a flag, it is a permanent branch. | Set an owner and a removal date. |

## Red Flags

- The first commit contains the entire feature.
- Work is organized by layer: all models, then all services, then all UI.
- Nothing is runnable until the last step.
- A slice has no test that could fail.
- The old and new paths are both live with no flag or routing rule.
- A destructive migration lands before the code that survives it.
- The diff mixes refactoring, formatting, and behavior.
- Cleanup is deferred with no owner.
- The suite is red between commits.
- The pull request is too large to review in one sitting.

## Verification

- [ ] Each slice delivers one observable outcome.
- [ ] The first slice is a walking skeleton that touches every layer.
- [ ] Every commit leaves the suite green.
- [ ] Incomplete paths are behind a flag or unreachable.
- [ ] Additive changes precede destructive ones.
- [ ] No commit mixes refactoring with behavior change.
- [ ] The final feature is reachable only when intended.
- [ ] Flags are removed or have an owner and a removal date.
- [ ] Dead scaffolding is deleted.
- [ ] The spec reflects what actually shipped.
