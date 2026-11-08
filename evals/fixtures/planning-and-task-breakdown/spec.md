# Spec: saved searches

## Problem

Users rebuild the same search every day. They want to save a query and return
to it later.

## Outcome

A signed-in user can save the current search, see it in a list, and re-run it.

## Scope

- Save a named search with its filters.
- List saved searches for the current user.
- Re-run a saved search from the list.
- Delete a saved search.

## Non-goals

- Sharing saved searches with other users.
- Scheduled alerts based on a saved search.
- Cross-device sync beyond the user's account.

## Acceptance criteria

- Given a signed-in user and a valid search, when they save it with a name,
  then it appears in their list.
- Given a saved search, when the user re-runs it, then the original filters are
  applied.
- Given a saved search owned by another user, when a user requests it, then the
  API returns 404.
- Given a duplicate name for the same user, when they save again, then the API
  returns 409.
- Given a saved search, when the owner deletes it, then it no longer appears.

## Failure modes

- Empty name: 422 with a field error.
- Unauthenticated request: 401.
- Search references a deleted filter: the result is empty, not an error.

## Test plan

- Unit tests for name validation and duplicate detection.
- Integration tests for save, list, re-run, and delete.
- Authorization test for cross-user access.
