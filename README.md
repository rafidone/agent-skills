# Agent Skills

Engineering workflow skills for AI coding agents, covering the full path from
specification to release.

Agent Skills is a catalog of eleven composable disciplines. Each one encodes a
single phase of engineering work, the procedure an agent should follow, the
excuses it should reject, and the checks that prove the work is done. The skills
are plain Markdown, portable across OpenCode, Claude Code, Cursor, GitHub
Copilot, and Codex, and they are validated, linted, and evaluated in CI.

The goal is not to give an agent more instructions. It is to give it a smaller
number of specific instructions with gates that block premature completion.

## Contents

- [Why this exists](#why-this-exists)
- [Lifecycle](#lifecycle)
- [Skill catalog](#skill-catalog)
- [How routing works](#how-routing-works)
- [Installation](#installation)
- [Verify the installation](#verify-the-installation)
- [Repository layout](#repository-layout)
- [Evals](#evals)
- [Contributing](#contributing)
- [License](#license)

---

## Why this exists

An agent without a workflow optimizes for plausible output. It writes code that
compiles, skips the failing test, and reports success. The failure is not
laziness; it is the absence of a contract that says what success means.

Each skill in this repository is a small contract:

- It names the situations where the discipline applies, and the ones where it
  does not.
- It gives an ordered procedure with an explicit exit condition.
- It lists the rationalizations that lead to cutting corners, with the required
  response to each.
- It ends with a verification checklist that can be run rather than argued
  about.

The catalog is deliberately small. Eleven skills that route cleanly beat fifty
that overlap.

## Lifecycle

```text
  using-agent-skills
        |
        |  classifies the task, loads one primary skill
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

The phases are not a waterfall. Work moves back and forth: a failing test sends
build back to debugging, a review blocker sends verify back to build, and a spec
gap sends any phase back to define. What must not happen is a silent phase
change. Each move is announced and the matching skill is loaded.

## Skill catalog

| Phase | Skill | Use when the task is asking |
| --- | --- | --- |
| Meta | [`using-agent-skills`](skills/using-agent-skills/SKILL.md) | "Which skill applies?" or the request spans several phases |
| Define | [`spec-driven-development`](skills/spec-driven-development/SKILL.md) | "What are we building, and how will we know it works?" |
| Define | [`constraint-driven-development`](skills/constraint-driven-development/SKILL.md) | "What standard must this meet, and who enforces it?" |
| Plan | [`planning-and-task-breakdown`](skills/planning-and-task-breakdown/SKILL.md) | "How do we break this down, and in what order?" |
| Build | [`incremental-implementation`](skills/incremental-implementation/SKILL.md) | "How do we land this safely in small pieces?" |
| Build | [`test-driven-development`](skills/test-driven-development/SKILL.md) | "How do we prove this behavior exists?" |
| Build | [`debugging-and-error-recovery`](skills/debugging-and-error-recovery/SKILL.md) | "Why is this failing, and what is the root cause?" |
| Build | [`code-simplification`](skills/code-simplification/SKILL.md) | "This works, but it is too complicated." |
| Verify | [`code-review-and-quality`](skills/code-review-and-quality/SKILL.md) | "Is this change correct, safe, and proven?" |
| Ship | [`git-workflow-and-versioning`](skills/git-workflow-and-versioning/SKILL.md) | "How do we record this change in history?" |
| Ship | [`shipping-and-launch`](skills/shipping-and-launch/SKILL.md) | "How do we release this without breaking production?" |

### What each phase produces

| Phase | Artifact | Proof of completion |
| --- | --- | --- |
| Define | A one-page spec with acceptance criteria, non-goals, and failure modes | A reviewer can answer what, for whom, and how we will know it works |
| Define | A `CONSTRAINTS.md` with measurable thresholds and enforcement points | Every non-negotiable has an automated gate or a named owner |
| Plan | An ordered task list of vertical slices | Every acceptance criterion maps to a task with a named test |
| Build | A thin slice, wired end to end | The slice's tests and the adjacent suite are green |
| Build | A regression test and a minimal fix | The test failed before the fix and passes after it |
| Build | A diagnosis with a reproduction | The cause is explained and the fix is observed in the failing environment |
| Build | A smaller diff with unchanged behavior | The suite is green before and after, and the diff is smaller |
| Verify | A review with severity labels and a decision | Every blocker is resolved and re-verified |
| Ship | Commits, a changelog, and an annotated tag | Each commit is independently understandable and green |
| Ship | A rollout plan with abort thresholds | The release was watched for its full window and remains reversible |

## How routing works

Hosts that implement the Agent Skills specification advertise each skill by its
`description` and load the body only when a task matches. That makes the
description the routing signal, and it makes a weak description the most common
reason a good skill never fires.

This repository guards routing in three ways:

1. **Descriptions are tuned and tested.** Every skill has positive and negative
   trigger cases. A description that fails to rank is fixed, not excused.
2. **`AGENTS.md` is always-on context.** It names the catalog and the precedence
   rules, so an agent working in this repository routes deterministically even
   when model selection would skip the skill.
3. **The meta-skill re-routes.** `using-agent-skills` classifies the task by the
   question it is really asking, loads exactly one primary skill, and announces
   any phase change.

Install [`AGENTS.md`](AGENTS.md) alongside the skills in projects that support
repository-level agent instructions. It is a pointer, not a second copy of the
procedures.

## Installation

The skills are plain directories. Install them by cloning this repository and
linking the ones you want into your host's discovery path.

| Host | Discovery path | Install | Native `SKILL.md` |
| --- | --- | --- | --- |
| OpenCode | `.opencode/skills/` or `~/.config/opencode/skills/` | Symlink `skills/` as `.opencode/skills` | Yes |
| Claude Code | `.claude/skills/` or `~/.claude/skills/` | Link each skill directory | Yes |
| Codex | `.codex/skills/` or `~/.codex/skills/` | Link each skill directory | Yes |
| Cursor | `AGENTS.md` and `.cursor/rules/` | Add a thin rule that points into `skills/` | No |
| GitHub Copilot | `AGENTS.md` and `.github/instructions/` | Add a thin instruction file | No |

The full per-host procedure, including global installs and Windows notes, lives
in [`docs/installation.md`](docs/installation.md). For a first run with no prior
context, start with [`docs/getting-started.md`](docs/getting-started.md).

Quick start for OpenCode:

```bash
git clone https://github.com/rafidone/agent-skills.git
cd agent-skills
mkdir -p .opencode
ln -sfn ../skills .opencode/skills
test -f .opencode/skills/test-driven-development/SKILL.md && echo "OpenCode ready"
```

Quick start for Claude Code:

```bash
mkdir -p .claude/skills
for skill in skills/*/; do
  ln -sfn "../../$skill" ".claude/skills/$(basename "$skill")"
done
test -f .claude/skills/test-driven-development/SKILL.md && echo "Claude Code ready"
```

## Verify the installation

The repository ships its own checks. They have no runtime dependencies beyond
Node.js 20 or newer.

```bash
node scripts/validate-skills.js          # skill contract: frontmatter, sections, layout
node scripts/validate-repo.js            # symlink, manifests, eval coverage, links, hygiene
node --test scripts/**/*.test.js                     # linter unit tests
node scripts/run-evals.js --min-rank1 85 # routing eval, fails below 85 percent rank-1
```

A correct checkout prints `11 skills, 0 errors, 0 warnings`, then a set of
repository checks, then a passing test suite, then a trigger tier summary with
`0 failures`.

To confirm a single host sees the catalog:

```bash
readlink -f .opencode/skills
ls .opencode/skills/*/SKILL.md
```

## Repository layout

```text
.
├── AGENTS.md                 # Routing contract for agents working here
├── CLAUDE.md                 # Thin pointer for Claude Code
├── CONTRIBUTING.md           # How to add or change a skill
├── README.md                 # This file
├── LICENSE                   # MIT
├── plugin.json               # Generic plugin manifest
├── package.json              # Validation scripts, version source of truth
├── docs/
│   ├── skill-anatomy.md      # The skill contract enforced by the validator
│   ├── getting-started.md    # First run per host
│   ├── installation.md       # Full per-host install and removal
│   └── comparison.md         # How this pack differs from other approaches
├── skills/                   # Canonical skill source, one directory per skill
├── references/               # Shared checklists linked by skills
├── agents/                   # Review and test personas
├── .claude/commands/         # Six slash commands for Claude Code
├── .claude-plugin/           # Claude Code plugin and marketplace manifests
├── .codex-plugin/            # Codex plugin manifest
├── .agents/plugins/          # Generic agent marketplace manifest
├── .opencode/skills          # Relative symlink to ../skills
├── evals/
│   ├── cases/                # Trigger and behavioral cases, one file per skill
│   ├── fixtures/             # Inputs for behavioral cases
│   └── README.md             # Eval tiers and grading policy
├── scripts/
│   ├── lib/skill-lint.js     # Linter implementation and unit tests
│   ├── validate-skills.js    # Skill contract CLI
│   ├── validate-repo.js      # Repository integrity CLI
│   └── run-evals.js          # Trigger and behavioral runner
└── .github/workflows/        # CI running every gate
```

## Evals

The repository tests its skills, not only its Markdown.

| Tier | What it checks | Runs in CI |
| --- | --- | --- |
| Structural | Frontmatter, required sections, naming, layout, line budget, manifests, links | Yes |
| Trigger | The intended skill ranks top-k for natural prompts, and negative prompts do not fire it | Yes |
| Behavioral | An agent following the skill satisfies its expectations | On demand |

The trigger tier is deterministic and costs nothing. It catches the two routing
failures that matter most: a description missing the words users actually type,
and an over-broad description that outranks the right skill. The behavioral tier
runs through a headless agent and is graded against observed actions, not the
agent's self-report.

See [`evals/README.md`](evals/README.md) for the case schema and grading policy.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and
[`docs/skill-anatomy.md`](docs/skill-anatomy.md) before adding a skill. In short:

1. Open an issue describing the discipline and why the existing catalog does not
   cover it.
2. Write the skill against the anatomy contract.
3. Add a trigger eval case with at least three positive and two negative prompts.
4. Add a behavioral case if the skill is in the core set.
5. Register it in `AGENTS.md`, this README, and the manifest docs.
6. Run every gate and include the output in the pull request.

The repository accepts a smaller catalog over a larger one. A new skill must
remove a decision an agent would otherwise get wrong, not restate advice the
model already knows.

## License

Released under the [MIT License](LICENSE).
