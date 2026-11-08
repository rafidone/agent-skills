---
name: test-driven-development
description: Drives changes through a red-green-refactor loop with a failing test first. Use when implementing logic, fixing a bug, changing behavior, or adding tests, including when the request does not mention tests.
license: MIT
compatibility: opencode, claude-code, cursor, copilot, codex
metadata:
  version: 1.0.0
  phase: build
---

# Test-Driven Development

## Overview

Write the test before the code that makes it pass. For a bug, reproduce the bug
before attempting a fix. A test is proof that the behavior exists and that it
will keep existing; "seems right" is not proof.

An agent without tests is guessing. It cannot tell whether a change fixed the
problem or merely moved it, and it cannot know when it has broken something
else. A test suite turns that guess into a check the agent can run.

Red-green-refactor is deliberately small. One behavior per cycle keeps the
failure easy to diagnose and the implementation honest.

## When to Use

Use this skill when:

- Implementing any new logic, endpoint, rule, or user-visible behavior.
- Fixing a bug, especially one reported by a user.
- Changing existing behavior, including a deliberate breaking change.
- Handling a new edge case or failure path.
- Deleting dead code where the remaining behavior must be preserved.
- A request pastes code inline and asks for a change, even without the word
  "test".

Do not use it for:

- Documentation, comments, or formatting with no behavioral effect.
- Pure configuration changes already covered by an integration test.
- A rename enforced by the compiler and an existing suite.

For those, run the existing suite and record the result. The discipline is about
behavior, not ceremony.

Related: use the `debugging-and-error-recovery` skill when the cause is unknown,
and the `code-review-and-quality` skill before merge.

## Core Process

### 1. Choose the smallest next behavior

From the spec, pick one acceptance criterion or one failure mode. Do not write a
test that proves three things at once. If the test name needs "and", split it.

### 2. Write the failing test

Name the test after the behavior, not the function:

```text
"rejects a debit that would overdraw the account"
not "test debit 2"
```

Use Arrange, Act, Assert. Keep one logical assertion per test. Prefer a real
object to a mock; use a test double only at a boundary you do not control.

```python
def test_rejects_debit_that_would_overdraw():
    account = Account(balance=10)

    with pytest.raises(ValueError, match="insufficient funds"):
        account.debit(11)

    assert account.balance == 10
```

### 3. Run it and watch it fail

Run the single test first, then the file. The failure must be the one you
intended: a missing behavior, not a syntax error, import error, bad fixture, or
wrong assertion.

If the test passes immediately, it is not proving new behavior. Fix the test or
the premise. A test that has never failed is a test you do not trust.

### 4. Make it pass with the minimum code

Write only enough production code to satisfy the failing test. Resist
speculative abstractions, unused parameters, and "while I am here" cleanup. The
next test will tell you what to build next.

Run the new test until it passes, then run the adjacent tests.

### 5. Refactor under green

Improve names, duplication, and structure without changing observable behavior.
Run the tests after every small step. If a refactor requires new behavior, stop
and start a new red cycle.

### 6. Repeat, then run the suite

Repeat from step 1 for each acceptance criterion. When the slice is complete,
run the full relevant suite, not only the tests you touched.

### The Prove-It pattern for bugs

1. Read the report and restate the incorrect behavior.
2. Write a test that fails on the current code for the reported reason.
3. Confirm the failure message matches the report, not a neighbouring problem.
4. Fix the cause, not the symptom.
5. Keep the reproduction test forever. It is now a regression guard.

If you cannot reproduce the bug in a test, you do not yet understand it well
enough to fix it.

### Test quality bar

A good test is:

- **Behavioral** — asserts observable outcomes, not private implementation.
- **Deterministic** — no sleeps, live networks, unseeded randomness, or real
  clocks.
- **Independent** — passes alone and in any order.
- **Fast** — the unit suite gives feedback in seconds.
- **Meaningful** — at least one assertion fails if the behavior regresses.
- **Complete on failure paths** — covers invalid input and expected errors.

A test with no assertion is test theater. A test that cannot fail is worse than
no test, because it manufactures confidence.

**Exit condition:** a failing test was observed for the intended reason, the
implementation passes it, and the full relevant suite is green.

## Common Rationalizations

| Rationalization | Why it is wrong | Required action |
| --- | --- | --- |
| "It is a one-line change; a test is overkill." | One-line changes cause outages, and the line is rarely the whole change. | Add or run a test that covers the behavior, then change the line. |
| "I will add tests in a follow-up." | Follow-ups are dropped, and untested code becomes legacy immediately. | Test in the same change, or do not claim completion. |
| "The test is hard to write." | Hard-to-test code is a design signal, not permission to skip coverage. | Introduce a seam or add a characterization test at the boundary first. |
| "I manually verified it." | Manual checks are not repeatable and do not prevent regressions. | Automate the check. Manual testing supplements, never replaces. |
| "It works on my machine." | Local success does not prove portability or CI correctness. | Run the suite in a CI-equivalent environment and record it. |
| "The failing test is unrelated or flaky." | That might be true, but it is a claim that needs evidence. | Reproduce on a clean baseline, isolate the cause, and report it. |
| "I changed the test so it passes." | You may have weakened the only proof of correctness. | Justify every test change, and prove it still fails without the fix. |
| "The user wants speed, so I will skip the process." | Rework costs more than the test cycle, and incidents cost more still. | Ship the smallest tested slice and explain the tradeoff. |
| "It is only a prototype." | Prototypes become production more often than anyone admits. | Label it throwaway and isolate it, or test it. |
| "Coverage is high enough." | Coverage measures execution, not assertion quality. | Test behavior, boundaries, and failure paths. |
| "No time to run the full suite." | Partial verification is not completion. | Run it. If blocked, report exactly what ran and what did not. |

## Red Flags

- Production code was written before any test.
- The new test passed on its first run.
- The failure was a crash or import error, not the missing behavior.
- A test was deleted, skipped, or loosened to get green.
- The implementation adds behavior no test describes.
- Mocks replace the logic under test, so the test proves the mock.
- Tests depend on execution order or shared mutable state.
- Test names describe functions rather than behavior.
- Only the happy path is covered.
- The full suite was not run before declaring completion.

## Verification

- [ ] A new or updated test existed before the implementation.
- [ ] The test was run and observed failing for the intended reason.
- [ ] The failure output is recorded, not paraphrased.
- [ ] The test still fails if the fix is reverted.
- [ ] The new test passes.
- [ ] Adjacent and related tests pass.
- [ ] The full relevant suite passes with no new failures.
- [ ] No tests were skipped, deleted, or weakened.
- [ ] Failure paths and boundaries have coverage.
- [ ] No production behavior exists without a test that describes it.
