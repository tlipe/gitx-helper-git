#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// ===== colors =====
const c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(msg, color = c.reset) {
  console.log(color + msg + c.reset);
}

// ===== utils =====
function sh(cmd, silent = true) {
  try {
    return execSync(cmd, { stdio: silent ? 'pipe' : 'inherit' }).toString().trim();
  } catch (e) {
    return (e.stdout?.toString() || e.message || '').trim();
  }
}

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function hasGit() {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function inRepo() {
  return fs.existsSync('.git');
}

// ===== core =====
function ensureRepo() {
  if (!hasGit()) {
    log('git not installed', c.red);
    process.exit(1);
  }
  if (!inRepo()) {
    log('initializing repo', c.blue);
    run('git init');
  }
}

function getBranch() {
  return sh('git branch --show-current');
}

function ensureMain() {
  let branch = getBranch();
  if (!branch) {
    log('creating main branch', c.blue);
    run('git checkout -b main');
    return 'main';
  }
  if (branch !== 'main') {
    log(`renaming branch ${branch} -> main`, c.yellow);
    run('git branch -M main');
  }
  return 'main';
}

function hasRemote() {
  return sh('git remote').includes('origin');
}

function ensureRemote(url) {
  if (!hasRemote()) {
    if (!url) {
      log('missing remote', c.red);
      process.exit(1);
    }
    log('adding origin', c.blue);
    run(`git remote add origin ${url}`);
  }
}

function fixRemoteIfInvalid() {
  const url = sh('git remote get-url origin');
  if (url.includes('/tree/')) {
    const clean = url.split('/tree/')[0];
    log('fixing invalid remote', c.yellow);
    run(`git remote set-url origin ${clean}`);
  }
}

function hasChanges() {
  return !!sh('git status --porcelain');
}

function commit(msg) {
  if (!hasChanges()) {
    log('no changes', c.gray);
    return false;
  }
  log('committing...', c.cyan);
  run('git add .');
  run(`git commit -m "${msg}"`);
  return true;
}

// ===== smart git ops =====
function tryRebase() {
  return sh('git pull --rebase origin main');
}

function tryRebaseAuto() {
  return sh('git pull --rebase --autostash origin main');
}

function tryMerge() {
  return sh('git pull origin main');
}

function safePull() {
  log('pull (rebase)...', c.cyan);

  let out = tryRebase();

  if (out.includes('CONFLICT') || out.includes('fatal')) {
    log('rebase failed → autostash', c.yellow);

    out = tryRebaseAuto();

    if (out.includes('CONFLICT') || out.includes('fatal')) {
      log('autostash failed → merge fallback', c.yellow);

      out = tryMerge();

      if (out.includes('CONFLICT')) {
        log('manual conflict resolution required', c.red);
        process.exit(1);
      }
    }
  }

  return out;
}

function safePush() {
  log('push...', c.cyan);

  let out = sh('git push -u origin main');

  if (out.includes('rejected')) {
    log('push rejected → trying automatic sync', c.yellow);

    safePull();
    out = sh('git push -u origin main');

    if (out.includes('rejected')) {
      log('push still rejected', c.red);
      log('use: gitx force', c.yellow);
      process.exit(1);
    }
  }

  return out;
}

function autoStash() {
  const status = sh('git status --porcelain');
  if (status && !status.includes('??')) {
    log('automatic stash', c.yellow);
    run('git stash');
    return true;
  }
  return false;
}

function popStash(stashed) {
  if (stashed) {
    log('restoring stash', c.yellow);
    sh('git stash pop');
  }
}

function isRepoEmptyRemote() {
  const out = sh('git ls-remote --heads origin');
  return !out;
}

function sync(msg, url) {
  ensureRepo();
  ensureMain();
  ensureRemote(url);
  fixRemoteIfInvalid();

  const stashed = autoStash();

  commit(msg);

  if (!isRepoEmptyRemote()) {
    safePull();
  } else {
    log('empty remote detected (first push)', c.gray);
  }

  const res = safePush();

  popStash(stashed);

  log('ok', c.green);
  console.log(res);
}

function forcePush() {
  log('forcing push (overwrites remote)', c.red);
  run('git push -u origin main --force');
}

// ===== cli =====
function help() {
  console.log(`
gitx init <repo_url>
gitx sync "msg"
gitx force
gitx status
gitx set-remote <repo_url>
`);
}

function main() {
  const [,, cmd, ...args] = process.argv;

  switch (cmd) {
    case 'init':
      ensureRepo();
      ensureMain();
      ensureRemote(args[0]);
      fixRemoteIfInvalid();
      log('ok', c.green);
      break;

    case 'sync':
      sync(args.join(' ') || 'update');
      break;

    case 'force':
      forcePush();
      break;

    case 'status':
      run('git status -sb');
      break;

    case 'set-remote':
      if (!args[0]) return log('missing url', c.red);
      run(`git remote set-url origin ${args[0]}`);
      log('remote updated', c.green);
      break;

    default:
      help();
  }
}

main();