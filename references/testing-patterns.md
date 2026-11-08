# Testing Patterns

A reference for choosing the right kind of test. Skills link here rather than
embedding a catalogue.

## The shape of a test

```text
Arrange  - build the smallest world the behavior needs
Act      - perform the one action under test
Assert   - observe the outcome the user or caller can see
```

One logical assertion per test. If the test name needs "and", split the test.

## Naming

Name the behavior, not the function.

| Weak | Strong |
| --- | --- |
| `test_debit` | `rejects a debit that would overdraw the account` |
| `test_parse_2` | `reports the line number of an unclosed block` |
| `works` | `returns an empty list when no matches exist` |

## Choosing the seam

- Test through the public interface of the unit when possible.
- Use a real dependency when it is fast and deterministic.
- Use a fake at a boundary you do not control: network, clock, filesystem,
  payment provider.
- Do not mock the logic under test. A test that proves the mock proves nothing.

## Test doubles

| Kind | Use for | Risk |
| --- | --- | --- |
| Stub | Returning a fixed value | Hides real failure modes |
| Fake | A lightweight working implementation | Can drift from the real thing |
| Spy | Asserting an interaction happened | Couples the test to implementation |
| Mock | Verifying calls on an external boundary | Over-specifies and breaks on refactor |

Prefer a fake or a real object. Reach for a mock only when the interaction
itself is the contract.

## Kinds of tests

| Kind | Proves | Speed |
| --- | --- | --- |
| Unit | One behavior in isolation | Fast |
| Integration | Components work together | Medium |
| Contract | Two sides agree on an interface | Medium |
| End to end | A user journey works | Slow |
| Characterization | Current behavior is preserved | Fast |
| Property | A rule holds across generated inputs | Medium |
| Benchmark | Performance did not regress | Slow |

Use the cheapest kind that can catch the defect. Do not use end-to-end tests to
cover logic a unit test can prove.

## Determinism

- Inject the clock; never call the real one in a test.
- Seed randomness and record the seed.
- Do not sleep. Wait on a condition or use a virtual clock.
- Isolate filesystem and network access behind a seam.
- Make each test create and destroy its own state.
- Never depend on test execution order.

## Bugs

1. Reproduce the reported behavior in a failing test.
2. Confirm the failure message matches the report.
3. Fix the cause.
4. Keep the test forever.

A bug that was never reproduced in a test is a bug that can return.

## Refactors

Before changing structure, add a characterization test that pins the current
observable behavior. It does not need to assert the behavior is desirable; it
needs to assert that it did not change.

Then refactor in small steps, running the suite after each.

## Flaky tests

A flaky test is a defect, not noise.

1. Capture the failure with its seed, timestamp, and environment.
2. Reproduce it in a loop until it fails.
3. Find the shared state, ordering dependency, timing assumption, or external
   service.
4. Fix the cause, or quarantine the test with an owner and a deadline.

Never add a retry to make a flaky test pass. Retries hide the defect and slow
the suite.
