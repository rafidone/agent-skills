# Definition of Done

A shared checklist for deciding whether a change is complete. Skills link here
instead of restating the list.

## Contract

- [ ] A spec exists with observable acceptance criteria and explicit non-goals.
- [ ] Every acceptance criterion maps to at least one test.
- [ ] Interfaces, error contracts, and failure modes are defined.
- [ ] Scope changes were recorded in the spec, not only in the diff.

## Tests

- [ ] A new or updated test existed before the implementation.
- [ ] The test was observed failing for the intended reason.
- [ ] The test fails again if the fix is reverted.
- [ ] Failure paths and boundaries are covered.
- [ ] No test was skipped, deleted, or weakened to get green.
- [ ] The full relevant suite passes.

## Static quality

- [ ] Lint passes with zero errors.
- [ ] No new warnings were introduced.
- [ ] Formatting check passes.
- [ ] Type checking passes.
- [ ] The build succeeds.
- [ ] Any suppression is scoped, justified, owned, and time-limited.

## Safety

- [ ] No secrets, credentials, or private keys are present.
- [ ] No unnecessary personal data is logged or stored.
- [ ] Migrations are reversible or have a tested recovery plan.
- [ ] External calls have timeouts and bounded retries.
- [ ] Destructive operations have approval and a rollback path.

## Review

- [ ] The complete diff was reviewed, tests first.
- [ ] No unrelated changes are included.
- [ ] Every blocker is resolved and re-verified.
- [ ] The change is independently revertible.

## Handoff

- [ ] Commands run and their results are recorded.
- [ ] Assumptions and residual risks are stated.
- [ ] Anything not run is labelled as not run.
- [ ] Follow-up work has an owner and a task.

If any item is false, the change is not done. Say so and continue working.
