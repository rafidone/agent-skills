---
name: shipping-and-launch
description: Plans and executes a safe release with rollback and post-launch checks. Use when deploying to production, enabling a feature flag, publishing a package, migrating data, or announcing a launch to users.
license: MIT
compatibility: opencode, claude-code, cursor, copilot, codex
metadata:
  version: 1.0.0
  phase: ship
---

# Shipping and Launch

## Overview

Shipping is a controlled transition from "the code is merged" to "users are
relying on it". The two are not the same event, and the gap between them is
where most outages happen.

A release plan states what will change, who can see it, how you will know it is
working, how you will know it is not, and how you will undo it. Without those
five answers, a deploy is an experiment performed on users without a hypothesis.

The safest release is small, observable, and reversible. Prefer all three.

## When to Use

Use this skill when:

- Deploying code to a production environment.
- Enabling a feature flag for users.
- Publishing a package, container, or SDK.
- Running a data migration or backfill.
- Making a public announcement that creates load or support demand.
- Changing configuration that affects availability or cost.

Do not use it for:

- Deploying to a local or ephemeral preview environment.
- A documentation site deploy with no runtime dependency, beyond a link check.

Related: use the `git-workflow-and-versioning` skill for the tag and changelog,
and the `code-review-and-quality` skill before the release is approved.

## Core Process

### 1. Run the readiness review

Before scheduling the release, confirm:

- The full test suite, lint, type check, and build passed on the release commit.
- Every change in the release has a reviewed spec or issue.
- Migrations were rehearsed against a production-like dataset.
- Configuration and secrets exist in the target environment.
- The rollback path was tested, not merely described.
- A named person is on point during and after the rollout.

If any answer is no, the release is not ready. Delay is cheaper than an
incident.

### 2. Define success and abort criteria

Write these before the deploy, not after:

| Signal | Success | Abort |
| --- | --- | --- |
| Error rate | under 0.5 percent | above 2 percent for 5 minutes |
| p95 latency | under 300 ms | above 800 ms for 5 minutes |
| Conversion | within 5 percent of baseline | down 15 percent after an hour |
| Support tickets | no new class of report | a new class appears |

A signal without a threshold cannot trigger an abort.

### 3. Choose the rollout shape

| Shape | Use when |
| --- | --- |
| All at once | Small, low-risk, easily reverted |
| Canary | Uncertain behavior under real traffic |
| Percentage ramp | Load or cost risk that scales with traffic |
| Region by region | Data residency, latency, or regulatory risk |
| Dark launch | Validate load before users can reach it |
| Flag off, then enable | Feature is merged but not yet announced |

### 4. Prepare the rollback

State the exact command or switch, who may execute it, and how long it takes.
For a migration, state whether the rollback restores data or only stops writes.
"Revert the commit" is not a rollback plan when a schema change has already run.

Rehearse the rollback in staging if it has never been used.

### 5. Make it observable

Before enabling traffic, confirm:

- Logs include the release version and a request or trace id.
- Metrics cover the success and abort signals.
- Alerts route to a person, not a channel nobody reads.
- A dashboard shows the release marker so a change in behavior is attributable.

### 6. Communicate

- Tell support and on-call what is shipping and when.
- Write a changelog entry a user can understand.
- For a breaking change, announce it before the release, with a migration path.
- For a public launch, prepare status updates for the first hour.

### 7. Execute and watch

Deploy. Watch the signals for at least the agreed window. Do not move on to the
next task while the release is still unverified. If an abort criterion is hit,
roll back first and investigate second.

### 8. Close the loop

- Confirm the success criteria held for the full window.
- Remove the flag or schedule its removal with an owner.
- Update the changelog, docs, and status page.
- Record what was learned, especially if the rollout was adjusted.
- Delete temporary scaffolding and old paths.

**Exit condition:** the release is live and observed within thresholds, the
rollback remains available, and the flags and docs reflect the shipped state.

## Common Rationalizations

| Rationalization | Why it is wrong | Required action |
| --- | --- | --- |
| "CI passed, so ship it." | CI does not exercise production data, load, or configuration. | Run the readiness review and watch the signals. |
| "We can roll back with git revert." | A revert does not undo a migration, a sent email, or a cache. | Write and rehearse the real rollback. |
| "No one uses that path." | Assume someone does until the metrics say otherwise. | Instrument the path and stage the rollout. |
| "Monitoring is already there." | Existing dashboards may not cover the new behavior. | Confirm the success and abort signals exist. |
| "It is a small release." | Small releases still need a rollback and a watch window. | Keep the process proportional, not absent. |
| "We will watch it tomorrow." | Failures compound overnight and support absorbs the cost. | Watch during the release window. |
| "The flag is temporary; we will remove it later." | Temporary flags become permanent without an owner. | Assign an owner and a removal date. |
| "Announcing early builds excitement." | It also creates load and support demand before you are ready. | Announce when the system and the team can absorb it. |

## Red Flags

- No rollback plan, or a rollback that has never been tested.
- No success or abort thresholds.
- The release includes unreviewed changes.
- Migrations were not rehearsed.
- The release version is absent from logs and metrics.
- Nobody is on point during the rollout.
- Alerts go to an unmonitored channel.
- A flag has no owner or removal date.
- The team moves to the next task before the watch window ends.
- A breaking change shipped without an announcement or migration path.

## Verification

- [ ] Tests, lint, types, and build passed on the release commit.
- [ ] Every included change was reviewed.
- [ ] Migrations were rehearsed and the rollback is known.
- [ ] Configuration and secrets exist in the target environment.
- [ ] Success and abort thresholds are written.
- [ ] The rollout shape matches the risk.
- [ ] The rollback was tested and a named person can execute it.
- [ ] Logs and metrics identify the release version.
- [ ] Alerts route to a person.
- [ ] Support and on-call were briefed.
- [ ] The release was watched for the full window.
- [ ] Flags, docs, and the changelog reflect the shipped state.
