---
description: Prepare and execute a safe release with rollback and monitoring
argument-hint: <version or release scope>
---

Use the `shipping-and-launch` skill, and the `git-workflow-and-versioning` skill
for the tag and changelog.

Release: $ARGUMENTS

Requirements:

1. Confirm the readiness checklist on the release commit.
2. Write success and abort thresholds before deploying.
3. Choose the rollout shape that matches the risk.
4. State the exact rollback command, who can run it, and how long it takes.
5. Confirm logs, metrics, and alerts identify the release.
6. Name the person on point for the watch window.
7. Execute, watch for the full window, then close the loop on flags and docs.

Do not deploy if the rollback has never been tested or no one is on point.
