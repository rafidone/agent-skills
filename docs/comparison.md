# How This Catalog Compares

There is no shortage of agent instructions. The useful question is not "how many
rules" but "what happens when the agent is under pressure to skip one". This
page compares the common approaches and states where this catalog is a poor fit.

## Four common approaches

| Approach | Shape | Strength | Weakness |
| --- | --- | --- | --- |
| Single system prompt | One long instruction block pasted into every session | Simple, no install | Everything loads everywhere, so the agent learns to skim |
| Tool-specific rule files | `.cursor/rules`, `copilot-instructions.md`, `CLAUDE.md` per host | Native to each host | Content forks per host and drifts |
| Large uncategorized skill pack | Dozens of skills with overlapping scope | Broad coverage | Routing collisions, duplicated advice, context cost |
| Phase-scoped catalog | One skill per phase, with gates and evals | Deterministic routing, enforced exit conditions | Requires an install step and a routing file |

This repository takes the fourth approach. It is closer to a small set of
engineering disciplines than to a prompt library.

## What is different here

### Routing is tested, not assumed

Most packs rely on the model to pick the right skill from a description. That
works until two descriptions overlap or a description omits the words users
actually type.

This catalog ships a trigger tier that scores natural prompts against every
description and fails below an 85 percent rank-1 rate. When a skill does not
route, the description is fixed. The eval is not weakened.

See [`../evals/README.md`](../evals/README.md).

### Every skill rejects specific excuses

A checklist tells an agent what to do. It does not stop the agent from
rationalizing a shortcut under time pressure. Each skill has a
`Common Rationalizations` table that names the excuse and the required response:

| Excuse | Response in the skill |
| --- | --- |
| "It is a one-line change; a test is overkill." | Add or run a test that covers the behavior, then change the line. |
| "We can roll back with git revert." | Write and rehearse the real rollback. |
| "The user wants speed, so I will skip the process." | Ship the smallest tested slice and explain the tradeoff. |

This is the part that changes behavior. A rule an agent understands is harder to
rationalize away than a rule it merely repeats.

### Verification is checkable

Every skill ends with a checklist whose items can be run or observed. "Code is
clean" is rejected in favor of "the full relevant suite passes and the output is
recorded". The same standard applies to the repository itself: the skill
contract is enforced by a validator, not by review alone.

See [`skill-anatomy.md`](skill-anatomy.md).

### One source of truth across hosts

Skills are authored once under `skills/` and installed by symlink. Host-specific
material is reduced to a short pointer: `AGENTS.md`, `CLAUDE.md`, a Cursor rule,
or a Copilot instruction file. No host gets a forked copy, so no host drifts.

### The catalog is small on purpose

Eleven skills cover the lifecycle. A new skill must remove a decision an agent
would otherwise get wrong and must route cleanly against the existing set. The
acceptance bar is in [`../CONTRIBUTING.md`](../CONTRIBUTING.md).

## Where this catalog fits

Use it when:

- You want an agent to follow a spec-test-review-ship sequence rather than
  improvise.
- You work across more than one host and want one source of truth.
- You care about evidence: failing tests, recorded commands, rollback plans.
- You are willing to install a catalog and keep a routing file current.

## Where it does not fit

- **A single prompt would do.** For a one-off script or a throwaway prototype,
  the full lifecycle is overhead. Use the smallest skill that applies, or none.
- **You need domain knowledge.** These skills are about process, not about your
  framework, database, or regulatory regime. Pair them with project-specific
  references.
- **You cannot install anything.** If a host loads only a single instruction
  blob, copy the two or three skills you need into it. The procedures are
  self-contained by design.
- **You want a large library.** This is a curated catalog. If you need breadth
  across many domains, a larger pack with a different routing model is a better
  match.

## Compared with a single mega-prompt

A mega-prompt front-loads everything. It is easy to adopt and hard to maintain:
every addition increases context cost for every task, and contradictions become
invisible. This catalog loads one phase at a time and re-routes explicitly, so
the agent sees the procedure that applies now.

The tradeoff is installation and routing discipline. If a host cannot read
repository files, the mega-prompt is the pragmatic choice.

## Compared with tool-specific rule sets

Rule files are native and convenient, but they are per host. Maintaining the
same guidance in `.cursor/rules`, `.github/copilot-instructions.md`, and
`CLAUDE.md` produces three versions that diverge. This catalog keeps the content
in `skills/` and reduces each host adapter to a pointer.

The tradeoff is that hosts without native skill loading need a rule or
instruction file that names the skill paths. Those are in
[`installation.md`](installation.md).

## Compared with larger skill packs

Larger packs cover more ground. That breadth is real, and this catalog does not
try to match it. The failure mode of a large pack is a routing collision: two
skills both look applicable, the model picks one, and the gates of the other are
silently skipped.

The eleven skills here are chosen to be mutually exclusive at the top level.
Where they compose, the order is fixed: define, plan, build, verify, ship. The
meta-skill exists to make that order explicit and to announce phase changes.

## See also

- [`getting-started.md`](getting-started.md) for a first run.
- [`installation.md`](installation.md) for every host.
- [`../README.md`](../README.md) for the catalog.
