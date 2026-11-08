'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  MAX_DESCRIPTION_LENGTH,
  MAX_SKILL_LINES,
  parseFrontmatter,
  stripFencedCodeBlocks,
  lintSkill,
  lintCatalog,
} = require('./skill-lint');

const tmpRoots = [];

function tmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-lint-'));
  tmpRoots.push(dir);
  return dir;
}

after(() => {
  for (const dir of tmpRoots) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

const VALID_BODY = (name) => `# ${name}

## Overview

A discipline that exists for a reason.

## When to Use

Activate it for the situations the description names.

## Core Process

1. Do the first thing.
2. Do the second thing.

## Common Rationalizations

| Rationalization | Required action |
| --- | --- |
| "This is too small." | Do it anyway. |

## Red Flags

- The process was skipped.

## Verification

- [ ] The check was run.
`;

function writeSkill(root, name, options = {}) {
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });

  const description =
    options.description === undefined
      ? 'Performs a specific engineering discipline. Use when the matching task appears.'
      : options.description;
  const license = options.license === undefined ? 'MIT' : options.license;
  const extraFrontmatter = options.extraFrontmatter || '';
  const body = options.body === undefined ? VALID_BODY(name) : options.body;

  const frontmatter = [
    '---',
    `name: ${options.name === undefined ? name : options.name}`,
    `description: ${description}`,
    ...(license === null ? [] : [`license: ${license}`]),
    extraFrontmatter,
    '---',
  ].join('\n');

  fs.writeFileSync(path.join(dir, 'SKILL.md'), `${frontmatter}\n\n${body}`);
  return dir;
}

function messages(result) {
  return [...result.errors, ...result.warnings].join('\n');
}

// ---------------------------------------------------------------------------
// Frontmatter parsing
// ---------------------------------------------------------------------------

