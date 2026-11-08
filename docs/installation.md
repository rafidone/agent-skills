# Installation

The skills are plain directories containing a `SKILL.md`. Installing one means
making that directory visible to your host's discovery path. There is no build
step and no runtime dependency for using the skills; Node.js is needed only to
run this repository's validation scripts.

Prefer symlinks over copies. A symlink keeps the catalog as the single source of
truth, so `git pull` updates every installed project at once.

## Host support

| Host | Native `SKILL.md` | Project discovery path | Personal discovery path |
| --- | --- | --- | --- |
| OpenCode | Yes | `.opencode/skills/` | `~/.config/opencode/skills/` |
| Claude Code | Yes | `.claude/skills/` | `~/.claude/skills/` |
| Codex | Yes | `.codex/skills/` | `~/.codex/skills/` |
| Cursor | No | `AGENTS.md`, `.cursor/rules/` | Not applicable |
| GitHub Copilot | No | `AGENTS.md`, `.github/instructions/` | Not applicable |

OpenCode also reads `.claude/skills` and `.agents/skills` as compatibility
paths. A Claude Code install therefore works in OpenCode without a second link.

## Clone once

```bash
git clone https://github.com/rafidone/agent-skills.git ~/src/agent-skills
```

Using a stable location matters. If you clone into a temporary directory and
later delete it, every symlink breaks.

## OpenCode

OpenCode can load a directory of skills. Link the whole catalog once:

```bash
cd /path/to/your/project
mkdir -p .opencode
ln -sfn "$HOME/src/agent-skills/skills" .opencode/skills
```

If `.opencode/skills` already exists as a real directory, link the individual
skills instead:

```bash
mkdir -p .opencode/skills
for skill in "$HOME"/src/agent-skills/skills/*/; do
  ln -sfn "$skill" ".opencode/skills/$(basename "$skill")"
done
```

Personal install, available in every project:

```bash
mkdir -p ~/.config/opencode/skills
for skill in "$HOME"/src/agent-skills/skills/*/; do
  ln -sfn "$skill" "$HOME/.config/opencode/skills/$(basename "$skill")"
done
```

Verify:

```bash
ls .opencode/skills/*/SKILL.md | wc -l
```

Expect `11`.

## Claude Code

Claude Code reads one directory per skill. Link each one:

```bash
cd /path/to/your/project
mkdir -p .claude/skills
for skill in "$HOME"/src/agent-skills/skills/*/; do
  ln -sfn "$skill" ".claude/skills/$(basename "$skill")"
done
```

Personal install:

```bash
mkdir -p ~/.claude/skills
for skill in "$HOME"/src/agent-skills/skills/*/; do
  ln -sfn "$skill" "$HOME/.claude/skills/$(basename "$skill")"
done
```

Verify:

```bash
test -f .claude/skills/test-driven-development/SKILL.md && echo "Claude Code ready"
```

Claude Code auto-loads a skill when the task matches its description. You can
also invoke one explicitly with `/skill-name` or `@skill-name`.

## Codex

Codex follows the same one-directory-per-skill layout:

```bash
cd /path/to/your/project
mkdir -p .codex/skills
for skill in "$HOME"/src/agent-skills/skills/*/; do
  ln -sfn "$skill" ".codex/skills/$(basename "$skill")"
done
```

Personal install:

```bash
mkdir -p ~/.codex/skills
for skill in "$HOME"/src/agent-skills/skills/*/; do
  ln -sfn "$skill" "$HOME/.codex/skills/$(basename "$skill")"
done
```

The repository also ships a Codex plugin manifest at `.codex-plugin/plugin.json`
for hosts that install plugins from a manifest.

## Cursor

Cursor does not load `SKILL.md`. It reads `AGENTS.md` and optional rules under
`.cursor/rules/*.mdc`.

Copy the routing file into the project:

```bash
cp ~/src/agent-skills/AGENTS.md ./AGENTS.md
```

