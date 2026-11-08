# Skill Evals

How this repository checks that its skills work: that they trigger when they
should, stay distinct from each other, and change agent behavior the way they
promise.

## Tiers

| Tier | What it checks | Runs | Cost |
| --- | --- | --- | --- |
| 1. Structural | Frontmatter, naming, sections, layout, line budget, manifests, links | CI: `validate-skills.js`, `validate-repo.js` | Free |
| 2. Trigger | The intended skill ranks top-k for natural prompts, and negative prompts do not fire it | CI: `run-evals.js --min-rank1 85` | Free |
| 3. Behavioral | An agent following the skill satisfies its expectations | On demand: `run-evals.js --behavioral` | Tokens |

Tier 2 is a lexical approximation of routing. It cannot judge meaning, but it
catches the two failure modes that dominate real trigger bugs: a description
missing the words users actually type, and an over-broad description that
outranks the right skill. A Tier 2 failure usually means the description is
wrong, not the eval.

## Case format

One file per skill at `evals/cases/<skill>.json`.

```json
{
  "skill_name": "test-driven-development",
  "trigger": {
    "positive": [
      { "prompt": "Write a failing test before fixing this bug.", "top_k": 3 }
    ],
    "negative": [
      { "prompt": "Diagnose this intermittent failure.", "owner": "debugging-and-error-recovery" }
    ]
  },
  "evals": [
    {
      "id": 1,
      "prompt": "Fix the bug described in BUG.md.",
      "expected_output": "A reproduction test observed failing first, then a minimal fix.",
      "files": ["test-driven-development"],
      "expectations": [
        "A failing test is written and shown failing before the fix",
        "The full suite is run after the change"
      ]
    }
  ]
}
```

Rules:

- At least three positive prompts and two negative prompts per skill.
- `top_k` defaults to 3.
- A negative prompt passes when the skill under test is not ranked first.
- Skills in the core set need at least one behavioral case.
- `files` names a directory under `evals/fixtures/`, or is empty.
- Every expectation must be checkable from the transcript, not from the final
  claim.

Core set: `spec-driven-development`, `planning-and-task-breakdown`,
`incremental-implementation`, `test-driven-development`, and
`code-review-and-quality`.

## Running

Structural and trigger checks:

```bash
node scripts/validate-skills.js
node scripts/validate-repo.js
node --test scripts/**/*.test.js
node scripts/run-evals.js --min-rank1 85
```

Inspect routing for one skill:

```bash
node scripts/run-evals.js --skill test-driven-development --verbose
```

Behavioral plan, no tokens spent:

```bash
node scripts/run-evals.js --behavioral --dry-run
```

Behavioral run through a headless agent:

```bash
node scripts/run-evals.js --behavioral \
  --executor "opencode run"
```

Raw output is written to `evals/results/`, which is gitignored. Grading is
manual in this release: read the transcript, check each expectation, and record
the verdict. Do not grade the agent's self-report; grade what it actually did.

## Adding a case

1. Write the trigger prompts first, using the words a real user would type.
2. Run the trigger tier. If the skill does not rank, fix the description before
   weakening the prompt.
3. Add a behavioral case with observable expectations.
4. If the case needs input files, add them under `evals/fixtures/<skill>/`.
5. Run all three tiers before committing.

## What not to do

- Do not add a prompt that only works because it contains the skill name.
- Do not remove a negative prompt because it exposes a collision. Fix the
  descriptions.
- Do not write expectations that a confident but wrong answer can satisfy.
- Do not grade a behavioral run from the agent's summary; read the trace.
