---
name: code-review-and-quality
description: Reviews a diff for correctness, risk, and missing evidence before merge. Use when preparing a change for commit, reviewing a pull request, reviewing AI-generated code, or deciding whether work is genuinely done.
license: MIT
compatibility: opencode, claude-code, cursor, copilot, codex
metadata:
  version: 1.0.0
  phase: verify
---

# Code Review and Quality

## Overview

A review is the last point where a defect can be caught cheaply. It is not a
style preference exercise and not a rubber stamp. The question is whether the
diff does what the spec says, without breaking anything else, and with evidence
that it was actually run.

Agents need this gate more than humans do. Generated code tends to be plausible:
it compiles, it reads well, and it often works on the happy path. Plausibility
is not correctness. The reviewer's job is to demand the evidence.

Review the tests before the implementation. Tests reveal what the author
believed the behavior to be, and weak tests are easier to spot than subtle bugs.

## When to Use

Use this skill when:

- Preparing any change for commit, push, or merge.
- Reviewing a pull request, including your own before requesting review.
- Reviewing AI-generated or AI-assisted code.
- Deciding whether a task is complete.
- A change touches security, money, permissions, migrations, or public APIs.

Do not use it for:

- Reading code to understand it, with no decision to make.
- A documentation-only change with no executable behavior, beyond a link and
  spelling check.

Related: use the `test-driven-development` skill to produce the evidence this
skill checks, and the `shipping-and-launch` skill after merge.

## Core Process

### 1. Establish intent

Read the linked spec, issue, or commit message first. Without intent, you can
only judge style. If there is no stated intent, request one before reviewing the
diff.

### 2. Read the diff in a deliberate order

1. **Tests** — do they describe the behavior, including failure paths?
2. **Production code** — does it implement only that behavior?
3. **Configuration and migrations** — are they reversible and safe?
4. **Unrelated changes** — was anything included that the spec did not ask for?

### 3. Check correctness

- Does each acceptance criterion have a passing test?
- Are boundaries handled: empty, one, many, maximum, negative, null?
- Are errors propagated or deliberately handled, not swallowed?
- Is state shared safely under concurrency?
- Is data validated at the boundary?
- Does the change preserve backward compatibility where required?
- Is the logic readable without the author explaining it?

### 4. Check the evidence

Claims are not evidence. Look for the commands and their output:

- The red test before the fix.
- The full relevant suite after it.
- Lint, format, type check, and build.
- A manual check only where automation is impossible, with steps recorded.

If evidence is missing, the review is not complete. "CI will run it" is not
evidence that it passed.

### 5. Check risk

- Secrets, credentials, and personal data are absent from the diff and logs.
- Migrations are reversible or have a tested recovery path.
- External calls have timeouts and bounded retries.
- Destructive operations require approval and a rollback.
- Feature flags default to the safe state.

### 6. Label findings by severity

| Severity | Meaning | Effect |
| --- | --- | --- |
| Blocker | Incorrect, unsafe, or unverified behavior | Must be fixed before merge |
| Major | Likely defect or missing coverage of an important path | Should be fixed before merge |
| Minor | Maintainability issue with no current defect | Fix now or file a task |
| Nit | Preference or local style | Author's discretion |

Cite the file and line. State the problem, why it matters, and the smallest
acceptable fix. Do not rewrite the change in a comment unless asked.

### 7. Review the tests as carefully as the code

Look for tests that cannot fail, assert nothing meaningful, mock the logic under
test, depend on order, or cover only the happy path. A weakened test is a
blocker, not a nit.

### 8. Decide and record

End with one of: approve, approve with nits, or request changes. List the
blockers explicitly. A review that ends in vague encouragement is not a review.

### 9. Verify the follow-up

When the author says a blocker is fixed, re-read the relevant diff and the test
output. Do not approve on the strength of the reply alone.

**Exit condition:** every acceptance criterion has evidence, every blocker is
resolved, and the diff contains only the intended change.

## Common Rationalizations

| Rationalization | Why it is wrong | Required action |
| --- | --- | --- |
| "The tests pass, so it is fine." | Tests can be weak, incomplete, or testing the mock. | Read the tests and check they would fail without the fix. |
| "It is a small diff." | Small diffs cause outages too, and small diffs are cheap to review properly. | Review it with the same checklist. |
| "The author is senior." | Seniority is not evidence, and everyone ships mistakes. | Ask for the command output. |
| "I will fix it in a follow-up." | Follow-ups are dropped, and the defect ships now. | Block on defects, not on preferences. |
| "The linter is green." | Lint checks syntax and style, not behavior or safety. | Check correctness and risk separately. |
| "We are late; approve now." | Shipping a defect costs more time than a short delay. | State the risk and let the owner decide explicitly. |
| "I reviewed it in my head." | A mental review cannot be verified and misses the diff. | Read the actual diff, tests first. |
| "AI wrote it, so it is probably fine." | Generated code is plausible by construction, not correct by construction. | Demand the same evidence as any other change. |
| "The tests were already failing." | That is a baseline claim, not an exemption. | Require a clean baseline or an explicit, scoped exception. |

## Red Flags

- The tests are not in the diff, or were added afterward.
- The test asserts the mock, not the behavior.
- The full suite was not run, and the report says "should pass".
- A failing test was skipped or loosened to get green.
- The diff includes unrelated refactoring or formatting.
- New behavior has no acceptance criterion.
- Secrets or personal data appear in code, fixtures, or logs.
- A migration is irreversible with no recovery plan.
- Error paths swallow exceptions or return success on failure.
- The review has no severity labels, so nothing is actually blocking.
- Approval was given without reading the tests.

## Verification

- [ ] The intent and spec are linked and understood.
- [ ] Tests were reviewed before production code.
- [ ] Every acceptance criterion has a test that would fail without the change.
- [ ] Failure paths and boundaries are covered.
- [ ] The full relevant suite was run and its output recorded.
- [ ] Lint, format, type check, and build passed.
- [ ] No tests were skipped, deleted, or weakened.
- [ ] Secrets, credentials, and personal data are absent.
- [ ] Migrations and destructive changes have rollback plans.
- [ ] Every finding has a severity, a location, and a concrete fix.
- [ ] The diff contains no out-of-scope changes.
- [ ] Blockers are resolved and re-verified, not merely acknowledged.
