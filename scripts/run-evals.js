#!/usr/bin/env node
'use strict';

/**
 * run-evals.js
 *
 * Two tiers:
 *
 *   Trigger tier (default, deterministic, CI-safe)
 *     Scores each eval prompt against every skill description with a small
 *     TF-IDF ranker and checks that the intended skill lands in the top-k.
 *     Negative prompts check that the skill under test is not ranked first.
 *
 *   Behavioral tier (--behavioral)
 *     Prints the behavioral cases, or runs them through an external executor
 *     and saves the raw output for grading. Grading is deliberately manual in
 *     this release; see evals/README.md.
 *
 * Usage:
 *   node scripts/run-evals.js
 *   node scripts/run-evals.js --min-rank1 85 --verbose
 *   node scripts/run-evals.js --skill test-driven-development
 *   node scripts/run-evals.js --behavioral --dry-run
 *   node scripts/run-evals.js --behavioral --executor "opencode run"
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { parseFrontmatter } = require('./lib/skill-lint');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const CASES_DIR = path.join(ROOT, 'evals', 'cases');
const RESULTS_DIR = path.join(ROOT, 'evals', 'results');

const STOPWORDS = new Set(
  (
    'a an and are as at be been being both but by can could did do does for from ' +
    'had has have having he her here hers him his how i if in into is it its just ' +
    'may me might more most must my no nor not of off on once only or other our ' +
    'out over own same she should so some such than that the their them then there ' +
    'these they this those through to too under until up very was we were what when ' +
    'where which while who whom why will with would you your yours'
  ).split(/\s+/),
);

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
    .map(stem);
}

function stem(word) {
  let result = word;
  if (result.length > 5 && result.endsWith('ies')) result = `${result.slice(0, -3)}y`;
  else if (result.length > 5 && result.endsWith('ing')) result = result.slice(0, -3);
  else if (result.length > 4 && result.endsWith('ed')) result = result.slice(0, -2);
  else if (result.length > 4 && result.endsWith('ly')) result = result.slice(0, -2);
  else if (result.length > 3 && result.endsWith('s') && !result.endsWith('ss')) {
    result = result.slice(0, -1);
  }
  return result;
}

function loadCatalog() {
  const names = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return names.map((name) => {
    const file = path.join(SKILLS_DIR, name, 'SKILL.md');
    const text = fs.readFileSync(file, 'utf8');
    const { data } = parseFrontmatter(text);
    const nameTokens = tokenize(name.replace(/-/g, ' '));
    const descriptionTokens = tokenize(data.description || '');
    const tokens = [...nameTokens, ...descriptionTokens];

    const counts = new Map();
    for (const token of tokens) {
      counts.set(token, (counts.get(token) || 0) + 1);
    }

    return {
      name,
      description: data.description || '',
      nameTokens: new Set(nameTokens),
      counts,
      length: Math.max(tokens.length, 1),
    };
  });
}

function buildIdf(catalog) {
  const documentFrequency = new Map();
  for (const skill of catalog) {
    for (const token of skill.counts.keys()) {
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    }
  }

  const idf = new Map();
  const total = catalog.length;
  for (const [token, frequency] of documentFrequency) {
    idf.set(token, Math.log((total + 1) / (frequency + 0.5)) + 1);
  }
  return idf;
}

function score(promptTokens, skill, idf) {
  let total = 0;
  for (const token of promptTokens) {
    const termFrequency = skill.counts.get(token);
    if (!termFrequency) continue;
    const weight = 1 + Math.log(termFrequency);
    const inverse = idf.get(token) || 1;
    const nameBoost = skill.nameTokens.has(token) ? 1.5 : 1;
    total += weight * inverse * nameBoost;
  }
  return total / Math.sqrt(skill.length);
}

function rank(prompt, catalog, idf) {
  const promptTokens = tokenize(prompt);
  return catalog
    .map((skill) => ({ name: skill.name, score: score(promptTokens, skill, idf) }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function loadCases() {
  if (!fs.existsSync(CASES_DIR)) return [];
  return fs
    .readdirSync(CASES_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
      const full = path.join(CASES_DIR, file);
      const data = JSON.parse(fs.readFileSync(full, 'utf8'));
      return { file, ...data };
    });
}

function runTriggerTier(options) {
  const catalog = loadCatalog();
  const idf = buildIdf(catalog);
  const cases = loadCases().filter(
    (testCase) => !options.skill || testCase.skill_name === options.skill,
  );

  if (cases.length === 0) {
    console.error('No eval cases found.');
    return 1;
  }

  let positives = 0;
  let rankOne = 0;
  let failures = 0;

  for (const testCase of cases) {
    const trigger = testCase.trigger || {};
    const positive = trigger.positive || [];
    const negative = trigger.negative || [];

    console.log(`\n${testCase.skill_name}  (${testCase.file})`);

    for (const item of positive) {
      positives += 1;
      const results = rank(item.prompt, catalog, idf);
      const position = results.findIndex((entry) => entry.name === testCase.skill_name);
      const topK = item.top_k || 3;
      const passed = position !== -1 && position < topK;
      if (position === 0) rankOne += 1;
      if (!passed) failures += 1;

      const marker = passed ? 'ok  ' : 'FAIL';
      console.log(`  ${marker} positive  rank ${position + 1}  "${item.prompt}"`);
      if (options.verbose || !passed) {
        console.log(
          `        top: ${results
            .slice(0, 3)
            .map((entry) => `${entry.name} (${entry.score.toFixed(2)})`)
            .join(', ')}`,
        );
      }
    }

    for (const item of negative) {
      const results = rank(item.prompt, catalog, idf);
      const position = results.findIndex((entry) => entry.name === testCase.skill_name);
      const passed = position !== 0;
      if (!passed) failures += 1;

      const marker = passed ? 'ok  ' : 'FAIL';
      console.log(`  ${marker} negative  rank ${position + 1}  "${item.prompt}"`);
      if (options.verbose || !passed) {
        const owner = item.owner ? ` owner=${item.owner}` : '';
        console.log(
          `        top: ${results
            .slice(0, 3)
            .map((entry) => `${entry.name} (${entry.score.toFixed(2)})`)
            .join(', ')}${owner}`,
        );
      }
    }
  }

  const rankOneRate = positives === 0 ? 0 : (rankOne / positives) * 100;
  console.log('');
  console.log(
    `Trigger tier: ${positives} positive prompts, ${rankOne} ranked first ` +
      `(${rankOneRate.toFixed(1)} percent), ${failures} failures`,
  );

  if (options.minRank1 !== null && rankOneRate < options.minRank1) {
    console.error(
      `FAIL: rank-1 rate ${rankOneRate.toFixed(1)} percent is below the ` +
        `${options.minRank1} percent floor`,
    );
    failures += 1;
  }

  return failures === 0 ? 0 : 1;
}

function runBehavioralTier(options) {
  const cases = loadCases().filter(
    (testCase) =>
      (!options.skill || testCase.skill_name === options.skill) &&
      Array.isArray(testCase.evals) &&
      testCase.evals.length > 0,
  );

  if (cases.length === 0) {
    console.error('No behavioral cases found.');
    return 1;
  }

  if (options.dryRun) {
    for (const testCase of cases) {
      console.log(`\n${testCase.skill_name}`);
      for (const item of testCase.evals) {
        console.log(`  case ${item.id}: ${item.prompt}`);
        console.log(`    expectations: ${item.expectations.length}`);
        console.log(`    fixtures: ${(item.files || []).join(', ') || 'none'}`);
      }
    }
    console.log('\nDry run only. Pass --executor "<command>" to run the cases.');
    return 0;
  }

  if (!options.executor) {
    console.error(
      'Behavioral tier needs an executor. Use --dry-run to print the plan, or ' +
        '--executor "<command>" to run each prompt through a headless agent.',
    );
    return 1;
  }

  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  for (const testCase of cases) {
    for (const item of testCase.evals) {
      const output = spawnSync(options.executor, {
        input: item.prompt,
        shell: true,
        encoding: 'utf8',
        timeout: options.timeout,
        maxBuffer: 20 * 1024 * 1024,
      });

      const stem = `${testCase.skill_name}-${item.id}`;
      const target = path.join(RESULTS_DIR, `${stem}.txt`);
      fs.writeFileSync(
        target,
        [
          `skill: ${testCase.skill_name}`,
          `case: ${item.id}`,
          `prompt: ${item.prompt}`,
          '',
          '--- stdout ---',
          output.stdout || '',
          '--- stderr ---',
          output.stderr || '',
          `exit: ${output.status}`,
        ].join('\n'),
      );

      console.log(`${output.status === 0 ? 'ok  ' : 'FAIL'} ${stem} -> ${target}`);
    }
  }

  console.log(
    '\nBehavioral runs saved. Grade each result against the expectations in the case file.',
  );
  return 0;
}

function parseArgs(argv) {
  const options = {
    behavioral: false,
    dryRun: false,
    executor: null,
    minRank1: null,
    skill: null,
    verbose: false,
    timeout: 10 * 60 * 1000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--behavioral') options.behavioral = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--verbose') options.verbose = true;
    else if (arg === '--executor') options.executor = argv[++i];
    else if (arg === '--min-rank1') options.minRank1 = Number(argv[++i]);
    else if (arg === '--skill') options.skill = argv[++i];
    else if (arg === '--timeout') options.timeout = Number(argv[++i]);
    else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: node scripts/run-evals.js [--min-rank1 N] [--skill NAME] [--verbose]\n' +
          '       node scripts/run-evals.js --behavioral [--dry-run] [--executor CMD]',
      );
      process.exit(0);
    }
  }

  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const code = options.behavioral
    ? runBehavioralTier(options)
    : runTriggerTier(options);
  process.exit(code);
}

main();
