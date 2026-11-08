# Contributing

This repository is a curated catalog, not a collection bin. A new skill is
accepted when it encodes a discipline that changes agent behavior and routes
cleanly against the existing eleven. A skill that restates generic advice or
overlaps an existing one will be declined even if the prose is excellent.

Read [`docs/skill-anatomy.md`](docs/skill-anatomy.md) first. It is the contract
the validator enforces.

## Before you write

Open an issue that answers three questions:

1. What task does an agent get wrong today because this discipline is missing?
2. Which existing skill is the closest match, and why is it not enough?
3. What observable behavior would prove the new skill changed the outcome?

If the answer to the second question is "none", the task is probably a bug fix
to an existing skill, not a new one.

## The acceptance bar

A skill is mergeable when all of the following are true:

- It names one phase of work and one exit condition.
- Its description states the capability and a positive "Use when" trigger in
  the third person.
- It has every required section: Overview, When to Use, Core Process, Common
  Rationalizations, Red Flags, and Verification.
- The rationalizations table names specific excuses, not generic advice.
- The verification section is checkable without judgement.
- It stays under 500 lines, or justifies the exception.
- It has an eval case with three positive and two negative prompts.
- It has a behavioral case if it is one of the core skills.
- It is registered in `AGENTS.md`, `README.md`, and
  [`docs/skill-anatomy.md`](docs/skill-anatomy.md) where applicable.

## Workflow

### 1. Create the skill directory

```bash
mkdir -p skills/<skill-name>
```

The directory name is the skill ID. Use lowercase kebab-case and make the
frontmatter `name` match it exactly.

### 2. Write the skill

Use an existing skill as a structural reference, not as a template to copy.
Start from the failure mode: what does an agent do wrong without this skill, and
what evidence would show it did the right thing instead?

Keep `SKILL.md` self-contained. A reader who sees only that file must be able to
follow the procedure.

### 3. Add the eval case

Create `evals/cases/<skill-name>.json`:

```json
{
  "skill_name": "<skill-name>",
  "trigger": {
    "positive": [
      { "prompt": "A phrase a real user would type.", "top_k": 3 },
      { "prompt": "Another natural request.", "top_k": 3 },
      { "prompt": "A third phrasing that does not name the skill.", "top_k": 3 }
    ],
    "negative": [
      { "prompt": "A task owned by another skill.", "owner": "other-skill" },
      { "prompt": "Another task this skill must not claim.", "owner": "other-skill" }
    ]
  },
  "evals": []
}
```

Prompts must not contain the skill name. A prompt that only works because it
repeats the ID tests nothing.

Run the trigger tier and fix the description if the skill does not rank. Do not
weaken the prompt to get green.

### 4. Add a behavioral case for core skills

The core set is `spec-driven-development`, `planning-and-task-breakdown`,
`incremental-implementation`, `test-driven-development`, and
`code-review-and-quality`. Each needs at least one behavioral case with
observable expectations and, when useful, fixture files under
`evals/fixtures/<skill-name>/`.

Pressure cases are encouraged. The useful ones create a real reason to skip the
discipline: a deadline, a senior person asserting it is unnecessary, or a
tempting simplification. The case passes only when the discipline holds.

### 5. Register the skill

Update these in the same change:

- The routing table in [`AGENTS.md`](AGENTS.md).
- The catalog and phase tables in [`README.md`](README.md).
- The core set in [`scripts/validate-repo.js`](scripts/validate-repo.js) if the
  skill joins it.
- The manifest descriptions if the catalog size or scope changed.

### 6. Run every gate

```bash
node scripts/validate-skills.js
node scripts/validate-repo.js
node --test scripts/**/*.test.js
node scripts/run-evals.js --min-rank1 85
```

All four must pass. Include the output in the pull request. A pull request that
reports "should pass" will be asked to run the commands.

## Changing an existing skill

- **Description changes** alter routing. Run the trigger tier before and after,
  and expect to update eval cases if the intent changed.
- **Procedure changes** must keep the verification section consistent. A new
  rule without a check is not finished.
- **Section removal** requires a reason and, for a required section, a change to
  the contract in [`docs/skill-anatomy.md`](docs/skill-anatomy.md).
- **Renames** require updating every link, the eval case file name, the routing
  tables, and the manifests.

## Retiring a skill

Retirement needs explicit approval in an issue. In the same change:

1. Remove the directory from `skills/`.
2. Remove `evals/cases/<skill>.json` and any fixtures.
3. Remove it from `AGENTS.md`, `README.md`, and the core set.
4. Search the repository for references, including other skills.
5. Explain in the pull request what replaces the discipline, if anything.

## Review criteria

A reviewer checks, in order:

1. Does the skill change observable agent behavior?
2. Is the procedure specific enough to follow without interpretation?
3. Are the rationalizations real excuses, and do the rebuttals name an action?
4. Is every verification item checkable?
5. Does the eval case prove the description routes?
6. Does the change stay inside the repository conventions?

Style preferences are nits. Missing evidence is a blocker.

## Repository conventions

- No emojis, anywhere.
- ASCII only in diagrams and tables.
- No placeholders, `TODO`, or ellipses in a finished skill.
- No trailing whitespace and no tab characters.
- Relative links only, so the repository works from any clone path.
- One source of truth: edit `skills/`, never an adapter or a copy.
- Commit messages explain why, in the imperative, under 72 characters in the
  subject.

The validator checks the mechanical rules. The review checks the rest.

## Code of conduct

Be direct about the work and generous with the person. Critique the diff, the
test, and the missing evidence. Do not critique the contributor.
