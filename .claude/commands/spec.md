---
description: Write a reviewable specification before implementation
argument-hint: <feature, change, or bug>
---

Use the `spec-driven-development` skill for this request.

Produce a specification for: $ARGUMENTS

Requirements:

1. Restate the problem in one sentence and name the user-visible outcome.
2. List scope and explicit non-goals.
3. Write acceptance criteria as observable behavior, each with a test that
   would prove it.
4. Define interfaces, inputs, outputs, and error contracts.
5. List failure modes and the expected response for each.
6. Name the tests in the test plan, not just the test files.
7. State the rollback or containment strategy.

Do not write production code in this command. If a requirement is ambiguous,
ask at most three blocking questions, then choose the safest reversible default
and record it under `Assumptions`.
