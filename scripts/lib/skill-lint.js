'use strict';

/**
 * skill-lint.js
 *
 * The validation rules for this repository's skills, expressed as a small
 * importable library. `scripts/validate-skills.js` is a thin CLI wrapper.
 *
 * Errors block the build. Warnings are reported but do not fail it, because
 * trimming a skill or retiring a reference is an editorial decision.
 */

const fs = require('node:fs');
const path = require('node:path');

const MAX_DESCRIPTION_LENGTH = 1024;
const MAX_SKILL_LINES = 500;
const MAX_NAME_LENGTH = 64;

// The only keys the Agent Skills specification allows at the top level.
const SPEC_FRONTMATTER_KEYS = new Set([
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
]);

const REQUIRED_SECTIONS = [
  'Overview',
  'When to Use',
  'Core Process',
  'Common Rationalizations',
  'Red Flags',
  'Verification',
];

// The meta-skill routes rather than executes, so execution sections do not
// apply to it. Exemptions live here so a skill cannot exempt itself.
const SECTION_EXEMPT_SKILLS = new Set(['using-agent-skills']);

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const POSITIVE_TRIGGER = /\buse (this )?when\b|\buse (before|after|during)\b/i;
const NEGATIVE_TRIGGER =
  /\b(do not|don't|never)\s+use\s+(this\s+)?(when|before|after|during)\b/gi;

const SUPPORT_DIRS = ['references', 'scripts'];

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

function unquote(value) {
  if (value.length >= 2) {
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value[value.length - 1] === quote) {
      return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
    }
  }
  return value;
}

function tokenizeFrontmatter(lines) {
  const tokens = [];
  for (const raw of lines) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const indent = raw.length - raw.trimStart().length;
    tokens.push({ indent, content: raw.trim() });
  }
  return tokens;
}

function parseBlock(tokens, start, indent) {
  const value = {};
  let i = start;

  while (i < tokens.length) {
    const token = tokens[i];
    if (token.indent < indent) break;
    if (token.indent > indent) {
      // Defensive: malformed indentation was already consumed by a parent.
      i += 1;
      continue;
    }
    if (token.content.startsWith('- ')) break;

    const match = token.content.match(/^([A-Za-z0-9_.-]+):(.*)$/);
    if (!match) {
      i += 1;
      continue;
    }

    const key = match[1];
    const rest = match[2].trim();

    if (rest !== '') {
      value[key] = unquote(rest);
      i += 1;
      continue;
    }

    const next = i + 1;
    if (next < tokens.length && tokens[next].indent > indent) {
      const childIndent = tokens[next].indent;
      if (tokens[next].content.startsWith('- ')) {
        const list = [];
        let j = next;
        while (
          j < tokens.length &&
          tokens[j].indent === childIndent &&
          tokens[j].content.startsWith('- ')
        ) {
          list.push(unquote(tokens[j].content.slice(2).trim()));
          j += 1;
        }
        value[key] = list;
        i = j;
      } else {
        const child = parseBlock(tokens, next, childIndent);
        value[key] = child.value;
        i = child.next;
      }
      continue;
    }

    value[key] = {};
    i += 1;
  }

  return { value, next: i };
}

