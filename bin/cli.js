#!/usr/bin/env node
'use strict';

/**
 * cli.js
 *
 * Copies the bundled skill catalog into the discovery paths that agent hosts
 * read. The runner uses Node.js built-ins only, so `npx` can execute it
 * without installing dependencies.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const PACKAGE = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const REPOSITORY = 'rafidone/agent-skills';

const HOSTS = {
  opencode: {
    project: ['.opencode', 'skills'],
    personal: ['.config', 'opencode', 'skills'],
  },
  claude: {
    project: ['.claude', 'skills'],
    personal: ['.claude', 'skills'],
  },
  codex: {
    project: ['.codex', 'skills'],
    personal: ['.codex', 'skills'],
  },
};

function helpText() {
  return [
    'Agent Skills',
    '',
    'Usage:',
    '  agent-skills add [repository] [options]',
    '  agent-skills init [repository] [options]',
    '  agent-skills list',
    '  agent-skills --version',
    '',
    'Commands:',
    '  add      Copy the bundled skills into a project or personal skills directory.',
    '  init     Alias for add.',
    '  list     Print the bundled skills and their descriptions.',
    '',
    'Options:',
    '  --host <names>  Hosts to install for: opencode, claude, codex, or all.',
    '                  Repeat the flag or comma-separate names. Default: opencode.',
    '  --dir <path>    Project directory to install into. Default: current directory.',
    '  --personal      Install into the user-level skills directory for each host.',
    '  --force         Replace skill directories that already exist.',
    '  --dry-run       Print the planned install without writing files.',
    '  -h, --help      Show this help.',
    '  -v, --version   Show the package version.',
    '',
    'Examples:',
    '  npx agent-skills add rafidone/agent-skills',
    '  npx agent-skills add --host claude --dir ./app',
    '  npx agent-skills add --host all --personal',
    '  npx agent-skills list',
    '',
  ].join('\n');
}

function readDescription(file) {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^description:\s*(.+)$/m);
  return match ? match[1].trim() : '';
}

function listSkills() {
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(SKILLS_DIR, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
    .sort();
}

function normalizeRepository(value) {
  return value
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/^git@github\.com:/i, '')
    .replace(/\.git$/i, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function resolveHosts(requested) {
  if (requested.length === 0) return ['opencode'];

  const hosts = [];
  for (const name of requested) {
    if (name === 'all') {
      hosts.push(...Object.keys(HOSTS));
      continue;
    }
    if (!HOSTS[name]) {
      throw new Error(`Unknown host "${name}". Choose opencode, claude, codex, or all.`);
    }
    hosts.push(name);
  }
  return [...new Set(hosts)];
}

function parseArgs(argv) {
  const options = {
    command: 'help',
    repository: null,
    hosts: [],
    dir: null,
    personal: false,
    force: false,
    dryRun: false,
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '-h' || arg === '--help') {
      options.command = 'help';
      return options;
    }
    if (arg === '-v' || arg === '--version') {
      options.command = 'version';
      return options;
    }
    if (arg === '--personal') {
      options.personal = true;
      continue;
    }
    if (arg === '--force') {
      options.force = true;
      continue;
    }
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--host' || arg.startsWith('--host=')) {
      const value = arg === '--host' ? argv[++index] : arg.slice('--host='.length);
      if (!value) throw new Error('--host requires a value');
      options.hosts.push(...value.split(',').map((item) => item.trim()).filter(Boolean));
      continue;
    }
    if (arg === '--dir' || arg.startsWith('--dir=')) {
      const value = arg === '--dir' ? argv[++index] : arg.slice('--dir='.length);
      if (!value) throw new Error('--dir requires a value');
      options.dir = value;
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }
    positional.push(arg);
  }

  if (positional.length > 0) options.command = positional[0];
  if (positional.length > 1) options.repository = positional[1];
  if (positional.length > 2) throw new Error(`Unexpected argument: ${positional[2]}`);

  return options;
}

function targetDirectory(host, options) {
  const segments = options.personal ? HOSTS[host].personal : HOSTS[host].project;
  const base = options.personal ? os.homedir() : path.resolve(options.dir || process.cwd());
  return path.join(base, ...segments);
}

function showList() {
  for (const name of listSkills()) {
    const description = readDescription(path.join(SKILLS_DIR, name, 'SKILL.md'));
    process.stdout.write(`${name}\n`);
    if (description) process.stdout.write(`  ${description}\n`);
  }
}

function install(options) {
  if (options.personal && options.dir) {
    throw new Error('--personal and --dir cannot be used together');
  }
  if (options.repository && normalizeRepository(options.repository) !== REPOSITORY) {
    throw new Error(
      `This runner installs the bundled ${REPOSITORY} catalog. ` +
        'Pass that repository or omit the argument.',
    );
  }

  const skills = listSkills();
  if (skills.length === 0) {
    throw new Error(`No skills found in ${SKILLS_DIR}`);
  }

  const hosts = resolveHosts(options.hosts);
  const displayPath = (value) => {
    const relative = path.relative(process.cwd(), value);
    return relative && !relative.startsWith('..') ? relative : value;
  };

  for (const host of hosts) {
    const target = targetDirectory(host, options);

    if (options.dryRun) {
      process.stdout.write(`Would install ${skills.length} skills into ${target}\n`);
      continue;
    }

    fs.mkdirSync(target, { recursive: true });

    let installed = 0;
    let skipped = 0;

    for (const name of skills) {
      const source = path.join(SKILLS_DIR, name);
      const destination = path.join(target, name);

      if (fs.existsSync(destination) && !options.force) {
        process.stdout.write(`skip ${displayPath(destination)} (already exists; use --force to replace)\n`);
        skipped += 1;
        continue;
      }

      fs.rmSync(destination, { recursive: true, force: true });
      fs.cpSync(source, destination, { recursive: true });
      installed += 1;
    }

    process.stdout.write(`Installed ${installed} skills into ${target}\n`);
    if (skipped > 0) {
      process.stdout.write(`Skipped ${skipped} existing skills\n`);
    }
  }
}

function run(options) {
  switch (options.command) {
    case 'help':
      process.stdout.write(helpText());
      return;
    case 'version':
      process.stdout.write(`${PACKAGE.version}\n`);
      return;
    case 'list':
      showList();
      return;
    case 'add':
    case 'init':
      install(options);
      return;
    default:
      throw new Error(`Unknown command "${options.command}". Run agent-skills --help.`);
  }
}

process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') process.exit(0);
  throw error;
});

try {
  run(parseArgs(process.argv.slice(2)));
} catch (error) {
  process.stderr.write(`error: ${error.message}\n`);
  process.exitCode = 1;
}
