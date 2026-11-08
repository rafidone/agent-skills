# Agent Instructions

This repository is a portable **AI Agent Skills** library. This file is the
routing layer: it tells an agent which skill to load and when. The detailed
procedure lives in `SKILL.md`; do not duplicate it here.

## Context routing

OpenCode automatically discovers project skills at
`.opencode/skills/<skill-id>/SKILL.md` and advertises them by their
`description`. This repository contains one skill:

| Skill ID | Canonical source | OpenCode discovery path |
| --- | --- | --- |
| `my-first-skill` | `skills/my-first-skill/SKILL.md` | `.opencode/skills/my-first-skill/SKILL.md` |

**For every development task, load and follow
`.opencode/skills/my-first-skill/SKILL.md` before writing or modifying code.**
Treat its Core Operating Rules and Verification Gates as blocking requirements,
not suggestions.

### Tasks that require the skill

Load `my-first-skill` when the user asks to:

- Implement a feature, user story, or behavior change.
- Fix a bug, regression, or failing test.
- Refactor code or improve structure without changing behavior.
- Add, modify, debug, or review tests.
- Review a diff or prepare a change for commit.
- Change production source, schemas, migrations, or infrastructure.

### Tasks that do not require the skill

Do not load it for:

- Explaining the repository layout or how a tool works.
- Editing documentation only, unless the task also changes code.
- Installing or configuring a tool.
- Brainstorming, design discussion, or answering a question with no code change.

When a task starts as discussion and becomes an implementation task, load the
skill at the point the first code change begins.

### Routing rules

1. **Load before acting.** Read the skill before the first production-code edit.
2. **Use the exact ID.** The ID is `my-first-skill`, derived from the directory
   name. The frontmatter `name` is a display label.
3. **Announce the route.** State once that `my-first-skill` is active, then
   proceed. Do not narrate the entire skill.
4. **Follow the gates.** Do not skip the red-test step, weaken tests, or declare
   completion with failing tests, lint errors, type errors, or a broken build.
5. **Do not paraphrase the skill away.** The skill defines the workflow; this
   file only routes to it.
6. **If the skill is unavailable**, report the exact missing path and apply the
   Core Operating Rules and Verification Gates from this file. Do not silently
   proceed unverified.
7. **If multiple skills match**, load the most specific one. If several are
   compatible, apply all of them. If they conflict, surface the conflict instead
   of silently choosing.
8. **If the user asks to bypass a quality gate**, explain the concrete risk. Do
   not claim the work is complete. Record any accepted exception explicitly.
9. **Keep this registry current.** When a skill is added, renamed, or removed,
   update this table in the same change.

### Precedence

When instructions conflict, resolve in this order:

1. System and developer instructions.
2. A direct, scoped user instruction for the current task.
3. The matched `SKILL.md` procedure.
4. This `AGENTS.md` routing and repository conventions.
5. `README.md` and other project documentation.

Safety and verification requirements are never silently overridden. If a
conflict affects correctness, security, or data integrity, stop and state it.

### Verifying routing

To confirm OpenCode is routing correctly:

- Reference the skill explicitly with `@my-first-skill`.
- Start a development task and confirm the agent states that
  `my-first-skill` is active before editing code.
- Check that the agent produces a spec and a failing test before implementation.

---

## Repository layout

```text
.
├── AGENTS.md                     # This file: routing and agent rules
├── README.md                     # Human-facing overview and installation
├── skills/                       # Canonical skill source (edit here)
│   └── my-first-skill/
│       └── SKILL.md
└── .opencode/
    └── skills/                   # OpenCode project discovery
        └── my-first-skill -> ../../skills/my-first-skill
```

## Source of truth

- `skills/<skill-name>/` is canonical. Make all content changes there.
- `.opencode/skills/<skill-name>` is a **relative symlink** to the canonical
  directory. Do not replace it with an independent copy.
- The symlink and its target are the same files. Edit the canonical path.
- If you install the skill for Claude Code, use the same pattern:
  `.claude/skills/<skill-name> -> ../../skills/<skill-name>`.

## Skill format

Every skill directory contains exactly one `SKILL.md` with YAML frontmatter:

```yaml
---
name: my-first-skill
description: What the skill does and when an agent should use it.
trigger:
  - A task that should activate the skill
compatibility: opencode, claude-code, chatgpt, generic-llm
metadata:
  version: 1.0.0
  tags:
    - example
---
```

Rules:

1. The directory name is the skill ID. Keep it lowercase `kebab-case` and
   aligned with the frontmatter `name`.
2. The `description` is the primary routing signal in OpenCode and Claude Code.
   State both the capability and the trigger conditions.
3. The `trigger` list is portable metadata and human documentation. Keep it
   aligned with the description; do not rely on it alone for routing.
4. Use valid YAML with no tabs.
5. Keep `SKILL.md` self-contained. Assume the reader cannot see the rest of the
   repository.
6. Never leave `TODO`, ellipses, or placeholder text in a finished skill.

## Adding or removing a skill

Add:

```bash
mkdir -p skills/<skill-name>
$EDITOR skills/<skill-name>/SKILL.md
ln -sfn ../../skills/<skill-name> .opencode/skills/<skill-name>
```

Optionally add the Claude Code discovery link:

```bash
mkdir -p .claude/skills
ln -sfn ../../skills/<skill-name> .claude/skills/<skill-name>
```

Remove:

```bash
rm .opencode/skills/<skill-name>
rm -r skills/<skill-name>
```

Also remove any `.claude/skills` link, Cursor rule, or Copilot instruction file
that points to the removed skill, and update the routing table in this file.

## Validation

After any change, run:

```bash
# The OpenCode link resolves to the canonical directory
readlink -f .opencode/skills/my-first-skill

# The skill is reachable through the discovery path
test -f .opencode/skills/my-first-skill/SKILL.md && echo "link OK"

# Frontmatter parses and the directory name matches the frontmatter name
python3 - <<'PY'
import pathlib, yaml
for path in pathlib.Path("skills").glob("*/SKILL.md"):
    text = path.read_text()
    assert text.startswith("---\n"), f"missing frontmatter: {path}"
    meta = yaml.safe_load(text.split("---\n", 2)[1])
    assert meta["name"] == path.parent.name, f"name mismatch: {path}"
    assert meta.get("description"), f"missing description: {path}"
    print(f"OK {path} -> {meta['name']}")
PY
```

A change is not complete until the links resolve, the frontmatter parses, and
the description is present.

## Agent completion checklist

Before responding to a development request, confirm:

- [ ] `my-first-skill` was loaded and announced.
- [ ] A spec exists with testable acceptance criteria.
- [ ] A failing test was observed before implementation.
- [ ] The implementation passes the new test and the relevant existing tests.
- [ ] Refactoring preserved observable behavior.
- [ ] Lint, format, type check, and build pass with zero errors and no new
      warnings.
- [ ] No tests were skipped, deleted, or weakened to get green.
- [ ] The final report states what was run, what passed, and what was not run.

## Editing conventions

- Keep skills focused on one job.
- Keep adapters thin. `README.md`, Cursor rules, and Copilot instruction files
  should point to the canonical skill rather than fork its content.
- Prefer additive, reversible changes. Do not delete or rename an existing skill
  without explicit user approval.
- Do not commit secrets, credentials, private keys, or unnecessary personal data.
- When the layout changes, update this file, `README.md`, and any affected
  adapters in the same change.