Then edit the skill paths in that file to point at your catalog checkout, or add
one always-on rule:

```bash
mkdir -p .cursor/rules
cat > .cursor/rules/agent-skills.mdc <<'RULE'
---
description: Route engineering tasks through the Agent Skills catalog
alwaysApply: true
---

Before any feature, bug fix, refactor, or review, read the matching skill under
$HOME/src/agent-skills/skills/ and follow its verification section.
Start with $HOME/src/agent-skills/skills/using-agent-skills/SKILL.md when the
route is unclear.
RULE
```

Keep the rule short. It is a pointer; the procedure lives in the skill.

## GitHub Copilot

Copilot reads `AGENTS.md` for the coding agent and instruction files for the
editor.

Repository-wide editor instructions:

```bash
mkdir -p .github
cat > .github/copilot-instructions.md <<'INSTRUCTIONS'
# Engineering workflow

For any feature, bug fix, refactor, or test change, follow the matching skill in
$HOME/src/agent-skills/skills/. Start with using-agent-skills when the route is
unclear. Do not mark work complete with failing tests, lint errors, or missing
evidence.
INSTRUCTIONS
```

Path-scoped instructions use `applyTo` frontmatter:

```bash
mkdir -p .github/instructions
cat > .github/instructions/engineering.instructions.md <<'INSTRUCTIONS'
---
applyTo: "**"
---

Follow the Agent Skills workflow for changes to this repository. Read the
matching SKILL.md under $HOME/src/agent-skills/skills/ before editing.
INSTRUCTIONS
```

Copilot injects instruction files as text and does not expand file links. If the
surface cannot read repository files, copy the relevant skill body into the
instruction file instead of linking to it.

## Install into this repository

This repository already wires OpenCode through a relative symlink:

```text
.opencode/skills -> ../skills
```

That link is tracked in Git as a symlink, not a copy. Do not replace it with a
directory. To confirm:

```bash
git ls-files -s .opencode/skills
```

The mode must be `120000`.

## Verification

Run the repository gates:

```bash
cd ~/src/agent-skills
node scripts/validate-skills.js
node scripts/validate-repo.js
node --test scripts/**/*.test.js
node scripts/run-evals.js --min-rank1 85
```

All four must exit zero. The first prints the skill count; the second checks the
symlink, manifests, eval coverage, links, and text hygiene; the third runs the
linter tests; the fourth checks routing.

## Updating

```bash
cd ~/src/agent-skills
git pull
```

Symlinked installs pick up the new content immediately. Copied installs do not,
which is one reason to prefer links.

After a pull that changes the catalog, rerun the gates. A new skill may add a
phase or a route that your project's `AGENTS.md` should mention.

## Windows

Git on Windows can check out symlinks only when Developer Mode is enabled, and
only when `core.symlinks` is true. If links do not survive the clone, either:

- Enable Developer Mode, then re-clone with `git clone -c core.symlinks=true`.
- Copy the directories instead of linking them, and accept that updates require
  a manual copy.

The validation scripts run on Windows. The one exception is the symlink check in
`validate-repo.js`; it fails if `.opencode/skills` was materialized as a real
directory.

## Removing

OpenCode, project-scoped:

```bash
rm .opencode/skills
```

Claude Code or Codex, project-scoped:

```bash
rm -r .claude/skills
rm -r .codex/skills
```

Personal install:

```bash
rm -r ~/.config/opencode/skills
rm -r ~/.claude/skills
rm -r ~/.codex/skills
```

`rm` on a symlink removes the link, not the catalog. If you used `cp` instead,
you removed your copy; the original remains at `~/src/agent-skills`.

## See also

- [`getting-started.md`](getting-started.md) for a first task.
- [`skill-anatomy.md`](skill-anatomy.md) for the skill contract.
- [`../evals/README.md`](../evals/README.md) for how routing is tested.
- [`../README.md`](../README.md) for the catalog overview.
