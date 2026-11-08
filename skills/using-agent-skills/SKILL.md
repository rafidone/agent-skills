---
name: using-agent-skills
description: Discovers and routes to the right engineering skill or workflow for the task at hand. Use when starting a session, when it is unclear which skill applies, when a request spans several phases such as design, implementation, and release, or when you need to decide where to begin.
license: MIT
compatibility: opencode, claude-code, cursor, copilot, codex
metadata:
  version: 1.0.0
  phase: meta
---

# Using Agent Skills

## Overview

This repository is a catalog of engineering disciplines, not a single prompt.
Each skill encodes one phase of the work and its own quality gates. This
meta-skill decides which one applies, in what order, and when the work has
crossed into a different phase.

Routing is not optional. A skill that is not loaded cannot enforce anything, and
an agent that improvises a workflow usually skips the steps that catch mistakes:
the spec, the failing test, the evidence before merge.

## When to Use

Use this skill when:

- A session starts and the task has not been classified yet.
- The request spans several phases, such as "design and ship this feature".
- It is unclear whether the task is a bug fix, a refactor, or a feature.
- A previous attempt failed and the next step is uncertain.
- You are about to invoke another skill and want to confirm it is the right one.

Do not use it when a specific skill is already obviously active. Route once,
then follow that skill.

## Routing Map

Classify by the question the task is really asking.

| The task is really asking | Route to |
| --- | --- |
| "What are we building, and how will we know it works?" | `spec-driven-development` |
| "What standard must this meet, and who enforces it?" | `constraint-driven-development` |
| "How do we break this down and in what order?" | `planning-and-task-breakdown` |
| "How do we land this safely in small pieces?" | `incremental-implementation` |
| "How do we prove this behavior exists?" | `test-driven-development` |
| "Why is this failing, and what is the root cause?" | `debugging-and-error-recovery` |
| "This works but it is too complicated." | `code-simplification` |
| "Is this change correct, safe, and proven?" | `code-review-and-quality` |
| "How do we record this change in history?" | `git-workflow-and-versioning` |
| "How do we release this without breaking production?" | `shipping-and-launch` |

When several apply, compose them in lifecycle order. A feature request usually
routes through spec, plan, incremental implementation, TDD inside each slice,
review, git, and ship. Do not load all of them at once; load the next one when
the work reaches it.

## Core Process

### 1. Restate the task in one sentence

Name the artifact and the change: "Add pagination to the search endpoint", not
"work on search". If the sentence contains "and", you probably have two tasks.

### 2. Identify the phase

Use the routing map. Prefer the earliest phase that is not yet satisfied. If
there is no spec, do not start with implementation. If the behavior is unclear,
do not start with a refactor.

### 3. Load exactly one primary skill

Read the whole `SKILL.md`, not just the description. Announce the route once:
"`test-driven-development` is active for this change." Do not narrate the skill.

### 4. Follow its gates

Each skill ends with a verification section. Those checks are the contract, not
suggestions. Do not move to the next phase while the current one is red.

### 5. Re-route when the phase changes

Implementation becomes debugging when a test fails unexpectedly. Review becomes
implementation when a blocker is found. State the new route and load the new
skill. Do not silently switch disciplines.

### 6. Stop when no skill applies

Not every request is engineering work. A question, a document edit, or a
discussion may need no skill at all. Say so instead of forcing a workflow.

**Exit condition:** the active skill is named, its gates are being followed, and
the route changes explicitly when the phase changes.

## Common Rationalizations

| Rationalization | Why it is wrong | Required action |
| --- | --- | --- |
| "I do not need a skill for this." | That judgement is exactly what the meta-skill exists to check. | Classify the task against the routing map first. |
| "I will just do it quickly." | Quick work that skips verification is the most common source of rework. | Use the smallest applicable skill. |
| "The task is too small." | Small changes still need a test and a review; the skill scales down. | Apply the relevant gate, not the whole ceremony. |
| "Loading a skill wastes context." | A wrong implementation wastes far more. | Load the one skill that applies. |
| "I already know how to do this." | Knowing the discipline and applying it are different. | Follow the skill's verification section. |
| "I will load every skill to be safe." | Conflicting procedures produce inconsistent behavior. | Load the most specific skill, then the next when the phase changes. |
| "The skill does not fit exactly." | Adapt the procedure, but keep its gates. | State the deviation and why. |

## Red Flags

- The task was started without naming a phase.
- A skill was loaded but its verification section was ignored.
- Several skills were loaded at once and their instructions conflict.
- The route changed without being stated.
- A skill was invoked for a task it explicitly excludes.
- The agent paraphrases the skill instead of reading it.
- Work continues after a failed gate without a recorded exception.

## Verification

- [ ] The task was restated in one sentence.
- [ ] The phase was identified from the routing map.
- [ ] Exactly one primary skill is active, and it was read in full.
- [ ] The route was announced once.
- [ ] The active skill's gates are being followed.
- [ ] Any phase change was announced and re-routed.
- [ ] Any deviation from the skill is stated with a reason.
- [ ] If no skill applies, that was said explicitly.
