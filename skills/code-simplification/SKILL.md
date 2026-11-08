---
name: code-simplification
description: Reduces complexity without changing observable behavior. Use when code is hard to read, duplicated, over-abstracted, or when a review asks for simplification and the existing tests must stay green.
license: MIT
compatibility: opencode, claude-code, cursor, copilot, codex
metadata:
  version: 1.0.0
  phase: build
---

# Code Simplification

## Overview

Complexity is a cost paid on every future change. Simplification is the
disciplined removal of that cost without changing what the code does. It is not
a rewrite, and it is not an opportunity to add the feature you noticed was
missing.

The test suite is the boundary. If behavior changes, even in a way that seems
like an improvement, this is no longer simplification. It is a behavior change
and needs its own spec and red test.

The best simplification usually deletes code. Extraction, renaming, and
deduplication are tools, not goals. A new abstraction that is used once has made
the code harder, not simpler.

## When to Use

Use this skill when:

- A reviewer says the change is hard to follow.
- The same logic appears in three or more places.
- A function is long, deeply nested, or does several unrelated things.
- An abstraction has one caller, or its interface is harder than the code it
  hides.
- Dead code, commented-out blocks, or feature flags have accumulated.
- You are about to extend code that is already difficult to change.

Do not use it for:

- Code you do not understand yet. Read it and add a characterization test first.
- A module with no tests that you cannot test cheaply. Build the safety net
  before the refactor.
- A rewrite of the architecture disguised as cleanup.

Related: use the `test-driven-development` skill to build the safety net, and
the `code-review-and-quality` skill to review the result.

## Core Process

### 1. Establish a green baseline

Run the relevant suite and record the result. If it is already red, stop: you
cannot distinguish your regressions from the baseline. Fix or scope the
baseline first.

### 2. Name the complexity

Be specific. "It is messy" is not actionable. Identify the move:

| Smell | Candidate move |
| --- | --- |
| Long function with mixed levels of detail | Extract one behavior per function |
| Deep nesting | Early returns or guard clauses |
| Repeated conditionals | A lookup table or a named predicate |
| Duplicated logic | Extract once, then call it |
| One-use abstraction | Inline it |
| Misleading name | Rename it |
| Dead or commented-out code | Delete it |
| Boolean parameter that changes behavior | Split into two functions |
| Mutable shared state | Pass the value or return a new one |

### 3. Choose the smallest transformation

One move at a time. Do not rename, extract, and change the algorithm in the same
step. Each step should be easy to review and easy to revert.

### 4. Refactor under green

Run the tests after every step, not at the end. If a test fails, you changed
behavior; revert the step and split it.

When the behavior is not covered, add a characterization test first. It does not
need to assert that the current behavior is correct, only that it is the
behavior you are preserving.

### 5. Delete rather than add

Prefer removing a layer to adding one. A helper used once is usually noise. A
config option with one value is a decision waiting to be wrong.

Ask of every new abstraction: what would make this worth its indirection? If
the answer is speculative, do not add it.

### 6. Stop when clarity improves

Simplification has diminishing returns and a real risk of churn. When a reviewer
can follow the code without explanation and the diff is small, stop. Do not
reformat unrelated files.

### 7. Verify and report

Run the full relevant suite, lint, types, and build. Report what was removed,
what was renamed, and confirm that observable behavior is unchanged.

**Exit condition:** the code is measurably simpler, the suite is green, and the
diff contains no behavior change.

## Common Rationalizations

| Rationalization | Why it is wrong | Required action |
| --- | --- | --- |
| "I will rewrite it properly." | A rewrite changes behavior and destroys reviewability. | Refactor in small, tested steps. |
| "It works; do not touch it." | Working code can still be too expensive to change safely. | Simplify only where it reduces a named cost. |
| "More abstraction is cleaner." | Abstraction has a cost and is only worth it when it removes duplication or hides a real detail. | Add an abstraction when there is a second caller or a genuine boundary. |
| "The tests will catch any change." | Tests catch covered behavior, not everything. | Add characterization tests at the boundary first. |
| "I will simplify and fix the bug at once." | Two changes in one diff make both unverifiable. | Land the behavior change first, then simplify. |
| "I will reformat the file while I am here." | Formatting noise hides the real change. | Keep formatting in a separate commit. |
| "Fewer lines always means simpler." | Dense one-liners can be harder to read. | Optimize for comprehension, not line count. |
| "I understand it well enough." | Understanding without a test is a guess about preserved behavior. | Prove it with the suite before and after. |

## Red Flags

- The diff changes behavior as well as structure.
- Tests were added after the refactor, not before.
- The change touches files unrelated to the named complexity.
- A new abstraction has one caller.
- A public interface changed without a compatibility plan.
- The baseline suite was red before the work started.
- Formatting or renames dominate the diff.
- The refactor is large enough that it cannot be reviewed in one sitting.
- The code is shorter but harder to follow.
- No before-and-after evidence is recorded.

## Verification

- [ ] The complexity being removed is named and specific.
- [ ] The baseline suite was green and its result recorded.
- [ ] Characterization tests cover behavior that was untested.
- [ ] Each step changed one thing.
- [ ] The suite stayed green after every step.
- [ ] No observable behavior changed.
- [ ] No new abstraction has a single caller.
- [ ] Dead code, debug output, and commented-out blocks were removed.
- [ ] The full relevant suite, lint, types, and build pass.
- [ ] The diff contains no unrelated formatting or renames.
