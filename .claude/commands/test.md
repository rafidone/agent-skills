---
description: Prove a behavior with a failing test, or diagnose a failing one
argument-hint: <behavior, bug, or failing test>
---

Use the `test-driven-development` skill. If a test is already failing for an
unknown reason, use the `debugging-and-error-recovery` skill instead.

Target: $ARGUMENTS

Requirements:

1. State the behavior under test in one sentence.
2. Write the smallest test that expresses it.
3. Run it and show the failure. Confirm it fails for the intended reason.
4. If fixing a bug, reproduce the bug before changing production code.
5. Implement the minimum fix.
6. Run the new test, the adjacent tests, and the full relevant suite.
7. Keep the regression test permanently.

Do not weaken, skip, or delete an existing test to get green.
