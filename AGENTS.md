# Agent Instructions

This repository is a catalog of engineering skills for AI coding agents. This
file is the routing layer: it tells an agent which skill to load and when.

> **Scope:** this file configures agents working on this repository itself. The
> reusable assets are the directories under `skills/`. Do not copy this file
> into another project; write a project-local routing file that points at the
> skills you installed.

## Repository overview

Each skill encodes one phase of engineering work and its own quality gates. The
skills are plain Markdown, portable across OpenCode, Claude Code, Cursor,
GitHub Copilot, and Codex. `.opencode/skills` is a relative symlink to
`../skills`, so OpenCode discovers the whole catalog without per-skill links.

## Skill catalog

Route by the question the task is really asking. When several skills apply,
compose them in lifecycle order.

| Phase | Skill | Route when the task is asking |
| --- | --- | --- |
| Meta | `using-agent-skills` | "Which skill applies?" or a request spans several phases |
| Define | `spec-driven-development` | "What are we building, and how will we know it works?" |
| Define | `constraint-driven-development` | "What standard must this meet, and who enforces it?" |
| Plan | `planning-and-task-breakdown` | "How do we break this down and in what order?" |
| Build | `incremental-implementation` | "How do we land this safely in small pieces?" |
| Build | `test-driven-development` | "How do we prove this behavior exists?" |
| Build | `debugging-and-error-recovery` | "Why is this failing, and what is the root cause?" |
| Build | `code-simplification` | "This works, but it is too complicated." |
| Verify | `code-review-and-quality` | "Is this change correct, safe, and proven?" |
| Ship | `git-workflow-and-versioning` | "How do we record this change in history?" |
| Ship | `shipping-and-launch` | "How do we release this without breaking production?" |

## Routing rules

1. **Load before acting.** Read the whole `SKILL.md` before the first edit.
   Loading the description is not loading the skill.
2. **Route by intent, not keyword.** A request that says "fix" may be a spec
   problem. Use the question in the catalog, not word matching.
3. **Load one primary skill.** Add the next skill when the work reaches the next
   phase. Do not load the entire catalog at once.
4. **Announce the route once.** State that the skill is active, then follow it.
   Do not narrate the procedure.
5. **Follow the verification section.** It is the contract, not a suggestion.
   Do not declare completion with a failed gate.
6. **Compose in lifecycle order.** Spec, constraints, plan, incremental build,
   TDD inside each slice, review, git, ship.
7. **Re-route on a phase change.** Implementation becomes debugging when a test
   fails unexpectedly. State the new route.
8. **If no skill applies, say so.** Questions, documentation edits, and
   discussions may need no skill. Do not force one.
9. **Keep this registry current.** When a skill is added, renamed, or removed,
   update this table, `README.md`, and `docs/skill-anatomy.md` in the same
   change.

## Precedence

When instructions conflict, resolve in this order:

1. System and developer instructions.
2. A direct, scoped user instruction for the current task.
3. The matched `SKILL.md` procedure.
4. This routing file and the repository conventions.
5. `README.md` and other project documentation.

Safety and verification requirements are never silently overridden. If a
conflict affects correctness, security, or data integrity, stop and state it.

## Tasks that do not require a skill

- Explaining the repository layout or how a tool works.
- Editing documentation with no executable behavior change, beyond a link check.
- Installing or configuring a tool.
- Brainstorming or design discussion with no code change.

When a discussion becomes an implementation task, load the skill at the point
the first code change begins.

## Repository layout

```text
.
├── AGENTS.md                 # This file: routing contract
├── CLAUDE.md                 # Thin pointer for Claude Code
├── CONTRIBUTING.md           # Skill acceptance rules
├── README.md                 # Human-facing overview and installation
├── docs/
│   ├── skill-anatomy.md      # The skill contract
│   ├── getting-started.md    # First run per host
│   ├── installation.md       # Per-host install commands
│   └── comparison.md         # How this differs from other packs
├── skills/                   # Canonical skill source
├── references/               # Shared checklists linked by skills
├── agents/                   # Review and test personas
├── .claude/commands/         # Claude Code slash commands
├── evals/                    # Trigger and behavioral cases
└── scripts/                  # Validators and runners
```

## Source of truth

- `skills/<name>/SKILL.md` is canonical. Edit there, never in an adapter.
- Reference shared material in `references/`; do not copy it into a skill.
- Keep `SKILL.md` under 500 lines. Move detail into supporting files.
- Do not leave `TODO`, placeholders, or ellipses in a finished skill.

## Validation

Run all three before committing:

```bash
node scripts/validate-skills.js
node scripts/validate-repo.js
node --test scripts/**/*.test.js
node scripts/run-evals.js --min-rank1 85
```

A change is not complete while any of these fails. Do not weaken a check to get
green; fix the skill or the content.

## Contribution rules

Read `CONTRIBUTING.md` and `docs/skill-anatomy.md` before adding a skill. Every
new skill needs a passing validator run, a trigger eval case, and a routing
entry in this file and in `README.md`.
