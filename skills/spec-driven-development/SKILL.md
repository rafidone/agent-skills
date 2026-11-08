---
name: spec-driven-development
description: Turns a request into a reviewable specification before any code is written. Use when starting a new feature, a significant change, or a bug fix whose requirements, acceptance criteria, or boundaries are unclear.
license: MIT
compatibility: opencode, claude-code, cursor, copilot, codex
metadata:
  version: 1.0.0
  phase: define
---

# Spec-Driven Development

## Overview

A specification is the contract between what someone asked for and what the
code will do. Writing it first is not bureaucracy; it is the cheapest point at
which to discover that two people mean different things by "done".

Agents make this discipline more important, not less. Code is now cheap enough
to generate that the expensive failure is building the wrong thing quickly. A
one-page spec costs minutes and prevents days of rework.

The spec is a decision record, not a phase gate. It can be revised. What it
cannot be is implicit. If the requirements live only in a chat transcript, they
will be lost, contradicted, or silently expanded.

## When to Use

Use this skill when:

- Starting a new feature, endpoint, screen, service, or data model.
- Changing behavior that other code, users, or teams depend on.
- Fixing a bug whose cause or expected behavior is not fully understood.
- Touching a migration, permission boundary, billing path, or anything
  expensive to reverse.
- A request arrives with a solution but no stated problem.
- Two reviewers would plausibly disagree about whether the work is done.

Do not use it for:

- Formatting, typo, or comment-only changes.
- A dependency bump with no behavioral change and a green test suite.
- A mechanical rename covered by an existing test suite and compiler.

For those, a one-line statement of intent and a test run is enough. When in
doubt, write the spec. A short spec is cheaper than a long rework.

Related: use the `constraint-driven-development` skill when the quality bar
itself is undefined, and the `planning-and-task-breakdown` skill once the spec
exists.

## Core Process

### 1. Restate the request

Write one sentence in the form "We need X so that Y." If you cannot, you have a
requirement problem, not an implementation problem. Ask.

### 2. Gather evidence before inventing

Read the code, tests, tickets, logs, and API docs that already exist. Identify:

- What currently happens, with a file or query as evidence.
- Who is affected, and how they will notice the change.
- What must not change, including public interfaces and stored data.
- What has already been tried, if this is a recurring problem.

Do not design against an imagined codebase. The spec must describe this one.

### 3. Write the spec

Use this template. Delete sections that genuinely do not apply and say why.

```markdown
## Spec: Rate limit the public API

### Problem
Clients can exhaust the API and degrade service for every tenant.

### Outcome
A single noisy client is throttled without affecting well-behaved clients.

### Scope
Per-API-key fixed-window limiting on public read endpoints.

### Non-goals
Billing, per-user quotas, and cross-region coordination.

### Acceptance criteria
- Given a key under its limit, when it calls, then the request succeeds.
- Given a key at its limit, when it calls again in the window, then it gets
  HTTP 429 with a Retry-After header.
- Given the window elapsed, when the key calls again, then it succeeds.

### Interfaces
Middleware accepts a limit, a window, a key extractor, and a store. It returns
either the downstream response or a 429.

### Failure modes
Missing key, clock skew, store unavailable, concurrent requests at the boundary.

### Test plan
Unit tests for the limiter, middleware tests for status and headers, one
integration test against the real store adapter.

### Rollback
Disable the middleware with a flag. No schema change.
```

Every acceptance criterion must be observable from outside the implementation.
"Fast", "clean", and "robust" are not criteria until they have a number or an
observable behavior attached.

### 4. Resolve ambiguity

List every open question that could invalidate the design. Ask at most three
blocking questions at once. For the rest, choose the safest reversible default
and record it under an `Assumptions` heading.

Never resolve ambiguity by silently picking the option that is easiest to
implement.

### 5. Review before building

The spec is ready when a reviewer can answer these without asking you:

- What problem is solved, and for whom?
- What is explicitly out of scope?
- How will we know it works?
- What happens when it fails?
- How do we undo it?

If the change is small, the review can be a paragraph in the pull request. If
it is large, it deserves a document.

### 6. Treat scope changes as spec changes

When new information arrives, update the spec first, then the code. A scope
change that exists only in the diff is a silent contract violation.

**Exit condition:** every acceptance criterion is observable and testable, every
failure mode has a defined response, and no unresolved decision remains inside
scope.

## Common Rationalizations

| Rationalization | Why it is wrong | Required action |
| --- | --- | --- |
| "The task is obvious; a spec is a waste of time." | Obvious tasks are where unstated assumptions hide. The spec can be three sentences. | Write the three sentences and the acceptance criteria. |
| "The user wants code, not documents." | A short spec prevents building the wrong thing and is faster than rework. | Keep it to one page and put it in the pull request. |
| "We will figure it out as we code." | Coding decisions made without a contract become accidental requirements. | Decide the behavior first; let implementation follow. |
| "Requirements will change anyway." | They will change less if the current ones are written down and reviewed. | Version the spec and record each change. |
| "The ticket is the spec." | Tickets usually state a wish, not acceptance criteria or non-goals. | Add the missing sections to the ticket or link a spec. |
| "Tests are the spec." | Tests prove behavior; they do not capture intent, non-goals, or rollback. | Keep both. Tests answer "does it work", the spec answers "is this the right work". |
| "Writing a spec is waterfall." | A spec is a decision record, not a phase gate. It is revised as understanding grows. | Write it, review it, then revise it in the open. |
| "I already started; I will write it afterward." | A spec written after the code describes the code, not the requirement. | Stop, write the intent, and check whether the code matches it. |
| "The edge cases are obvious." | Edge cases are where "obvious" differs between people. | List them and define the expected response for each. |

## Red Flags

- Acceptance criteria use adjectives without thresholds.
- There is no `Non-goals` section, so scope can expand without a decision.
- The spec describes classes and functions instead of behavior.
- An unresolved question is buried in prose instead of listed.
- Failure modes are absent, or every one is assumed to be "handled".
- The test plan says "add tests" without naming what each test proves.
- The diff contains behavior the spec never mentioned.
- The spec was written after the implementation and matches it exactly.
- Rollback is "revert the commit" on a change that includes a migration.

## Verification

- [ ] The problem and the user-visible outcome are stated.
- [ ] Scope and non-goals are explicit.
- [ ] Every acceptance criterion is observable and testable.
- [ ] Interfaces, inputs, outputs, and error contracts are defined.
- [ ] Failure modes and their responses are listed.
- [ ] The test plan maps every acceptance criterion to at least one test.
- [ ] Assumptions are recorded, and open questions are resolved or deferred.
- [ ] A rollback or containment strategy exists for risky changes.
- [ ] A reviewer other than the author has read the spec.
- [ ] The implementation diff contains no behavior absent from the spec.

A change that fails any of these is not ready to implement. Fix the spec first.
