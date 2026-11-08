---
description: Review a diff for correctness, risk, and missing evidence
argument-hint: <diff, branch, or pull request>
---

Use the `code-review-and-quality` skill for this request.

Review: $ARGUMENTS

Requirements:

1. Read the intent first: the spec, issue, or commit message.
2. Read the tests before the production code.
3. Check every acceptance criterion for a test that would fail without the fix.
4. Check failure paths, boundaries, concurrency, and data safety.
5. Confirm the evidence: tests, lint, types, build. Do not accept "should pass".
6. Label every finding as blocker, major, minor, or nit, with a file and line.
7. State the decision explicitly: approve, approve with nits, or request changes.

Do not rewrite the change in comments. Point at the problem and the smallest
acceptable fix.
