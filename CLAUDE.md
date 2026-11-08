# Claude Code

This repository ships portable Agent Skills. Claude Code discovers them through
its own skill directories; the canonical source is `skills/`.

## Use the skills

Read `AGENTS.md` for the routing contract and the full catalog. In short:

- Load the most specific skill for the task.
- Read the whole `SKILL.md`, not only the description.
- Follow its verification section before declaring the work done.

Claude Code can also invoke a skill directly with `/skill-name` once the skill
directory is installed under `.claude/skills/` or `~/.claude/skills/`.

## Install the catalog

Project-scoped:

```bash
mkdir -p .claude/skills
for skill in skills/*/; do
  ln -sfn "../../$skill" ".claude/skills/$(basename "$skill")"
done
```

Personal, available in every project:

```bash
mkdir -p ~/.claude/skills
for skill in skills/*/; do
  ln -sfn "$PWD/$skill" "$HOME/.claude/skills/$(basename "$skill")"
done
```

## Validate a change

```bash
node scripts/validate-skills.js
node --test scripts/**/*.test.js
node scripts/run-evals.js --min-rank1 85
```

Do not fork skill content into this file. It is a pointer, not a second copy.
