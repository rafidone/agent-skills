# Getting Started

This guide takes an empty project to a working skill installation and one
completed task, in about ten minutes. It assumes Node.js 20 or newer is
available for the repository's validation scripts.

## 1. Clone the catalog

```bash
git clone https://github.com/rafidone/agent-skills.git
cd agent-skills
```

Keep this checkout somewhere stable. Other projects will link to it rather than
copy from it, so updates arrive when you pull.

## 2. Install for your host

Pick the host you actually use. Full per-host instructions, including personal
installs and removal, are in [`installation.md`](installation.md).

### OpenCode

OpenCode reads the whole catalog through one directory symlink:

```bash
mkdir -p .opencode
ln -sfn "$PWD/skills" .opencode/skills
```

### Claude Code

Claude Code reads one directory per skill:

```bash
mkdir -p .claude/skills
for skill in skills/*/; do
  ln -sfn "$PWD/$skill" ".claude/skills/$(basename "$skill")"
done
```

### Codex

```bash
mkdir -p .codex/skills
for skill in skills/*/; do
  ln -sfn "$PWD/$skill" ".codex/skills/$(basename "$skill")"
done
```

### Cursor and GitHub Copilot

Neither host loads `SKILL.md` natively. Both read `AGENTS.md`. Copy
[`../AGENTS.md`](../AGENTS.md) into the target repository or write a short
project routing file that points at this checkout. See
[`installation.md`](installation.md) for a minimal rule and instruction file.

## 3. Confirm the host sees the skills

From the catalog checkout:

```bash
node scripts/validate-skills.js
```

Expected last line:

```text
11 skills, 0 errors, 0 warnings
```

From the project that links the catalog, confirm at least one skill file is
reachable:

```bash
test -f .claude/skills/test-driven-development/SKILL.md && echo "wired"
```

## 4. Run one task end to end

The fastest way to see the difference is a small feature where the discipline
has something to catch.

Open a session in the target project and ask:

```text
Add a saved searches feature. Users should be able to save the current
search, list their saved searches, re-run one, and delete one.
```

With routing working, the agent does not start editing files. It:

1. Loads `spec-driven-development` and writes a short spec with acceptance
   criteria, non-goals, failure modes, and a test plan.
2. Loads `planning-and-task-breakdown` and slices the spec into tasks, starting
   with a walking skeleton.
3. Loads `incremental-implementation` and `test-driven-development` and lands
   one thin slice with a test that failed first.
4. Loads `code-review-and-quality` before calling the slice done.
5. Loads `git-workflow-and-versioning` to commit the slice.
6. Loads `shipping-and-launch` for the release plan.

If the agent jumps straight to code, the route did not fire. Check that the
host is reading the installed directory, then ask explicitly:

```text
Use the using-agent-skills skill to choose the right workflow for this task.
```

## 5. Read the gate that applies

Each skill ends with a verification checklist. That checklist is the contract.
For a first run, read two of them:

- [`../skills/spec-driven-development/SKILL.md`](../skills/spec-driven-development/SKILL.md)
  for what a usable spec contains.
- [`../skills/test-driven-development/SKILL.md`](../skills/test-driven-development/SKILL.md)
  for what counts as evidence.

Everything else in the catalog follows the same shape: Overview, When to Use,
Core Process, Common Rationalizations, Red Flags, Verification.

## 6. Make it stick

Three practices keep routing reliable:

- **Keep `AGENTS.md` in the project.** It names the catalog and the precedence
  rules. Hosts that read repository instructions will route deterministically
  instead of guessing from descriptions alone.
- **Name the phase when you ask.** "Write the spec first" and "review this
  diff" are unambiguous. "Do the thing" leaves routing to chance.
- **Reject silent skips.** If a test was weakened or a gate was skipped, say so
  and ask for the evidence. The rationalizations tables exist for this.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| No skills are listed | The install path is wrong, or the link is absolute and broke after a move |
| The wrong skill loads | Two installs define the same skill ID; remove the duplicate |
| The skill never fires | The description does not match the words you use; try the explicit route prompt |
| The agent reads the description only | Ask it to read the whole `SKILL.md` before acting |
| A gate is skipped | Quote the verification section back and ask for the command output |

## Next steps

- [`installation.md`](installation.md) for every host, personal installs, and
  removal.
- [`skill-anatomy.md`](skill-anatomy.md) for the contract if you want to add a
  skill.
- [`comparison.md`](comparison.md) for how this catalog differs from a single
  mega-prompt or a tool-specific rule set.
- [`../evals/README.md`](../evals/README.md) for how the skills are tested.