test('parseFrontmatter reads scalars, nested maps, and lists', () => {
  const text = [
    '---',
    'name: example-skill',
    'description: Does a thing. Use when a thing is needed.',
    'license: MIT',
    'metadata:',
    '  version: 1.0.0',
    '  phase: build',
    '  tags:',
    '    - quality',
    '    - testing',
    '---',
    '',
    '# Body',
  ].join('\n');

  const { data, body, error } = parseFrontmatter(text);

  assert.equal(error, null);
  assert.equal(data.name, 'example-skill');
  assert.equal(data.metadata.version, '1.0.0');
  assert.equal(data.metadata.phase, 'build');
  assert.deepEqual(data.metadata.tags, ['quality', 'testing']);
  assert.match(body, /^# Body$/m);
});

test('parseFrontmatter strips matching quotes', () => {
  const { data } = parseFrontmatter('---\nname: "quoted"\ndescription: \'single\'\n---\n');
  assert.equal(data.name, 'quoted');
  assert.equal(data.description, 'single');
});

test('parseFrontmatter reports missing and unclosed frontmatter', () => {
  assert.match(parseFrontmatter('# No frontmatter').error, /missing YAML frontmatter/);
  assert.match(parseFrontmatter('---\nname: x\n').error, /unclosed YAML frontmatter/);
});

// ---------------------------------------------------------------------------
// Fenced code blocks
// ---------------------------------------------------------------------------

test('stripFencedCodeBlocks preserves line count and removes headings', () => {
  const input = ['# Title', '```md', '## Verification', '```', '## Overview', '~~~', '## Red Flags', '~~~'].join('\n');
  const output = stripFencedCodeBlocks(input);

  assert.equal(output.split('\n').length, input.split('\n').length);
  assert.doesNotMatch(output, /## Verification/);
  assert.doesNotMatch(output, /## Red Flags/);
  assert.match(output, /## Overview/);
});

test('stripFencedCodeBlocks handles longer closing fences', () => {
  const input = ['````', '## Verification', '````', '## Overview'].join('\n');
  assert.doesNotMatch(stripFencedCodeBlocks(input), /## Verification/);
});

// ---------------------------------------------------------------------------
// Valid skill
// ---------------------------------------------------------------------------

test('lintSkill accepts a skill that satisfies the contract', () => {
  const root = tmpDir();
  const dir = writeSkill(root, 'example-skill');

  const result = lintSkill(dir, { knownSkills: new Set(['example-skill']) });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

// ---------------------------------------------------------------------------
// Naming and frontmatter errors
// ---------------------------------------------------------------------------

test('lintSkill requires SKILL.md', () => {
  const root = tmpDir();
  fs.mkdirSync(path.join(root, 'empty-skill'));

  const result = lintSkill(path.join(root, 'empty-skill'), { knownSkills: new Set() });

  assert.match(messages(result), /missing SKILL\.md/);
});

test('lintSkill rejects a name that does not match the directory', () => {
  const root = tmpDir();
  const dir = writeSkill(root, 'real-name', { name: 'other-name' });

  const result = lintSkill(dir, { knownSkills: new Set(['real-name', 'other-name']) });

  assert.match(messages(result), /must match the directory name/);
});

test('lintSkill rejects non-kebab-case directory names', () => {
  const root = tmpDir();
  const dir = writeSkill(root, 'Bad_Name', { name: 'Bad_Name' });

  const result = lintSkill(dir, { knownSkills: new Set() });

  assert.match(messages(result), /kebab-case/);
});

test('lintSkill rejects unknown top-level frontmatter keys', () => {
  const root = tmpDir();
  const dir = writeSkill(root, 'example-skill', { extraFrontmatter: 'model: gpt-5' });

  const result = lintSkill(dir, { knownSkills: new Set(['example-skill']) });

  assert.match(messages(result), /unknown frontmatter key "model"/);
});

test('lintSkill requires a description', () => {
  const root = tmpDir();
  const dir = writeSkill(root, 'example-skill', { description: 'null' });
  const text = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
  fs.writeFileSync(path.join(dir, 'SKILL.md'), text.replace(/^description: null$/m, 'description:'));

  const result = lintSkill(dir, { knownSkills: new Set(['example-skill']) });

  assert.match(messages(result), /description is required/);
});

test('lintSkill enforces the description length limit', () => {
  const root = tmpDir();
  const dir = writeSkill(root, 'example-skill', {
    description: `${'a'.repeat(MAX_DESCRIPTION_LENGTH)} Use when needed.`,
  });

  const result = lintSkill(dir, { knownSkills: new Set(['example-skill']) });

  assert.match(messages(result), /description exceeds/);
});

test('lintSkill requires a positive trigger phrase in the description', () => {
  const root = tmpDir();
  const dir = writeSkill(root, 'example-skill', { description: 'Performs a specific engineering discipline.' });

  const result = lintSkill(dir, { knownSkills: new Set(['example-skill']) });

  assert.match(messages(result), /description must state when to use the skill/);
});

test('lintSkill rejects descriptions whose only trigger is negated', () => {
  const root = tmpDir();
  const dir = writeSkill(root, 'example-skill', {
    description: 'Performs a specific engineering discipline. Do not use when the task is small.',
  });

  const result = lintSkill(dir, { knownSkills: new Set(['example-skill']) });

  assert.match(messages(result), /description must state when to use the skill/);
});

// ---------------------------------------------------------------------------
// Required sections
// ---------------------------------------------------------------------------

test('lintSkill reports every missing required section', () => {
  const root = tmpDir();
  const dir = writeSkill(root, 'example-skill', { body: '# Example\n\n## Overview\n\nOnly one section.\n' });

  const result = lintSkill(dir, { knownSkills: new Set(['example-skill']) });

  assert.match(messages(result), /missing required section "## When to Use"/);
  assert.match(messages(result), /missing required section "## Core Process"/);
  assert.match(messages(result), /missing required section "## Common Rationalizations"/);
  assert.match(messages(result), /missing required section "## Red Flags"/);
  assert.match(messages(result), /missing required section "## Verification"/);
});

test('lintSkill does not count headings inside fenced code blocks', () => {
  const root = tmpDir();
  const body = '# Example\n\n```md\n## Overview\n## When to Use\n## Core Process\n## Common Rationalizations\n## Red Flags\n## Verification\n```\n';
  const dir = writeSkill(root, 'example-skill', { body });

  const result = lintSkill(dir, { knownSkills: new Set(['example-skill']) });

  assert.match(messages(result), /missing required section "## Overview"/);
  assert.match(messages(result), /missing required section "## Verification"/);
});

test('lintSkill exempts the using-agent-skills meta-skill from section checks', () => {
  const root = tmpDir();
  const dir = writeSkill(root, 'using-agent-skills', { body: '# Using Agent Skills\n\nRouting only.\n' });

  const result = lintSkill(dir, { knownSkills: new Set(['using-agent-skills']) });

  assert.deepEqual(result.errors, []);
});

// ---------------------------------------------------------------------------
// Supporting files and context budget
// ---------------------------------------------------------------------------

test('lintSkill rejects empty support directories', () => {
  const root = tmpDir();
  const dir = writeSkill(root, 'example-skill');
  fs.mkdirSync(path.join(dir, 'references'));

  const result = lintSkill(dir, { knownSkills: new Set(['example-skill']) });

  assert.match(messages(result), /support directory "references" is empty/);
});

test('lintSkill rejects support Markdown files that are not kebab-case', () => {
  const root = tmpDir();
  const dir = writeSkill(root, 'example-skill');
  fs.mkdirSync(path.join(dir, 'references'));
  fs.writeFileSync(path.join(dir, 'references', 'Bad_Name.md'), '# Reference\n');

  const result = lintSkill(dir, { knownSkills: new Set(['example-skill']) });

  assert.match(messages(result), /not kebab-case/);
});

test('lintSkill warns when SKILL.md exceeds the context budget', () => {
  const root = tmpDir();
  const body = `${VALID_BODY('example-skill')}\n${'filler\n'.repeat(MAX_SKILL_LINES)}`;
  const dir = writeSkill(root, 'example-skill', { body });

  const result = lintSkill(dir, { knownSkills: new Set(['example-skill']) });

  assert.equal(result.errors.length, 0);
  assert.match(messages(result), /exceeds the 500-line context budget/);
});

test('lintSkill warns about references to unknown skills', () => {
  const root = tmpDir();
  const body = `${VALID_BODY('example-skill')}\nUse the \`does-not-exist\` skill instead.\n`;
  const dir = writeSkill(root, 'example-skill', { body });

  const result = lintSkill(dir, { knownSkills: new Set(['example-skill']) });

  assert.equal(result.errors.length, 0);
  assert.match(messages(result), /unknown skill "does-not-exist"/);
});

test('lintCatalog validates every skill directory and shares known skill names', () => {
  const root = tmpDir();
  writeSkill(root, 'first-skill');
  writeSkill(root, 'second-skill');
  fs.writeFileSync(path.join(root, 'notes.txt'), 'ignored\n');
  fs.writeFileSync(path.join(root, 'README.md'), '# ignored\n');

  const report = lintCatalog(root);

  assert.equal(report.results.length, 2);
  assert.deepEqual(report.errors, []);
  assert.ok(report.knownSkills.has('first-skill'));
  assert.ok(report.knownSkills.has('second-skill'));
});
