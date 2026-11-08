---
name: git-workflow-and-versioning
description: Creates small, reviewable commits and a clear branch and version history. Use when staging changes, writing commit messages, splitting work into commits, preparing a release tag, or repairing a messy history before review.
license: MIT
compatibility: opencode, claude-code, cursor, copilot, codex
metadata:
  version: 1.0.0
  phase: ship
---

# Git Workflow and Versioning

## Overview

Git history is the record of why the code looks the way it does. A good history
lets a future engineer find the change that introduced a bug, understand the
tradeoff, and revert one decision without reverting five others.

A commit is a logical change with its tests, not a save point. "WIP", "fixes",
and a 60-file diff are not history; they are a backup that happens to be stored
in Git.

Tags and versions are part of the same contract. A version number tells
consumers what to expect. A tag that does not match the manifest is a broken
promise.

## When to Use

Use this skill when:

- Staging or committing any change.
- Deciding where one commit ends and the next begins.
- Writing a commit message or a pull request description.
- Preparing a release tag or a changelog.
- Cleaning up a branch before review.
- Recovering from a merge, rebase, or accidental commit.

Do not use it for:

- Reading history to understand code; that is ordinary repository use.
- A detached scratch checkout where nothing will be committed.

Related: use the `code-review-and-quality` skill before committing, and the
`shipping-and-launch` skill after the tag.

## Core Process

### 1. Establish a clean baseline

Run the relevant tests before staging. Never commit a known-red change as a
checkpoint unless the commit message says so explicitly and the branch is
private.

### 2. Decide the commit boundary

One commit should represent one logical change that a reviewer can understand
and revert independently:

- A behavior change plus its test.
- A refactor with no behavior change.
- A dependency bump with its lockfile.
- A documentation correction.
- A formatting pass, separate from everything else.

If the message needs "and", consider splitting.

### 3. Stage selectively

Use `git add -p` or explicit paths. Review the staged diff with
`git diff --cached` before committing. Do not use `git add .` in a repository
where unrelated files may be present.

Check for secrets, large binaries, editor files, and debug output before the
commit, not after the push.

### 4. Write the message

```text
<type>(<scope>): <imperative summary, 72 characters or fewer>

Why the change is needed. What was wrong, what the user saw, or what the
requirement is. Link the issue or spec.

How the change addresses it, including any tradeoff or rejected alternative.

Evidence: the commands run and their results.
```

Conventional Commits types are a useful default: `feat`, `fix`, `refactor`,
`test`, `docs`, `build`, `ci`, `perf`, `chore`. Use them only if the project
already does; consistency beats novelty.

The subject is imperative and describes the result: "reject overdrafts", not
"rejected overdrafts" or "fixing bug". The body explains why, which the diff
cannot.

### 5. Commit and let hooks run

Do not bypass hooks with `--no-verify`. If a hook fails, fix the cause. If the
hook is wrong, fix the hook in a separate commit.

### 6. Choose a branch strategy

- **Trunk-based** is the default for small teams and frequent releases. Short
  branches, merged within days.
- **Feature branches** are fine when a change must be reviewed as a unit.
- **Release branches** are for maintaining older versions, not for hiding
  unstable work.

Keep branches short-lived. A branch open for weeks accumulates conflicts and
loses the benefit of continuous integration.

### 7. Version deliberately

Use semantic versioning for anything with consumers:

- `MAJOR` for a breaking change.
- `MINOR` for backward-compatible behavior.
- `PATCH` for backward-compatible fixes.

Annotate release tags: `git tag -a v1.4.0 -m "v1.4.0"`. Keep the manifest
version, the changelog, and the tag in sync in the same commit.

### 8. Do not rewrite shared history

Rebase and amend are fine on a private branch. Once a branch is shared and
reviewed, prefer merge or revert over force-push. If a secret was committed,
rotate it; rewriting history is not sufficient.

**Exit condition:** every commit is independently understandable and green, the
tag matches the manifest, and shared history is intact.

## Common Rationalizations

| Rationalization | Why it is wrong | Required action |
| --- | --- | --- |
| "WIP commits are fine; I will squash later." | Squashing is often skipped, and the intermediate history is unreadable meanwhile. | Commit logical changes as you go. |
| "The message does not matter." | It is the only explanation a future reader has. | Write the why in the body. |
| "One big commit is simpler." | It cannot be reviewed, bisected, or reverted cleanly. | Split by logical change. |
| "I will force-push to tidy up." | It rewrites shared history and breaks other clones. | Force-push only on a private branch. |
| "Tags are optional." | Consumers and releases depend on them being accurate. | Tag releases and keep the manifest in sync. |
| "`git add .` is faster." | It stages secrets, binaries, and unrelated work. | Stage explicit paths and review the diff. |
| "I will skip the hook this once." | The hook exists because the check matters. | Fix the cause or the hook. |
| "The version bump is a formality." | A wrong version breaks installs and rollbacks. | Bump semver according to the actual change. |

## Red Flags

- The commit subject is "wip", "fixes", "updates", or empty.
- One commit mixes refactoring, behavior, and formatting.
- Tests and implementation are in separate commits with a red commit between.
- A secret or large binary appears in the diff.
- The staged diff was never reviewed.
- Hooks are bypassed.
- The tag and the manifest version disagree.
- A shared branch was force-pushed.
- History was rewritten to hide a leaked credential.
- A release tag has no changelog entry.

## Verification

- [ ] The baseline test suite was green before committing.
- [ ] Each commit represents one logical change.
- [ ] Tests and their behavior change are in the same commit.
- [ ] The staged diff was reviewed for secrets and unrelated files.
- [ ] Every commit subject is imperative and under 72 characters.
- [ ] Every commit body explains why, not just what.
- [ ] Hooks ran and passed.
- [ ] The branch is short-lived and up to date.
- [ ] The version follows semantic versioning for the actual change.
- [ ] The tag, manifest, and changelog agree.
- [ ] Shared history was not rewritten.
