#!/usr/bin/env node
'use strict';

/**
 * validate-repo.js
 *
 * Checks the repository-level invariants that skill-lint does not cover:
 * discovery symlink, manifest versions, eval coverage, documentation links,
 * commands, personas, references, and text hygiene.
 *
 * Exit codes: 0 = all clear, 1 = one or more errors.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const CASES_DIR = path.join(ROOT, 'evals', 'cases');

const CORE_SKILLS = new Set([
  'spec-driven-development',
  'planning-and-task-breakdown',
  'incremental-implementation',
  'test-driven-development',
  'code-review-and-quality',
]);

const MANIFESTS = [
  'plugin.json',
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.codex-plugin/plugin.json',
  '.agents/plugins/marketplace.json',
  'package.json',
];

const DOCS = [
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'CONTRIBUTING.md',
  'docs/skill-anatomy.md',
  'docs/getting-started.md',
  'docs/installation.md',
  'docs/comparison.md',
  'evals/README.md',
];

const TEXT_EXTENSIONS = new Set([
  '.md',
  '.json',
  '.js',
  '.yml',
  '.yaml',
  '.toml',
  '.txt',
]);

const SKIP_DIRS = new Set(['.git', 'node_modules', 'evals/results']);

const errors = [];
const passes = [];

function ok(message) {
  passes.push(message);
}

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  const full = path.join(ROOT, relativePath);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

// ---------------------------------------------------------------------------
// Discovery symlink
// ---------------------------------------------------------------------------

function checkSymlink() {
  const link = path.join(ROOT, '.opencode', 'skills');
  if (!fs.existsSync(link)) {
    fail('.opencode/skills is missing');
    return;
  }
  if (!fs.lstatSync(link).isSymbolicLink()) {
    fail('.opencode/skills must be a symbolic link, not a directory');
    return;
  }
  const target = fs.readlinkSync(link);
  if (target !== '../skills' && target !== '../skills/') {
    fail(`.opencode/skills points to "${target}", expected "../skills"`);
    return;
  }
  ok('.opencode/skills resolves to ../skills');
}

// ---------------------------------------------------------------------------
// Manifests
// ---------------------------------------------------------------------------

function checkManifests() {
  const versions = [];
  const pkg = readJson('package.json');

  for (const manifest of MANIFESTS) {
    const full = path.join(ROOT, manifest);
    if (!fs.existsSync(full)) {
      fail(`missing manifest: ${manifest}`);
      continue;
    }

    let data;
    try {
      data = readJson(manifest);
    } catch (error) {
      fail(`invalid JSON in ${manifest}: ${error.message}`);
      continue;
    }

    if (typeof data.version === 'string') {
      versions.push({ manifest, version: data.version });
    }

    if (Array.isArray(data.plugins)) {
      for (const plugin of data.plugins) {
        if (typeof plugin.version === 'string') {
          versions.push({ manifest: `${manifest}#${plugin.name || 'plugin'}`, version: plugin.version });
        }
      }
    }
  }

  const expected = pkg.version;
  for (const entry of versions) {
    if (entry.version !== expected) {
      fail(`${entry.manifest} version ${entry.version} does not match package.json ${expected}`);
    }
  }

  if (versions.length === 0) {
    fail('no manifest versions found');
  } else if (errors.length === 0) {
    ok(`manifest versions agree on ${expected}`);
  }
}

// ---------------------------------------------------------------------------
// Eval coverage
// ---------------------------------------------------------------------------

function listSkills() {
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function checkEvalCoverage() {
  const skills = listSkills();
  const caseFiles = fs.existsSync(CASES_DIR)
    ? fs.readdirSync(CASES_DIR).filter((file) => file.endsWith('.json'))
    : [];
  const caseSkills = new Set();

  for (const skill of skills) {
    const file = path.join(CASES_DIR, `${skill}.json`);
    if (!fs.existsSync(file)) {
      fail(`${skill}: missing eval case evals/cases/${skill}.json`);
      continue;
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      fail(`${skill}: invalid eval case JSON: ${error.message}`);
      continue;
    }

    caseSkills.add(data.skill_name);

    if (data.skill_name !== skill) {
      fail(`${skill}: eval case skill_name is "${data.skill_name}"`);
    }

    const positive = data.trigger && Array.isArray(data.trigger.positive) ? data.trigger.positive : [];
    const negative = data.trigger && Array.isArray(data.trigger.negative) ? data.trigger.negative : [];

    if (positive.length < 3) {
      fail(`${skill}: eval case needs at least 3 positive prompts, found ${positive.length}`);
    }
    if (negative.length < 2) {
      fail(`${skill}: eval case needs at least 2 negative prompts, found ${negative.length}`);
    }
    if (CORE_SKILLS.has(skill) && (!Array.isArray(data.evals) || data.evals.length < 1)) {
      fail(`${skill}: core skill needs at least 1 behavioral eval`);
    }
  }

  for (const file of caseFiles) {
    const name = file.replace(/\.json$/, '');
    if (!caseSkills.has(name)) {
      fail(`evals/cases/${file} does not match a skill name`);
    }
  }

  if (errors.length === 0) {
    ok(`${skills.length} skills have eval cases with trigger coverage`);
  }
}

// ---------------------------------------------------------------------------
// Docs and links
// ---------------------------------------------------------------------------

function stripFences(text) {
  const output = [];
  let open = null;
  for (const line of text.split(/\r?\n/)) {
    if (open) {
      const close = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
      if (close && close[1][0] === open.marker && close[1].length >= open.length) {
        open = null;
      }
      output.push('');
      continue;
    }
    const start = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (start) {
      open = { marker: start[1][0], length: start[1].length };
      output.push('');
      continue;
    }
    output.push(line);
  }
  return output.join('\n');
}

function checkDocsAndLinks() {
  for (const doc of DOCS) {
    if (!fs.existsSync(path.join(ROOT, doc))) {
      fail(`missing document: ${doc}`);
    }
  }

  for (const file of ['agents/code-reviewer.md', 'agents/test-engineer.md']) {
    if (!fs.existsSync(path.join(ROOT, file))) {
      fail(`missing persona: ${file}`);
    }
  }

  for (const file of ['references/definition-of-done.md', 'references/testing-patterns.md']) {
    if (!fs.existsSync(path.join(ROOT, file))) {
      fail(`missing reference: ${file}`);
    }
  }

  const markdownFiles = [];
  for (const doc of DOCS) {
    if (fs.existsSync(path.join(ROOT, doc))) markdownFiles.push(doc);
  }
  for (const dir of ['agents', 'references']) {
    for (const entry of fs.readdirSync(path.join(ROOT, dir))) {
      if (entry.endsWith('.md')) markdownFiles.push(`${dir}/${entry}`);
    }
  }

  for (const relative of markdownFiles) {
    const full = path.join(ROOT, relative);
    const text = stripFences(fs.readFileSync(full, 'utf8'));
    const base = path.dirname(full);

    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].trim();
      if (
        target.startsWith('http://') ||
        target.startsWith('https://') ||
        target.startsWith('mailto:') ||
        target.startsWith('#')
      ) {
        continue;
      }
      const clean = target.split('#')[0];
      if (!clean) continue;
      const resolved = path.resolve(base, clean);
      if (!fs.existsSync(resolved)) {
        fail(`${relative}: broken link "${target}"`);
      }
    }
  }

  const skills = listSkills();
  for (const doc of ['README.md', 'AGENTS.md']) {
    const text = fs.readFileSync(path.join(ROOT, doc), 'utf8');
    for (const skill of skills) {
      if (!text.includes(skill)) {
        fail(`${doc} does not mention skill "${skill}"`);
      }
    }
  }

  if (errors.length === 0) {
    ok(`${markdownFiles.length} documents checked, links resolve, every skill is listed`);
  }
}

// ---------------------------------------------------------------------------
// Commands, personas, references
// ---------------------------------------------------------------------------

function checkCommands() {
  const dir = path.join(ROOT, '.claude', 'commands');
  if (!fs.existsSync(dir)) {
    fail('missing .claude/commands directory');
    return;
  }

  const commands = fs.readdirSync(dir).filter((file) => file.endsWith('.md'));
  const expected = ['build', 'plan', 'review', 'ship', 'spec', 'test'];
  const found = commands.map((file) => file.replace(/\.md$/, '')).sort();

  if (JSON.stringify(found) !== JSON.stringify(expected)) {
    fail(`expected commands ${expected.join(', ')}, found ${found.join(', ') || 'none'}`);
    return;
  }

  for (const command of commands) {
    const text = fs.readFileSync(path.join(dir, command), 'utf8');
    if (!text.startsWith('---\n') || !/^description:/m.test(text.split('---')[1] || '')) {
      fail(`${command}: missing description frontmatter`);
    }
  }

  ok(`${commands.length} commands have descriptions`);
}

// ---------------------------------------------------------------------------
// Text hygiene
// ---------------------------------------------------------------------------

const EMOJI_RANGES = [
  [0x1f000, 0x1f2ff],
  [0x1f300, 0x1faff],
  [0x2600, 0x27bf],
  [0x2b00, 0x2bff],
  [0xfe0f, 0xfe0f],
  [0x1f1e6, 0x1f1ff],
];

function isEmoji(character) {
  const codePoint = character.codePointAt(0);
  return EMOJI_RANGES.some(([start, end]) => codePoint >= start && codePoint <= end);
}

function walkTextFiles(dir, output) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const relative = path.relative(ROOT, full);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || SKIP_DIRS.has(relative)) continue;
      walkTextFiles(full, output);
      continue;
    }

    if (!entry.isFile()) continue;
    if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) ||
        entry.name === '.gitignore' ||
        entry.name === '.gitattributes') {
      output.push(full);
    }
  }
}

function checkHygiene() {
  const files = [];
  walkTextFiles(ROOT, files);
  let issues = 0;

  for (const file of files) {
    const relative = path.relative(ROOT, file);
    const text = fs.readFileSync(file, 'utf8');

    if ([...text].some(isEmoji)) {
      fail(`${relative}: contains an emoji`);
      issues += 1;
    }

    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i] !== lines[i].replace(/[ \t]+$/, '')) {
        fail(`${relative}:${i + 1}: trailing whitespace`);
        issues += 1;
        break;
      }
      if (lines[i].includes('\t')) {
        fail(`${relative}:${i + 1}: tab character`);
        issues += 1;
        break;
      }
    }
  }

  if (issues === 0) {
    ok(`${files.length} text files are free of emojis, trailing whitespace, and tabs`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

checkSymlink();
checkManifests();
checkEvalCoverage();
checkDocsAndLinks();
checkCommands();
checkHygiene();

for (const message of passes) {
  console.log(`PASS  ${message}`);
}
for (const message of errors) {
  console.log(`FAIL  ${message}`);
}

console.log('');
console.log(`${passes.length} checks passed, ${errors.length} errors`);

process.exit(errors.length > 0 ? 1 : 0);
