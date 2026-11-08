#!/usr/bin/env node
'use strict';

/**
 * validate-skills.js
 *
 * CLI wrapper around scripts/lib/skill-lint.js. Walks every directory under
 * skills/, validates it against docs/skill-anatomy.md, prints a grouped report,
 * and exits non-zero when any skill has an error.
 *
 * Usage:
 *   node scripts/validate-skills.js
 *   node scripts/validate-skills.js --json
 */

const path = require('node:path');
const { lintCatalog } = require('./lib/skill-lint');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');

function printHuman(report) {
  for (const result of report.results) {
    const status = result.errors.length > 0 ? 'FAIL' : 'PASS';
    console.log(`${status}  ${result.skill}`);

    for (const error of result.errors) {
      console.log(`  error    ${error}`);
    }
    for (const warning of result.warnings) {
      console.log(`  warning  ${warning}`);
    }
  }

  console.log('');
  console.log(
    `${report.results.length} skills, ${report.errors.length} errors, ${report.warnings.length} warnings`,
  );
}

function main() {
  const report = lintCatalog(SKILLS_DIR);

  if (process.argv.includes('--json')) {
    console.log(
      JSON.stringify(
        {
          skills: report.results,
          errors: report.errors,
          warnings: report.warnings,
        },
        null,
        2,
      ),
    );
  } else {
    printHuman(report);
  }

  if (report.results.length === 0) {
    console.error(`ERROR: no skills found in ${SKILLS_DIR}`);
    process.exit(1);
  }

  process.exit(report.errors.length > 0 ? 1 : 0);
}

main();
