---
name: constraint-driven-development
description: Establishes a written quality bar with measurable thresholds before implementation. Use when no standards are documented, when an agent produces unverified or excessive work, or when a team needs a CONSTRAINTS.md that defines done.
license: MIT
compatibility: opencode, claude-code, cursor, copilot, codex
metadata:
  version: 1.0.0
  phase: define
---

# Constraint-Driven Development

## Overview

"Make it good" is not a requirement. Without a written quality bar, every
review becomes a negotiation and every agent decides for itself what "done"
means. The result is either gold-plating nobody asked for or corners cut
nobody noticed.

A constraint is a measurable limit on the solution: response time, bundle size,
test coverage of failure paths, accessibility level, supported versions, error
budget. Constraints turn taste into checks.

This skill produces a `CONSTRAINTS.md` and, more importantly, wires each
constraint into the cheapest place where it can be enforced.

## When to Use

Use this skill when:

- A project has no written standards, or they exist only in people's heads.
- An agent is producing more code, more abstraction, or more output than anyone
  reads.
- Reviews keep arguing about preferences instead of defects.
- Before a large refactor, migration, or new service.
- After an incident caused by an unstated assumption.

Do not use it for:

- A one-off script with no maintenance expectation.
- A repository that already has enforced constraints you can cite.

Related: use the `spec-driven-development` skill for the behavior contract, and
the `code-review-and-quality` skill to enforce the result.

## Core Process

### 1. Interview for the real limits

Ask about the dimensions that change design decisions. Skip any that do not
apply, and record why.

| Dimension | Question | Example threshold |
| --- | --- | --- |
| Performance | What latency is unacceptable? | p95 under 300 ms at 100 rps |
| Size | What is the deployment budget? | bundle under 200 KB gzipped |
| Reliability | What failure rate is tolerable? | 99.9 percent monthly availability |
| Security | What must never happen? | no secret in the repo or logs |
| Data | What must be recoverable, and how fast? | restore within 1 hour, RPO 15 min |
| Compatibility | What must keep working? | last two major versions |
| Accessibility | What standard applies? | WCAG 2.2 AA on public pages |
| Maintainability | What complexity is too much? | functions under 40 lines, no cycles |
| Cost | What spend is unacceptable? | under 50 USD per month at launch |

### 2. Set thresholds, not adjectives

Every constraint needs a number, a scope, and a measurement. "Fast" becomes
"p95 under 300 ms for the search endpoint, measured at the edge". "Secure"
becomes "no credentials in source or logs, verified by the secret scanner".

When the team has no preference, choose a sane default, label it as a default,
and make it easy to change.

### 3. Write `CONSTRAINTS.md`

Place it at the repository root so agents read it as project context.

```markdown
# Constraints

## Non-negotiables
- No secret, token, or private key in the repository or logs.
- Migrations are reversible or have a tested recovery plan.
- Public API responses keep backward compatibility for two major versions.

## Budgets
- p95 latency under 300 ms at 100 rps for public read endpoints.
- Bundle under 200 KB gzipped for the initial route.
- Full CI under 10 minutes.

## Quality gates
- New behavior has a test that failed first.
- No new lint warnings.
- Failure paths cover invalid input and expected errors.

## Explicit non-goals
- Horizontal scale beyond one region before launch.
- A design system for internal tools.

## Enforcement
| Check | Where | Blocking |
| --- | --- | --- |
| Unit tests | pre-commit and CI | yes |
| Lint and types | pre-commit and CI | yes |
| Bundle budget | CI | yes |
| Latency benchmark | nightly | no, alert |
```

### 4. Place each check by cost

The cheapest check that catches the defect wins. Earlier is better, but only if
it is fast and reliable.

| Stage | Use for | Avoid |
| --- | --- | --- |
| Editor | formatting, obvious types | anything slow or flaky |
| Pre-commit | fast unit tests, lint, secret scan | the full suite |
| Pull request | full tests, build, bundle budget | multi-hour jobs |
| Nightly | benchmarks, dependency audits, fuzzing | blocking every change |
| Release | smoke tests, migration rehearsal, rollback drill | surprise gates |

### 5. Enforce, do not document

A constraint with no check is a wish. Every non-negotiable must have an
automated gate, or a named human owner and a review step.

### 6. Define the suppression policy

State who may override a gate, how, and for how long. A suppression must be
scoped, justified, owned, and time-limited. Blanket disables are not allowed.

### 7. Review the constraints

Revisit at each release. Remove constraints that no longer matter and add the
ones an incident revealed. A stale constraint file teaches agents to ignore it.

**Exit condition:** every constraint has a threshold, a measurement, an
enforcement point, and an owner.

## Common Rationalizations

| Rationalization | Why it is wrong | Required action |
| --- | --- | --- |
| "Our standards are in our heads." | Unwritten standards cannot be enforced or inherited. | Write them down; defaults are fine to start. |
| "Thresholds are arbitrary." | An arbitrary number that is written and measured beats an adjective that is not. | Set a default, label it, and revise with data. |
| "CI is already slow." | Slow gates get bypassed, which is worse than a smaller gate. | Move fast checks earlier and keep the slow ones nightly. |
| "We will add checks after launch." | After launch is when the constraint matters most. | Add the cheapest check before the risky change. |
| "The agent ignores the file." | If it is not in the agent's context or a gate, it will. | Put it at the root and enforce it in CI. |
| "Suppressions are pragmatic." | Unscoped suppressions hide defects and spread. | Require a reason, an owner, and an expiry. |
| "More constraints mean higher quality." | Excess constraints slow work and get ignored. | Keep only constraints tied to a real risk. |

## Red Flags

- Constraints use adjectives with no measurement.
- A non-negotiable has no automated check and no owner.
- The constraint file is longer than the code it governs.
- Gates live only in documentation.
- Suppressions have no owner or expiry.
- The quality bar changes depending on who is reviewing.
- The constraints were written once and never revisited.
- An agent is asked to "use good judgement" instead of follow a threshold.
- A release has no rollback or recovery constraint.

## Verification

- [ ] Each constraint states a threshold, a scope, and a measurement.
- [ ] Non-negotiables have an automated gate or a named owner.
- [ ] Each check runs at the cheapest effective stage.
- [ ] `CONSTRAINTS.md` is at the repository root and referenced by `AGENTS.md`.
- [ ] The suppression policy is written and time-limited.
- [ ] Defaults are labelled and easy to change.
- [ ] The constraints cover performance, security, data, and compatibility.
- [ ] The constraints were reviewed at the last release.
- [ ] A new contributor can tell what "done" means without asking.
