#!/usr/bin/env node
/**
 * trigger_workflow.js
 *
 * CLI helper to fire a repository_dispatch event from the terminal.
 * Useful for testing the platform without the web UI.
 *
 * Usage:
 *   node scripts/trigger_workflow.js \
 *     --pat       ghp_xxxx               \
 *     --repo      owner/plutonium        \
 *     --prompt    "Generate a README"    \
 *     --target    owner/target-repo      \
 *     --branch    main
 *
 * Environment variable alternative (avoids putting PAT in shell history):
 *   GH_PAT=ghp_xxxx node scripts/trigger_workflow.js ...
 */

'use strict';

import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    pat:     { type: 'string', short: 'p', default: process.env.GH_PAT ?? '' },
    repo:    { type: 'string', short: 'r', default: '' },
    prompt:  { type: 'string', short: 'm', default: '' },
    target:  { type: 'string', short: 't', default: '' },
    branch:  { type: 'string', short: 'b', default: 'main' },
    event:   { type: 'string', short: 'e', default: 'run_mcp_agent' },
  },
  allowPositionals: false,
});

// ── Validate ─────────────────────────────────────────────────────────────────

const missing = ['pat', 'repo', 'prompt', 'target'].filter(k => !values[k]);
if (missing.length) {
  console.error(`ERROR: Missing required option(s): ${missing.map(k => `--${k}`).join(', ')}`);
  process.exit(1);
}

const REPO_RE = /^[A-Za-z0-9_.\-]+\/[A-Za-z0-9_.\-]+$/;
for (const field of ['repo', 'target']) {
  if (!REPO_RE.test(values[field])) {
    console.error(`ERROR: --${field} must be in owner/repo format. Got: "${values[field]}"`);
    process.exit(1);
  }
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

const url  = `https://api.github.com/repos/${values.repo}/dispatches`;
const body = {
  event_type:     values.event,
  client_payload: {
    prompt:      values.prompt,
    target_repo: values.target,
    branch:      values.branch,
  },
};

console.log(`\nDispatching '${values.event}' → ${values.repo}`);
console.log(`  Target : ${values.target} @ ${values.branch}`);
console.log(`  Prompt : ${values.prompt.slice(0, 80)}${values.prompt.length > 80 ? '…' : ''}\n`);

const response = await fetch(url, {
  method:  'POST',
  headers: {
    'Accept':               'application/vnd.github+json',
    'Authorization':        `Bearer ${values.pat}`,
    'Content-Type':         'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
  body: JSON.stringify(body),
});

if (response.status === 204) {
  console.log('✓ Workflow dispatched successfully!');
  console.log(`  Monitor: https://github.com/${values.repo}/actions`);
} else {
  let detail = `HTTP ${response.status}`;
  try {
    const json = await response.json();
    detail = json.message ?? detail;
  } catch { /* ignore */ }
  console.error(`✗ GitHub API error: ${detail}`);
  process.exit(1);
}
