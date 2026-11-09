<div align="center">

# Agent Skills

**Production-grade engineering workflows for AI coding agents: from specification to release.**

[![CI](https://github.com/rafidone/agent-skills/actions/workflows/validate.yml/badge.svg)](https://github.com/rafidone/agent-skills/actions/workflows/validate.yml)
[![Release](https://img.shields.io/github/v/release/rafidone/agent-skills)](https://github.com/rafidone/agent-skills/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node 20+](https://img.shields.io/badge/node-20%2B-brightgreen)](package.json)

[Overview](#overview) • [Quick Start](#quick-start) • [Why This Exists](#why-this-exists) • [Architecture](#architecture) • [Skills Catalog](#skill-catalog) • [Enterprise](#enterprise-practices)

</div>

Agent Skills is a curated catalog of eleven composable engineering disciplines
for AI coding agents. Each skill encodes one phase of the software lifecycle,
the procedure an agent must follow, the rationalizations it must reject, and the
verification checks that prove the work is complete.

The catalog is plain Markdown, portable across OpenCode, Claude Code, Codex,
Cursor, and GitHub Copilot, and enforced by deterministic tooling in CI. The
objective is not to give an agent more instructions. It is to give it a smaller
number of precise contracts with gates that block premature completion.

---

## Overview

An agent without a workflow optimizes for plausible output. It writes code that
compiles, skips the failing test, and reports success. The failure is rarely
laziness; it is the absence of a contract that defines what success means.

Agent Skills supplies that contract once per phase and makes it portable:

| Capability | Implementation |
| --- | --- |
| Phase-scoped procedures | Eleven skills, one per lifecycle phase, each with an ordered process and explicit exit condition |
| Deterministic routing | Descriptions tuned and evaluated against natural-language prompts |
| Anti-rationalization | A required table of excuses and rebuttals in every skill |
| Machine-enforced structure | A linter and repository validator run locally and in CI |
| Tested behavior | Trigger evals for every skill and behavioral evals for the core set |
| Host portability | One canonical source, thin adapters, no forked procedures |
| Supply-chain minimalism | Pure Markdown and dependency-free Node.js scripts |

## Quick Start

### 1. Install with npx

The fastest path installs the catalog into the current project:

```bash
npx skills add rafidone/agent-skills
```

The installer copies every skill into the discovery paths your host reads. To
target a specific host or directory with the bundled runner:

```bash
npx agent-skills add rafidone/agent-skills --host opencode
npx agent-skills add rafidone/agent-skills --host claude --dir /path/to/project
npx agent-skills add --host all --personal
```

Run `npx agent-skills --help` for all flags, or `npx agent-skills list` to see
the bundled skills.

### 2. Clone the Catalog

Choose a stable location. Other projects link to it rather than copying, so
updates arrive with a single `git pull`.

```bash
git clone https://github.com/rafidone/agent-skills.git
cd agent-skills
```

### 3. Install for Your Host

OpenCode discovers a directory of skills, so one relative symlink installs the
whole catalog:

```bash
mkdir -p .opencode
ln -sfn ../skills .opencode/skills
```

Claude Code and Codex discover one directory per skill:

```bash
mkdir -p .claude/skills
for skill in skills/*/; do
  ln -sfn "../../$skill" ".claude/skills/$(basename "$skill")"
done
```

To install into a different project, point at this checkout explicitly:

```bash
AGENT_SKILLS="$HOME/src/agent-skills"
cd /path/to/your/project
mkdir -p .opencode
ln -sfn "$AGENT_SKILLS/skills" .opencode/skills
```

The complete matrix, including personal installs, Windows notes, updating, and
removal, is in [`docs/installation.md`](docs/installation.md).

### 4. Verify the Installation

Run the repository gates:

```bash
node scripts/validate-skills.js
node scripts/validate-repo.js
node --test scripts/**/*.test.js
node scripts/run-evals.js --min-rank1 85
```

Expected summary lines:

```text
11 skills, 0 errors, 0 warnings
6 checks passed, 0 errors
# tests 22
# pass 22
# fail 0
Trigger tier: 33 positive prompts, 33 ranked first (100.0 percent), 0 failures
```

Confirm a specific host sees the catalog:

```bash
readlink -f .opencode/skills
ls .opencode/skills/*/SKILL.md
```

### 5. Run Your First Routed Task

Open a session in the project and submit a normal feature request:

```text
Add saved searches. Users can save the current search, list their saved
searches, re-run one, and delete one.
```

A correctly routed agent does not start editing files. It announces
`spec-driven-development`, writes a short spec, then moves through planning,
incremental implementation, TDD, review, and commit. If it jumps straight to
code, force the route explicitly:

```text
Use the using-agent-skills skill to choose the right workflow for this task.
```

## Why This Exists

Most agent instructions fail in one of two ways. A single large prompt loads
everything into every session, so the agent learns to skim. A large uncategorized
skill pack creates routing collisions, where two skills look applicable and the
gates of the one not chosen are silently skipped.

This catalog takes a third approach: a small number of mutually exclusive skills,
one per phase, composed in a fixed order when they cooperate. The meta-skill
`using-agent-skills` classifies the task, loads exactly one primary skill, and
announces any phase change rather than switching disciplines silently.

For a detailed comparison against mega-prompts, host-specific rule sets, and
larger skill packs, see [`docs/comparison.md`](docs/comparison.md).

## Architecture

The repository separates four concerns that usually get mixed together:

| Layer | Responsibility | Location |
| --- | --- | --- |
| Content | The engineering procedures and their quality gates | [`skills/`](skills) |
| Routing | Which skill applies, in what order, and when to re-route | [`AGENTS.md`](AGENTS.md), skill descriptions |
| Adapters | Host-specific discovery and invocation | `.opencode/`, `.claude/`, `.claude-plugin/`, `.codex-plugin/`, `.agents/plugins/`, `.github/` |
| Enforcement | Structure, integrity, and routing verification | [`scripts/`](scripts), [`.github/workflows/validate.yml`](.github/workflows/validate.yml) |

### The Lifecycle

```text
  using-agent-skills
        |
        |  classifies the task and loads one primary skill
        v
  DEFINE
    spec-driven-development
    constraint-driven-development
        |
        v
  PLAN
    planning-and-task-breakdown
        |
        v
  BUILD
    incremental-implementation
    test-driven-development
    debugging-and-error-recovery
    code-simplification
        |
        v
  VERIFY
    code-review-and-quality
        |
        v
  SHIP
    git-workflow-and-versioning
    shipping-and-launch
```

The phases are not a waterfall. A failing test sends build back to debugging, a
review blocker sends verify back to build, and a spec gap sends any phase back
to define. What must not happen is a silent phase change. Each move is announced
and the matching skill is loaded.

### Design Principles

| Principle | What it means in practice |
| --- | --- |
| One skill, one phase | A skill has a single exit condition and does not restate another phase's procedure |
| Evidence over claims | Verification sections require commands and output, not confident summaries |
| Fail closed | A red gate blocks completion; no skill may weaken a check to get green |
| Single source of truth | Procedures live in `skills/` and are referenced, never forked, by adapters |
| Contract before content | [`docs/skill-anatomy.md`](docs/skill-anatomy.md) defines the shape the linter enforces |
| Tested routing | A description that fails to rank is fixed, not excused |
| Proportional ceremony | Small changes use the smallest applicable gate, not the whole lifecycle |

## Feature Highlights

| Area | What ships |
| --- | --- |
| Skill catalog | Eleven skills, 1,775 lines of procedure across define, plan, build, verify, and ship |
| Skill contract | Frontmatter allowlist, required sections, naming rules, support-file rules, and a 500-line context budget |
| Linter | [`scripts/lib/skill-lint.js`](scripts/lib/skill-lint.js), 22 unit tests, importable and CLI-driven |
| Skill validator | [`scripts/validate-skills.js`](scripts/validate-skills.js) with human and JSON output |
| Repository validator | [`scripts/validate-repo.js`](scripts/validate-repo.js): symlink, manifests, eval coverage, links, hygiene |
| Eval harness | [`scripts/run-evals.js`](scripts/run-evals.js): deterministic trigger tier plus opt-in behavioral tier |
| Eval corpus | 33 positive prompts, 22 negative prompts, 10 behavioral cases across 5 core skills |
| Installer | [`bin/cli.js`](bin/cli.js): dependency-free `npx agent-skills` runner that copies skills into project or personal host directories |
| Extensibility | A new skill is a directory, an eval case, and one routing row; tooling discovers the rest |
| Commands | Six Claude Code slash commands: `/spec`, `/plan`, `/build`, `/test`, `/review`, `/ship` |
| Personas | Code reviewer and test engineer, each with a fixed output format |
| References | Definition of done and testing patterns, linked rather than duplicated |
| Packaging | Generic, Claude Code, Codex, and agent marketplace manifests, version-aligned |
| CI | Structure, integrity, tests, and trigger evals on every push and pull request |

## Repository Layout

```text
.
├── AGENTS.md                     # Intent-based routing contract and precedence rules
├── CLAUDE.md                     # Thin Claude Code pointer
├── CONTRIBUTING.md               # Acceptance bar and skill workflow
├── README.md                     # This document
├── LICENSE                       # MIT
├── plugin.json                   # Generic plugin manifest
├── package.json                  # Version source of truth, npm scripts, and binaries
├── bin/
│   └── cli.js                    # npx installer for host skill directories
├── docs/
│   ├── skill-anatomy.md          # The skill contract enforced by the linter
│   ├── getting-started.md        # Clone to first routed task
│   ├── installation.md           # Full per-host install and removal
│   └── comparison.md             # How this catalog differs from other approaches
├── skills/                       # Canonical skill source, one directory per skill
│   ├── using-agent-skills/
│   ├── spec-driven-development/
│   ├── constraint-driven-development/
│   ├── planning-and-task-breakdown/
│   ├── incremental-implementation/
│   ├── test-driven-development/
│   ├── debugging-and-error-recovery/
│   ├── code-simplification/
│   ├── code-review-and-quality/
│   ├── git-workflow-and-versioning/
│   └── shipping-and-launch/
├── references/
│   ├── definition-of-done.md     # Shared completion checklist
│   └── testing-patterns.md       # Test selection, doubles, determinism, flaky tests
├── agents/
│   ├── code-reviewer.md          # Review persona and output format
│   └── test-engineer.md          # Test persona and output format
├── evals/
│   ├── cases/                    # One trigger and behavioral case file per skill
│   ├── fixtures/                 # Inputs for behavioral cases
│   └── README.md                 # Tiers, schema, and grading policy
├── scripts/
│   ├── lib/
│   │   ├── skill-lint.js         # Linter implementation
│   │   └── skill-lint.test.js    # 22 unit tests
│   ├── validate-skills.js        # Skill contract CLI
│   ├── validate-repo.js          # Repository integrity CLI
│   └── run-evals.js              # Trigger and behavioral runner
├── .claude/
│   └── commands/                 # spec, plan, build, test, review, ship
├── .claude-plugin/               # Claude Code plugin and marketplace manifests
├── .codex-plugin/                # Codex plugin manifest
├── .agents/plugins/              # Generic agent marketplace manifest
├── .opencode/
│   └── skills -> ../skills       # Relative symlink, tracked as mode 120000
└── .github/
    └── workflows/validate.yml    # CI for every gate
```

## Skill Catalog

Route by the question the task is really asking. When several skills apply,
compose them in lifecycle order and load the next one when the work reaches it.

| Phase | Skill | Use when the task is asking | Primary artifact |
| --- | --- | --- | --- |
| Meta | [`using-agent-skills`](skills/using-agent-skills/SKILL.md) | "Which skill applies?" or the request spans several phases | An announced route |
| Define | [`spec-driven-development`](skills/spec-driven-development/SKILL.md) | "What are we building, and how will we know it works?" | A reviewable spec |
| Define | [`constraint-driven-development`](skills/constraint-driven-development/SKILL.md) | "What standard must this meet, and who enforces it?" | A `CONSTRAINTS.md` |
| Plan | [`planning-and-task-breakdown`](skills/planning-and-task-breakdown/SKILL.md) | "How do we break this down, and in what order?" | An ordered task list |
| Build | [`incremental-implementation`](skills/incremental-implementation/SKILL.md) | "How do we land this safely in small pieces?" | A thin vertical slice |
| Build | [`test-driven-development`](skills/test-driven-development/SKILL.md) | "How do we prove this behavior exists?" | A failing test, then a fix |
| Build | [`debugging-and-error-recovery`](skills/debugging-and-error-recovery/SKILL.md) | "Why is this failing, and what is the root cause?" | A reproduction and diagnosis |
| Build | [`code-simplification`](skills/code-simplification/SKILL.md) | "This works, but it is too complicated." | A smaller diff with unchanged behavior |
| Verify | [`code-review-and-quality`](skills/code-review-and-quality/SKILL.md) | "Is this change correct, safe, and proven?" | A severity-labeled review |
| Ship | [`git-workflow-and-versioning`](skills/git-workflow-and-versioning/SKILL.md) | "How do we record this change in history?" | Reviewable commits and a tag |
| Ship | [`shipping-and-launch`](skills/shipping-and-launch/SKILL.md) | "How do we release this without breaking production?" | A rollout with rollback and watch criteria |

Every skill contains the same six sections: Overview, When to Use, Core Process,
Common Rationalizations, Red Flags, and Verification. The required shape is
defined in [`docs/skill-anatomy.md`](docs/skill-anatomy.md) and enforced by the
linter.

## Requirements

| Requirement | Version | Needed for |
| --- | --- | --- |
| Git | Any recent release | Cloning and installing |
| Node.js | 20 or newer | Validation scripts and the eval runner |
| An Agent Skills host | OpenCode, Claude Code, or Codex for native loading | Using the skills |
| Cursor or GitHub Copilot | Current release | Adapter-based usage through `AGENTS.md` |

The skills themselves have no runtime dependencies. Node.js is required only for
the repository's own checks.

## Usage Examples

### Example 1: A Feature From Spec to Ship

Input:

```text
Add notification preferences. Customers choose email, push, or both for each
category, and security notices must always reach at least one channel.
```

Expected behavior:

| Step | Skill | Observable output |
| --- | --- | --- |
| 1 | `spec-driven-development` | Problem, outcome, scope, non-goals, testable acceptance criteria, failure modes, test plan |
| 2 | `planning-and-task-breakdown` | Vertical slices with dependencies and a named acceptance test per task |
| 3 | `incremental-implementation` | A walking skeleton behind a flag, committed as one reviewable slice |
| 4 | `test-driven-development` | A failing test per behavior before the implementation |
| 5 | `code-review-and-quality` | Severity-labeled findings and an explicit merge decision |
| 6 | `git-workflow-and-versioning` | Small commits with an explanation of why, not only what |
| 7 | `shipping-and-launch` | Abort thresholds, a tested rollback, and a watched rollout |

A usable spec produced by step 1 looks like this:

```markdown
## Spec: Notification preferences

### Problem
Customers receive every notification and cannot opt down without losing
security notices.

### Outcome
A signed-in customer controls email and push per category, and security
notices always reach at least one channel.

### Non-goals
Admin editing on a customer's behalf, retroactive changes to queued messages,
and cross-account defaults.

### Acceptance criteria
- Given a category set to email only, when a push event fires, then no push is sent.
- Given security set to neither channel, when the form is submitted, then validation fails.
- Given a mixed selection, when preferences are saved, then they persist for the next delivery.

### Failure modes
Missing push token: fall back to email. Save conflict: return 409 and preserve the prior state.
```

### Example 2: A Production Bug With a Regression Test

Input:

```text
Finance reports that splitCents loses a cent. The reproduction and the function
are in evals/fixtures/test-driven-development/.
```

Inspect the fixture that drives the behavioral case:

```bash
cat evals/fixtures/test-driven-development/BUG.md
cat evals/fixtures/test-driven-development/split.js
```

Expected behavior, in order:

1. Reproduce the report in a failing test before touching production code.
2. Confirm the failure is the missing behavior, not a setup or import error.
3. Fix the cause, not the symptom.
4. Keep the reproduction as a permanent regression guard.
5. Run the new test, the adjacent tests, and the full relevant suite.

A commit produced by that sequence follows the `git-workflow-and-versioning`
contract:

```text
fix(payouts): distribute the cent remainder across shares

splitCents dropped the remainder, so a three-way split of 100 cents
returned 99. Finance traced a missing cent to the payout report.

Distribute one cent to the earliest shares until the total is preserved,
and add a regression test for 100/3 and 100/7.

Verified: node --test test/payouts.test.js (14 passed)
```

### Example 3: Release Readiness

Before a release, run the full gate set and a behavioral dry run:

```bash
npm run check
node scripts/run-evals.js --behavioral --dry-run
```

Then follow `shipping-and-launch`: write success and abort thresholds, state the
exact rollback command, name the person on point, and watch the signals for the
full window. A release without a tested rollback is not ready, regardless of a
green CI run.

### Slash Commands

Claude Code installations expose six commands under `.claude/commands/`:

| Command | Routes to | Purpose |
| --- | --- | --- |
| `/spec` | `spec-driven-development` | Write a reviewable specification |
| `/plan` | `planning-and-task-breakdown` | Decompose a spec into ordered tasks |
| `/build` | `incremental-implementation`, `test-driven-development` | Implement one thin slice |
| `/test` | `test-driven-development`, `debugging-and-error-recovery` | Prove a behavior or diagnose a failure |
| `/review` | `code-review-and-quality` | Review a diff for evidence and risk |
| `/ship` | `shipping-and-launch`, `git-workflow-and-versioning` | Prepare and execute a release |

### Personas and Shared References

| Asset | Use |
| --- | --- |
| [`agents/code-reviewer.md`](agents/code-reviewer.md) | Adopt a skeptical, evidence-driven review stance with a fixed output format |
| [`agents/test-engineer.md`](agents/test-engineer.md) | Design deterministic tests and judge whether a suite is trustworthy |
| [`references/definition-of-done.md`](references/definition-of-done.md) | Shared completion checklist linked by multiple skills |
| [`references/testing-patterns.md`](references/testing-patterns.md) | Test selection, doubles, determinism, and flaky-test policy |

## Configuration and Integration

The skills are host-agnostic. Integration means making the catalog visible to
your host and, where the host supports it, adding a routing file that names the
catalog and the precedence rules. The examples assume `AGENT_SKILLS` points at
your clone:

```bash
export AGENT_SKILLS="$HOME/src/agent-skills"
```

| Host | Native `SKILL.md` | Project discovery path | Adapter |
| --- | --- | --- | --- |
| OpenCode | Yes | `.opencode/skills/` | Directory symlink |
| Claude Code | Yes | `.claude/skills/` | One symlink per skill |
| Codex | Yes | `.codex/skills/` | One symlink per skill |
| Cursor | No | `AGENTS.md`, `.cursor/rules/` | Always-on rule pointing at the catalog |
| GitHub Copilot | No | `AGENTS.md`, `.github/instructions/` | Repository or path-scoped instructions |

### OpenCode

Project-scoped install:

```bash
mkdir -p .opencode
ln -sfn "$AGENT_SKILLS/skills" .opencode/skills
```

Personal install, available in every project:

```bash
mkdir -p ~/.config/opencode/skills
for skill in "$AGENT_SKILLS"/skills/*/; do
  ln -sfn "$skill" "$HOME/.config/opencode/skills/$(basename "$skill")"
done
```

OpenCode advertises each skill by its description and loads the body only when a
task matches. The skill ID is the directory name, so
`.opencode/skills/test-driven-development/SKILL.md` is invoked as
`@test-driven-development`. This repository ships the directory symlink itself,
tracked in Git as mode `120000`.

### Claude Code

Claude Code reads one directory per skill and watches the directory for changes:

```bash
mkdir -p .claude/skills
for skill in "$AGENT_SKILLS"/skills/*/; do
  ln -sfn "$skill" ".claude/skills/$(basename "$skill")"
done
```

Invoke a skill explicitly with `/skill-name` or `@skill-name`. The repository's
own [`CLAUDE.md`](CLAUDE.md) is a pointer, not a second copy of the procedures.

### Codex

```bash
mkdir -p .codex/skills
for skill in "$AGENT_SKILLS"/skills/*/; do
  ln -sfn "$skill" ".codex/skills/$(basename "$skill")"
done
```

A Codex plugin manifest is provided at
[`.codex-plugin/plugin.json`](.codex-plugin/plugin.json) for hosts that install
from manifests.

### Cursor

Cursor does not load `SKILL.md`. It reads `AGENTS.md` and optional rules. Keep
the adapter short and let it point at the canonical catalog:

```bash
mkdir -p .cursor/rules
cat > .cursor/rules/agent-skills.mdc <<'RULE'
---
description: Route engineering tasks through the Agent Skills catalog
alwaysApply: true
---

Before any feature, bug fix, refactor, or review, read the matching skill under
/path/to/agent-skills/skills/ and follow its Verification section.
Start with using-agent-skills when the route is unclear.
RULE
```

Replace `/path/to/agent-skills` with the absolute path to your checkout.

### GitHub Copilot

Copilot reads `AGENTS.md` for the coding agent and instruction files for the
editor. A repository-wide instruction file is enough for most teams:

```bash
mkdir -p .github
cat > .github/copilot-instructions.md <<'INSTRUCTIONS'
# Engineering workflow

For any feature, bug fix, refactor, or test change, follow the matching skill in
/path/to/agent-skills/skills/. Start with using-agent-skills when the route is
unclear. Do not mark work complete with failing tests, lint errors, or missing
evidence.
INSTRUCTIONS
```

Replace `/path/to/agent-skills` with the absolute path to your checkout.

Copilot injects instruction files as text and does not expand file links. If the
surface cannot read repository files, copy the two or three skills you need into
the instruction file.

### Project Routing

Where the host reads repository instructions, add a short routing file. It names
the catalog, the precedence order, and the requirement to follow verification:

```markdown
# Engineering workflow

For any feature, bug fix, refactor, or review, load the matching skill from
`/path/to/agent-skills/skills/` and follow its Verification section.

Route by the question the task is asking, not by keyword:
- What are we building? -> spec-driven-development
- How do we break it down? -> planning-and-task-breakdown
- How do we prove it works? -> test-driven-development
- Is it correct and safe? -> code-review-and-quality
- How do we release it? -> shipping-and-launch

Precedence when instructions conflict:
1. System and developer instructions
2. The user's direct instruction for this task
3. The matched SKILL.md procedure
4. This routing file
5. Other project documentation

When the phase changes, announce the new route. Do not mark work complete with
failing tests, lint errors, or missing evidence.
```

This repository's [`AGENTS.md`](AGENTS.md) is the reference implementation. Do not
copy it into another project unchanged; write a project-local file that points at
the skills you installed.

### Updating an Installation

```bash
cd "$AGENT_SKILLS"
git pull
```

Symlinked installs pick up new content immediately. Copied installs do not,
which is one reason to prefer links. After a catalog change, rerun the gates and
update the project routing file if a phase or route changed.

## Verification and Quality Gates

Every gate is deterministic and runs without network access or external
services.

| Gate | Command | Proves | CI |
| --- | --- | --- | --- |
| Skill contract | `node scripts/validate-skills.js` | Frontmatter, required sections, naming, layout, line budget | Yes |
| Repository integrity | `node scripts/validate-repo.js` | Discovery symlink, manifest agreement, eval coverage, links, text hygiene | Yes |
| Linter tests | `node --test scripts/**/*.test.js` | The validator behaves as specified | Yes |
| Trigger evals | `node scripts/run-evals.js --min-rank1 85` | The right skill ranks for real prompts and negative prompts do not fire it | Yes |
| Behavioral evals | `node scripts/run-evals.js --behavioral` | An agent following the skill satisfies its expectations | On demand |

Run everything with one command:

```bash
npm run check
```

The npm scripts map directly to the gates:

| Script | Equivalent |
| --- | --- |
| `npm run validate` | `validate-skills.js` then `validate-repo.js` |
| `npm test` | `node --test scripts/**/*.test.js` |
| `npm run evals` | `node scripts/run-evals.js --min-rank1 85` |
| `npm run check` | All of the above |

The trigger tier exits non-zero when the rank-1 rate falls below the floor. To
inspect one skill's routing:

```bash
node scripts/run-evals.js --skill test-driven-development --verbose
```

## Evaluations

The repository tests its skills, not only its Markdown.

| Tier | What it checks | Cost |
| --- | --- | --- |
| Structural | Frontmatter, sections, naming, layout, manifests, links | Free |
| Trigger | The intended skill ranks top-k for natural prompts; negative prompts do not fire it | Free |
| Behavioral | An agent following the skill satisfies its expectations | Tokens |

Current corpus:

| Metric | Count |
| --- | --- |
| Skills with trigger cases | 11 |
| Positive trigger prompts | 33 |
| Negative trigger prompts | 22 |
| Behavioral cases | 10 |
| Core skills with behavioral coverage | 5 |

The trigger tier is a lexical approximation of routing. It catches the two
failure modes that dominate real trigger bugs: a description missing the words
users type, and an over-broad description that outranks the right skill. A
trigger failure usually means the description is wrong, not the eval.

Behavioral grading is manual in this release. Raw transcripts are written to
`evals/results/`, which is gitignored, and are graded against observed actions
rather than the agent's self-report. See [`evals/README.md`](evals/README.md)
for the schema and grading policy.

## Extending the Catalog

```bash
# 1. Create the canonical skill directory
mkdir -p skills/<skill-name>
$EDITOR skills/<skill-name>/SKILL.md

# 2. Add a trigger case with at least three positive and two negative prompts
$EDITOR evals/cases/<skill-name>.json

# 3. Run the gates
node scripts/validate-skills.js
node scripts/run-evals.js --skill <skill-name> --verbose
```

Then register the skill in [`AGENTS.md`](AGENTS.md), the catalog table above, and
the documentation that lists the lifecycle. Read
[`CONTRIBUTING.md`](CONTRIBUTING.md) and [`docs/skill-anatomy.md`](docs/skill-anatomy.md)
before opening a pull request. The acceptance bar is intentionally strict: a new
skill must remove a decision an agent would otherwise get wrong and must route
cleanly against the existing eleven.

## Enterprise Practices

### Versioning and Release Management

| Control | Mechanism |
| --- | --- |
| Semantic versioning | `MAJOR` for breaking changes, `MINOR` for new skills or behaviors, `PATCH` for fixes |
| Single version source | [`package.json`](package.json) is authoritative; every manifest must match |
| Manifest consistency | `validate-repo.js` fails when any manifest version diverges |
| Immutable releases | Annotated tags, for example `v1.0.0`, with published release notes |
| Deprecation policy | A retired skill is removed from the catalog, eval corpus, routing tables, and documentation in one change |

### Security and Supply Chain

| Control | Mechanism |
| --- | --- |
| No runtime dependencies | Scripts use Node.js built-ins only; there is no install step and no `postinstall` |
| No network at validation time | Every gate runs offline and deterministically |
| No telemetry | The repository collects and transmits nothing |
| No secrets | Static Markdown and dependency-free scripts; the contribution bar forbids credentials and personal data |
| Reviewable surface | Pure text files; no binary artifacts in the catalog |

### Change Management

| Practice | Implementation |
| --- | --- |
| Contract-first changes | Structure changes update [`docs/skill-anatomy.md`](docs/skill-anatomy.md) and the linter together |
| Behavior changes require evidence | A skill change includes the command output that proves the new behavior |
| Routing changes are tested | Description edits run the trigger tier before and after |
| No gate weakening | Tests are not skipped, deleted, or loosened to get green |
| Phase changes are explicit | The agent announces a re-route instead of silently switching disciplines |

### Portability and Governance

| Practice | Implementation |
| --- | --- |
| Host independence | Plain Markdown with YAML frontmatter, no host-specific syntax in `SKILL.md` |
| Relative links only | Clones work from any path, including CI checkouts |
| One source of truth | `skills/` is canonical; adapters are pointers |
| Auditable gates | CI runs the same commands a contributor runs locally |
| Proportional process | Small changes use the smallest applicable skill, not the full ceremony |

## Contributing

Contributions are welcome when they improve a gate, a procedure, or the evidence
a skill demands. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for the acceptance bar,
the eval requirements, and the review process.

Before opening a pull request:

```bash
npm run check
```

Include the output. A pull request that reports "should pass" will be asked to
run the commands.

## License

Released under the [MIT License](LICENSE).

Copyright (c) 2026 rafidone.
