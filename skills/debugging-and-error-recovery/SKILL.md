---
name: debugging-and-error-recovery
description: Diagnoses failures by reproducing them, isolating the cause, and fixing the root problem. Use when a test fails, a bug is reported, an error appears in logs, a test is flaky, or a previous fix did not hold.
license: MIT
compatibility: opencode, claude-code, cursor, copilot, codex
metadata:
  version: 1.0.0
  phase: build
---

# Debugging and Error Recovery

## Overview

Debugging is a search, not a guess. The goal is to explain the failure before
changing anything. A fix applied to a symptom moves the defect somewhere less
visible and makes the next investigation harder.

The loop is: stabilize, reproduce, reduce, hypothesize, test, fix the cause,
prove it with a regression test, and watch for recurrence. Skipping the
reproduction step is the most common reason a fix does not hold.

An agent is especially prone to pattern-matching a familiar error and editing
the first plausible line. Resist that. Evidence first.

## When to Use

Use this skill when:

- A test fails, especially one that passed before.
- A bug is reported by a user or a monitor.
- Logs show an error, a timeout, or an unexpected state.
- A test is intermittent or environment-dependent.
- A previous fix did not hold, or the same symptom returned.
- A deployment or migration left the system in a bad state.

Do not use it for:

- A feature that has never worked and is still being built.
- A deliberate failure used to test error handling.

Related: use the `test-driven-development` skill to turn the reproduction into
a permanent test, and the `shipping-and-launch` skill if the failure is in
production.

## Core Process

### 1. Stabilize before investigating

If the system is failing for users, stop the bleeding first: roll back, disable
the flag, drain the queue, or fail over. Preserve the evidence before restarting
anything. A restarted process often destroys the state you need.

Record: timestamp, environment, version or commit, request or trace id, and the
exact error.

### 2. Reproduce deterministically

Find the smallest command, test, or request that produces the failure on demand.
Run it twice. If it only fails sometimes, you have a second problem: the
nondeterminism is part of the bug.

If you cannot reproduce it, say so and gather more evidence. Do not fix a guess.

### 3. Reduce to a minimal case

Remove inputs, configuration, and code until the failure is as small as
possible. The reduction usually reveals the cause. Keep the reduced case; it
becomes the regression test.

### 4. Write down hypotheses

Keep a short log:

```text
Symptom: splitCents(100, 3) returns [33, 33, 33], one cent lost.
H1: integer division drops the remainder.        -> confirmed by reading the code
H2: rounding is applied twice.                    -> ruled out, one rounding site
H3: the caller discards the last element.         -> ruled out, caller iterates all
Cause: the remainder is never distributed.
```

A hypothesis must predict an observable difference. "Something in the cache"
is not a hypothesis until it says what changes when the cache is disabled.

### 5. Test one variable at a time

Change one thing, run the reproduction, record the result. Do not batch
changes; if the failure disappears, you will not know which change fixed it.

Useful tools, in rough order of cost:

- Read the code path from input to failure.
- Add a temporary assertion or log at the boundary.
- Disable a dependency or feature flag.
- `git bisect` between a known good and known bad commit.
- A profiler or trace for performance and concurrency issues.

### 6. Fix the cause

The fix should explain the symptom completely. If it only hides the symptom,
keep looking. Ask why the defect was possible: missing validation, an unclear
contract, a test gap, a race, a bad default.

### 7. Prove it and prevent it

- Add the reproduction as a failing test before the fix if it is not already.
- Confirm the test fails without the fix and passes with it.
- Run the full relevant suite.
- Add the check that would have caught it earlier, if one is cheap.

### 8. Watch for recurrence

After deploying, check the metric or log that revealed the problem. A fix that
is not observed in production is a hypothesis, not a resolution.

**Exit condition:** the failure is reproduced, the cause is explained, a
regression test passes, and the fix is verified in the environment where the
failure occurred.

## Common Rationalizations

| Rationalization | Why it is wrong | Required action |
| --- | --- | --- |
| "It is flaky; just rerun it." | Flakiness is a real defect in the test or the system. | Reproduce it, find the nondeterminism, and fix or quarantine it explicitly. |
| "It is probably a race." | "Probably" is not a diagnosis. | Instrument the boundary and prove the ordering. |
| "Restarting fixes it." | Restarting hides state corruption and loses evidence. | Capture state first, then restart, then find the cause. |
| "Add a retry." | Retries mask the failure and multiply load. | Fix the cause; retry only for a proven transient with a bounded policy. |
| "It only happens in production." | That means the environment differs, which is a clue. | Reproduce with production configuration or add targeted observability. |
| "The logs are enough." | Logs show symptoms, not the state that produced them. | Add a trace or assertion at the failing boundary. |
| "I changed the test and it passes." | You may have deleted the only proof of the bug. | Keep the reproduction and prove it fails without the fix. |
| "The error is unrelated to my change." | That is a claim that needs a baseline. | Reproduce on a clean checkout and compare. |
| "I will fix the symptom now and investigate later." | Later rarely comes, and the cause keeps producing symptoms. | Stabilize if needed, then find the cause before closing. |

## Red Flags

- The fix was applied before the failure was reproduced.
- The reproduction only works sometimes and that was accepted.
- Several changes were made at once.
- The "fix" adds a retry, a sleep, or a try/except that swallows the error.
- The failing test was edited or deleted.
- The explanation does not account for every observed symptom.
- Production was restarted before evidence was captured.
- The same bug has returned more than once.
- No regression test was added.
- The fix was never observed working in the failing environment.

## Verification

- [ ] The failure was reproduced deterministically, or the nondeterminism was
      isolated and explained.
- [ ] A minimal reproduction exists.
- [ ] Hypotheses were written down and tested one at a time.
- [ ] The root cause is stated in one sentence that explains the symptom.
- [ ] The fix addresses the cause, not the symptom.
- [ ] A regression test was added and observed failing before the fix.
- [ ] The regression test passes and fails if the fix is reverted.
- [ ] The full relevant suite passes.
- [ ] The fix was verified in the environment where the failure occurred.
- [ ] A cheap earlier check was added to catch the class of defect.
