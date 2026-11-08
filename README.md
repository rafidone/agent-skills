# Universal AI Agent Skills

> One engineering workflow, portable across OpenCode, Cursor, Claude Code, and GitHub Copilot.

**Universal AI Agent Skills** is a small, portable skills repository. It keeps
each skill as plain Markdown under `skills/`, exposes it to OpenCode through a
relative symlink, and provides thin adapters for tools that do not natively load
`SKILL.md`.

The first skill, [`my-first-skill`](skills/my-first-skill/SKILL.md), turns a
coding agent into a disciplined engineer: specification before code,
test-driven development, zero lint errors, and evidence before completion.

## Contents

- [What is in this repository](#what-is-in-this-repository)
- [How it works across AI tools](#how-it-works-across-ai-tools)
  - [OpenCode](#opencode)
  - [Claude Code](#claude-code)
  - [Cursor](#cursor)
  - [GitHub Copilot](#github-copilot)
- [Installation](#installation)
- [Adding another skill](#adding-another-skill)
- [Repository conventions](#repository-conventions)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## What is in this repository

```text
.
├── AGENTS.md                     # Always-on routing and repository rules for agents
├── README.md                     # This file
├── skills/                       # Canonical skill source
│   └── my-first-skill/
│       └── SKILL.md              # The engineering workflow
└── .opencode/
    └── skills/
        └── my-first-skill -> ../../skills/my-first-skill
```

| Path | Role |
| --- | --- |
| `skills/` | The only place skill content is authored. This is the source of truth. |
| `.opencode/skills/` | OpenCode's project discovery path. Contains relative symlinks, not copies. |
| `AGENTS.md` | Tells agents which skill to load, when to load it, and how to validate changes. |
| `README.md` | Human-facing overview, compatibility model, and installation instructions. |

### The `my-first-skill` workflow

The skill is language-agnostic and applies to features, bug fixes, refactors,
test changes, and code review. It enforces five phases:

| Phase | Required output |
| --- | --- |
| **Spec** | Problem, scope, acceptance criteria, interfaces, failure modes, and a test plan |
| **Red test** | A failing test that fails for the intended reason |
| **Implementation** | The minimum production code required to pass the test |
| **Refactor** | Cleaner code with the test suite still green |
| **Verification** | Tests, lint, format, type check, and build evidence |

It also includes a **Verification Gates** checklist and an
**Anti-Rationalization Table** that blocks common excuses for skipping unit
tests, weakening assertions, or ignoring errors.

---

## How it works across AI tools

The core idea is **author once, adapt at the edges**. Every tool gets a thin
pointer to the canonical skill; no tool gets a forked copy.

| Tool | Native `SKILL.md` support | Discovery mechanism | Adapter in this repository |
| --- | --- | --- | --- |
| **OpenCode** | Yes | `.opencode/skills/<skill-id>/SKILL.md` and global skills directories | Native: `.opencode/skills/my-first-skill` symlink |
| **Claude Code** | Yes | `.claude/skills/<name>/SKILL.md` and personal skills directories | Install a symlink or copy into `.claude/skills` |
| **Cursor** | No native skill loader | Project `AGENTS.md` and `.cursor/rules/*.mdc` | `AGENTS.md` routing; optional thin rule file |
| **GitHub Copilot** | No native skill loader | `AGENTS.md` for the coding agent; `.github/copilot-instructions.md` and `.github/instructions/*.instructions.md` for the editor | `AGENTS.md` routing; optional instruction file |

### OpenCode

OpenCode natively discovers Agent Skills. It searches:

- **Project:** `.opencode/skills`, plus compatibility paths `.claude/skills` and `.agents/skills`
- **Global:** `~/.config/opencode/skills`, plus `~/.claude/skills` and `~/.agents/skills`

This repository already links the skill into the project path:

```text
.opencode/skills/my-first-skill -> ../../skills/my-first-skill
```

OpenCode advertises the skill using its `description` and loads the body only
when needed. The skill ID is derived from the path, so
`.opencode/skills/my-first-skill/SKILL.md` has the ID `my-first-skill`. You can
invoke it explicitly with `@my-first-skill` or let the agent select it from the
description.

`AGENTS.md` is always-on project context. It instructs the agent to load this
skill for development tasks, which makes routing deterministic even when the
model would otherwise skip the skill.

### Claude Code

Claude Code implements the Agent Skills open standard and loads skills from:

- **Project:** `.claude/skills/<name>/SKILL.md`
- **Personal:** `~/.claude/skills/<name>/SKILL.md`

Claude Code supports symlinked skill folders and watches skill directories for
changes. It auto-loads a skill when the task matches its `description`, or you
can invoke it directly with `/my-first-skill`.

Because OpenCode also reads `.claude/skills` as a compatibility path, installing
the skill there makes it available to both tools.

### Cursor

Cursor does not load `SKILL.md` as a native skill. It reads project rules from
`AGENTS.md` and `.cursor/rules/*.mdc` (the legacy `.cursorrules` format is
deprecated). This repository's `AGENTS.md` already routes development tasks to
the skill, and Cursor's agent mode can read the referenced file.

For deterministic loading, add a thin project rule:

```bash
mkdir -p .cursor/rules
cat > .cursor/rules/my-first-skill.mdc <<'RULE'
---
description: Universal engineering workflow: spec-first, TDD, zero lint errors
alwaysApply: true
---

For every feature, bug fix, refactor, or test change, read and follow
`skills/my-first-skill/SKILL.md`. Treat its Core Operating Rules and
Verification Gates as blocking requirements.
RULE
```

Use `globs` instead of `alwaysApply` if you want the rule attached only to
matching files. You can also mention `@skills/my-first-skill/SKILL.md` directly
in Cursor Chat.

### GitHub Copilot

Copilot does not load `SKILL.md` natively. Its supported mechanisms are:

- **AGENTS.md** for the Copilot coding agent.
- **`.github/copilot-instructions.md`** for repository-wide editor instructions.
- **`.github/instructions/*.instructions.md`** for path-scoped instructions using
  `applyTo` frontmatter.

This repository's `AGENTS.md` already routes the coding agent to the skill. For
editor chat and inline suggestions, add a thin instruction file:

```bash
mkdir -p .github/instructions
cat > .github/instructions/my-first-skill.instructions.md <<'INSTRUCTIONS'
---
applyTo: "**"
---

For any feature, bug fix, refactor, or test change, follow the workflow in
`skills/my-first-skill/SKILL.md`: spec before code, a failing test first,
minimal implementation, refactor, and zero lint errors. Never mark work complete
with failing tests or lint errors.
INSTRUCTIONS
```

Copilot injects instruction files as text and does not expand file links. If
your Copilot surface cannot read repository files, mirror the skill's Core
Operating Rules and Verification Gates into
`.github/copilot-instructions.md` instead of relying on the path reference.

---

## Installation

### Prerequisites

- Git.
- One supported AI tool: OpenCode, Claude Code, Cursor, or GitHub Copilot.
- Optional: Python 3 with PyYAML to run the frontmatter validation below.

### 1. Get the repository

```bash
git clone <repository-url> ai-agent-skills
cd ai-agent-skills
```

If you already have the directory, `cd` into it instead.

### 2. OpenCode

Project-scoped discovery is already configured through the checked-in symlink:

```bash
test -f .opencode/skills/my-first-skill/SKILL.md && echo "OpenCode skill ready"
```

To make the skill available in every project, install it globally:

```bash
mkdir -p ~/.config/opencode/skills
ln -sfn "$PWD/skills/my-first-skill" ~/.config/opencode/skills/my-first-skill
```

No `opencode.json` change is required for the standard paths. If you prefer an
explicit source, add it to `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "skills": ["./skills"]
}
```

### 3. Claude Code

Project-scoped install:

```bash
mkdir -p .claude/skills
ln -sfn ../../skills/my-first-skill .claude/skills/my-first-skill
```

Personal install, available in all projects:

```bash
mkdir -p ~/.claude/skills
ln -sfn "$PWD/skills/my-first-skill" ~/.claude/skills/my-first-skill
```

Claude Code will auto-load the skill from its description, or you can run
`/my-first-skill` explicitly.

### 4. Cursor

Cursor reads the checked-in `AGENTS.md` automatically. For a deterministic
always-on rule, run the rule creation command in the
[Cursor section](#cursor) above. The rule is a pointer; the canonical skill
remains `skills/my-first-skill/SKILL.md`.

### 5. GitHub Copilot

The Copilot coding agent reads the checked-in `AGENTS.md`. For editor
instructions, run the instruction-file command in the
[GitHub Copilot section](#github-copilot) above. Keep the adapter short and
leave the detailed procedure in the canonical skill.

### 6. Verify the installation

Run the checks for the tools you installed:

```bash
# OpenCode project link
readlink -f .opencode/skills/my-first-skill
test -f .opencode/skills/my-first-skill/SKILL.md && echo "OpenCode OK"

# Claude Code project link (if installed)
test -f .claude/skills/my-first-skill/SKILL.md && echo "Claude Code OK"

# Frontmatter and directory/name consistency
python3 - <<'PY'
import pathlib, yaml
for path in pathlib.Path("skills").glob("*/SKILL.md"):
    text = path.read_text()
    assert text.startswith("---\n"), f"missing frontmatter: {path}"
    meta = yaml.safe_load(text.split("---\n", 2)[1])
    assert meta["name"] == path.parent.name, f"name mismatch: {path}"
    print(f"OK {path} -> {meta['name']}")
PY
```

A successful run prints the resolved canonical path and one `OK` line per
skill.

---

## Adding another skill

```bash
# 1. Create the canonical skill
mkdir -p skills/<skill-name>
$EDITOR skills/<skill-name>/SKILL.md

# 2. Link it into OpenCode project discovery
ln -sfn ../../skills/<skill-name> .opencode/skills/<skill-name>

# 3. Optional: link it into Claude Code project discovery
mkdir -p .claude/skills
ln -sfn ../../skills/<skill-name> .claude/skills/<skill-name>
```

Then register the skill in [`AGENTS.md`](AGENTS.md) and add it to the tables in
this README. If you use Cursor or Copilot, add a thin adapter that points to the
new skill.

### Skill anatomy

```markdown
---
name: your-skill
description: What the skill does and when an agent should use it.
compatibility: opencode, claude-code, chatgpt, generic-llm
metadata:
  version: 0.1.0
  tags:
    - example
---

# Your Skill

Instructions for the agent.
```

The directory name is the skill ID. Keep it lowercase `kebab-case` and aligned
with the frontmatter `name`.

---

## Repository conventions

- **One source of truth.** Author in `skills/`; never fork content into adapter
  paths.
- **Relative symlinks only.** Use `../../skills/<name>` so the repository works
  after cloning to another machine.
- **One skill per directory.** Do not nest skills inside other skills.
- **Description is the routing signal.** State what the skill does and when to
  use it. The optional `trigger` list is portable metadata; keep it aligned with
  the description.
- **Self-contained skills.** Assume the reader cannot see the rest of the
  repository.
- **No placeholders.** A finished skill contains no `TODO`, ellipses, or
  unfilled sections.
- **Update the routing layer.** When you add or rename a skill, update
  `AGENTS.md`, this README, and any adapters in the same change.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| OpenCode does not list the skill | The file is not named exactly `SKILL.md`, the directory is wrong, or the skill has no `description` | Confirm `.opencode/skills/my-first-skill/SKILL.md`, add a description, and restart or reload OpenCode |
| OpenCode loads the wrong skill | Duplicate skill IDs across `.opencode/skills`, `.claude/skills`, or global paths | Keep one canonical link per ID; OpenCode prefers the later project source |
| Claude Code does not auto-load | The task does not match the description, or the skill is not in `.claude/skills` | Invoke `/my-first-skill` explicitly, or refine the description |
| Cursor ignores the skill | Cursor is not in agent mode, or the rule has not been added | Add the `.cursor/rules` rule, use agent mode, or mention `@skills/my-first-skill/SKILL.md` |
| Copilot ignores the skill | Instruction files do not resolve file links, or the surface cannot read repository files | Rely on the coding agent with `AGENTS.md`, or mirror the core rules into the instruction file |
| Symlinks are broken after cloning | Absolute links were used, or the clone did not preserve symlinks | Recreate relative links; on Windows, enable developer mode or copy the directory instead |
| Frontmatter validation fails | Invalid YAML, missing delimiters, or a directory/name mismatch | Compare with `skills/my-first-skill/SKILL.md` and fix the reported path |

---

## License

Released under the [MIT License](LICENSE).