function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);

  if (lines[0] === undefined || lines[0].trim() !== '---') {
    return { data: null, body: text, error: 'missing YAML frontmatter' };
  }

  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }

  if (end === -1) {
    return { data: null, body: text, error: 'unclosed YAML frontmatter' };
  }

  const tokens = tokenizeFrontmatter(lines.slice(1, end));
  const { value } = parseBlock(tokens, 0, 0);

  return {
    data: value,
    body: lines.slice(end + 1).join('\n'),
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Markdown helpers
// ---------------------------------------------------------------------------

function stripFencedCodeBlocks(content) {
  const output = [];
  let open = null;

  for (const line of content.split(/\r?\n/)) {
    if (open) {
      const close = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
      if (close && close[1][0] === open.marker && close[1].length >= open.length) {
        open = null;
      }
      output.push('');
      continue;
    }

    const start = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (start) {
      open = { marker: start[1][0], length: start[1].length };
      output.push('');
      continue;
    }

    output.push(line);
  }

  return output.join('\n');
}

function extractHeadings(body) {
  const stripped = stripFencedCodeBlocks(body);
  const headings = [];
  for (const match of stripped.matchAll(/^##[ \t]+(.+?)[ \t]*$/gm)) {
    headings.push(match[1].trim());
  }
  return headings;
}

function extractSkillRefs(body) {
  const stripped = stripFencedCodeBlocks(body);
  const patterns = [
    /`([a-z0-9][a-z0-9-]*)` skill\b/g,
    /\bskill `([a-z0-9][a-z0-9-]*)`/g,
    /\buse the `([a-z0-9][a-z0-9-]*)` skill\b/g,
    /\bfollow the `([a-z0-9][a-z0-9-]*)` skill\b/g,
    /`([a-z0-9][a-z0-9-]*)` persona\b/g,
  ];

  const found = new Set();
  for (const pattern of patterns) {
    for (const match of stripped.matchAll(pattern)) {
      found.add(match[1]);
    }
  }
  return [...found];
}

function walkFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// Linting
// ---------------------------------------------------------------------------

function lintSkill(skillDir, options = {}) {
  const skill = path.basename(skillDir);
  const errors = [];
  const warnings = [];

  if (!KEBAB_CASE.test(skill)) {
    errors.push(`${skill}: skill directory name must be kebab-case`);
  }

  const skillFile = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    errors.push(`${skill}: missing SKILL.md`);
    return { skill, errors, warnings };
  }

  const text = fs.readFileSync(skillFile, 'utf8');
  const { data, body, error } = parseFrontmatter(text);

  if (error) {
    errors.push(`${skill}: ${error}`);
    return { skill, errors, warnings };
  }

  // Name
  if (typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push(`${skill}: frontmatter "name" is required`);
  } else {
    if (data.name !== skill) {
      errors.push(`${skill}: frontmatter name "${data.name}" must match the directory name`);
    }
    if (!KEBAB_CASE.test(data.name)) {
      errors.push(`${skill}: frontmatter name "${data.name}" must be kebab-case`);
    }
    if (data.name.length > MAX_NAME_LENGTH) {
      errors.push(`${skill}: frontmatter name exceeds ${MAX_NAME_LENGTH} characters`);
    }
  }

  // Unknown top-level keys
  for (const key of Object.keys(data)) {
    if (!SPEC_FRONTMATTER_KEYS.has(key)) {
      errors.push(`${skill}: unknown frontmatter key "${key}"`);
    }
  }

  // Description
  if (typeof data.description !== 'string' || data.description.trim() === '') {
    errors.push(`${skill}: description is required`);
  } else {
    if (data.description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push(
        `${skill}: description exceeds ${MAX_DESCRIPTION_LENGTH} characters (${data.description.length})`,
      );
    }
    const positiveSource = data.description.replace(
      new RegExp(NEGATIVE_TRIGGER.source, 'gi'),
      '',
    );
    if (!POSITIVE_TRIGGER.test(positiveSource)) {
      errors.push(
        `${skill}: description must state when to use the skill with a positive "Use when" trigger`,
      );
    }
  }

  // Required sections
  if (!SECTION_EXEMPT_SKILLS.has(skill)) {
    const headings = new Set(
      extractHeadings(body).map((heading) => heading.toLowerCase().replace(/\s+/g, ' ')),
    );
    for (const section of REQUIRED_SECTIONS) {
      if (!headings.has(section.toLowerCase())) {
        errors.push(`${skill}: missing required section "## ${section}"`);
      }
    }
  }

  // Support directories and file names
  for (const sub of SUPPORT_DIRS) {
    const supportDir = path.join(skillDir, sub);
    if (fs.existsSync(supportDir) && fs.statSync(supportDir).isDirectory()) {
      if (fs.readdirSync(supportDir).length === 0) {
        errors.push(`${skill}: support directory "${sub}" is empty`);
      }
    }
  }

  for (const file of walkFiles(skillDir)) {
    if (path.basename(file) === 'SKILL.md') continue;
    if (path.extname(file).toLowerCase() !== '.md') continue;
    const stem = path.basename(file, path.extname(file));
    if (!KEBAB_CASE.test(stem)) {
      errors.push(
        `${skill}: support file "${path.relative(skillDir, file)}" is not kebab-case`,
      );
    }
  }

  // Context budget
  const lineCount = text.split(/\r?\n/).length;
  if (lineCount > MAX_SKILL_LINES) {
    warnings.push(
      `${skill}: SKILL.md has ${lineCount} lines and exceeds the ${MAX_SKILL_LINES}-line context budget`,
    );
  }

  // Cross-skill references
  const knownSkills = options.knownSkills || new Set([skill]);
  for (const reference of extractSkillRefs(body)) {
    if (!knownSkills.has(reference)) {
      warnings.push(`${skill}: references unknown skill "${reference}"`);
    }
  }

  return { skill, errors, warnings };
}

function lintCatalog(skillsDir, options = {}) {
  const names = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => {
      if (entry.isDirectory()) return true;
      if (!entry.isSymbolicLink()) return false;
      try {
        return fs.statSync(path.join(skillsDir, entry.name)).isDirectory();
      } catch {
        return false;
      }
    })
    .map((entry) => entry.name)
    .sort();

  const knownSkills = new Set(names);
  const results = names.map((name) =>
    lintSkill(path.join(skillsDir, name), { ...options, knownSkills }),
  );

  return {
    knownSkills,
    results,
    errors: results.flatMap((result) => result.errors),
    warnings: results.flatMap((result) => result.warnings),
  };
}

module.exports = {
  MAX_DESCRIPTION_LENGTH,
  MAX_SKILL_LINES,
  MAX_NAME_LENGTH,
  SPEC_FRONTMATTER_KEYS,
  REQUIRED_SECTIONS,
  SECTION_EXEMPT_SKILLS,
  parseFrontmatter,
  stripFencedCodeBlocks,
  extractHeadings,
  extractSkillRefs,
  lintSkill,
  lintCatalog,
};
