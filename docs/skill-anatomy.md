# Skill Anatomy

This document is the contract for every skill in this repository. The validator
in `scripts/validate-skills.js` enforces it. A skill that does not satisfy this
document is not finished, regardless of how good the prose is.

## Location

Every skill is a directory under `skills/`:

```text
skills/
└── skill-name/
    ├── SKILL.md            # Required: the skill itself
    ├── references/         # Optional: material loaded on demand
    └── scripts/            # Optional: runnable helpers
```

`SKILL.md` is the only required file. Add supporting files only when they earn
their place. An empty `references/` or `scripts/` directory is an error, because
it promises content that does not exist.

The directory name is the skill ID. It must be lowercase kebab-case and must
match the `name` field in frontmatter exactly.

## Frontmatter

```yaml
---
name: test-driven-development
description: Drives development through a red-green-refactor loop. Use when implementing logic, fixing a bug, or changing behavior, including when the request omits tests.
license: MIT
compatibility: opencode, claude-code, cursor, copilot, codex
metadata:
  version: 1.0.0
  phase: build
---
```

Allowed top-level keys, and nothing else:

| Key | Required | Rules |
| --- | --- | --- |
| `name` | Yes | Lowercase kebab-case, identical to the directory name, 64 characters or fewer |
| `description` | Yes | Third person, states what the skill does and when to use it, 1024 characters or fewer |
| `license` | No | SPDX identifier; use `MIT` in this repository |
| `compatibility` | No | Comma-separated host names |
| `metadata` | No | Free-form map for fields such as `version`, `phase`, and `tags` |
| `allowed-tools` | No | Only when the skill genuinely requires a restricted tool set |

Unknown top-level keys are an error. Host-specific settings belong under
`metadata` or in an adapter, never at the top level. Strict clients reject
skills that carry keys outside the Agent Skills specification.

### Writing the description

The description is the routing signal. Hosts advertise it and decide whether to
load the skill body. A weak description is the most common reason a good skill
never fires.

- State the capability in the third person: "Writes a reviewable specification",
  not "I will write a specification".
- Include at least one positive trigger beginning with "Use when".
- Name the situations a user would actually type, not internal abstractions.
- Do not describe exclusions as triggers. "Do not use when debugging" is not a
  trigger and is rejected by the validator.
- Keep it under 1024 characters. Shorter descriptions route better than padded
  ones.

## Required sections

Every skill contains these headings, in this order. The validator ignores
headings inside fenced code blocks.

| Section | Purpose |
| --- | --- |
| `## Overview` | What the discipline is and why it exists, in two or three paragraphs |
| `## When to Use` | Concrete triggers, plus explicit non-triggers and related skills |
| `## Core Process` | The ordered procedure the agent follows, with exit conditions |
| `## Common Rationalizations` | A table of excuses and the required rebuttal |
| `## Red Flags` | Observable signals that the skill is being violated |
| `## Verification` | The checklist that proves the work is done |

`## Common Rationalizations` is the section that separates a real skill from a
checklist. Every entry must name a specific excuse and a specific action. Generic
advice such as "do not cut corners" belongs nowhere.

`## Verification` must be checkable without judgement. "Code is clean" is not a
check. "The full test suite passes and the output is recorded" is.

The meta-skill `using-agent-skills` is exempt from the section checks because it
routes rather than executes. Exemptions live in the validator, not in
frontmatter, so a skill cannot exempt itself.

## Length and context budget

`SKILL.md` loads in full when a skill is activated, so every line costs context
on every use.

- Target 150 to 300 lines.
- Hard warning above 500 lines.
- Move long checklists and examples into `references/` and link them.
- Do not pad. A 200-line skill with no filler beats a 400-line skill with
  restated ideas.

## Supporting files

- Name Markdown files in kebab-case: `definition-of-done.md`.
- Keep supporting files specific to the skill that owns them.
- Shared checklists belong in the repository-level `references/` directory and
  are linked, not copied.
- Every supporting file must be referenced from `SKILL.md`. Orphaned files are
  dead weight.

## Cross-skill references

Skills may reference each other, but only through the shared vocabulary the
validator understands:

```markdown
Use the `test-driven-development` skill before changing behavior.
See `references/definition-of-done.md` for the completion checklist.
```

The validator warns when a backticked reference names a skill that does not
exist. It intentionally ignores generic backticked strings in code blocks.

## Writing style

- No emojis.
- ASCII only in diagrams.
- Imperative voice in procedures, third person in descriptions.
- Short paragraphs. Tables for comparisons and rationalizations.
- State the failure mode, not just the rule. An agent follows a rule it
  understands and rationalizes one it does not.

## Definition of a finished skill

A skill is finished when all of the following are true:

1. The frontmatter passes the validator.
2. All required sections are present and substantive.
3. Every claim has a matching verification step.
4. The skill stays inside the context budget or justifies an exception.
5. An eval case exists with at least three positive triggers, two negative
   triggers, and one behavioral case for skills in the core set.
6. The routing table in `AGENTS.md` and the catalog in `README.md` list it.
