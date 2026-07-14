#!/usr/bin/env node

const {execSync} = require('child_process');
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
    log('git não instalado', c.red);
    process.exit(1);
  }
  if (!inRepo()) {
    log('init repo', c.blue);
    run('git init');
  }
}

function getBranch() {
  return sh('git branch --show-current');
}

function ensureMain() {
  let branch = getBranch();
  if (!branch) {
    log('criando branch main', c.blue);
    run('git checkout -b main');
    return 'main';
  }
  if (branch !== 'main') {
    log(`renomeando branch ${branch} -> main`, c.yellow);
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
      log('faltando remote', c.red);
      process.exit(1);
    }
    log('adicionando origin', c.blue);
    run(`git remote add origin ${url}`);
  }
}

function fixRemoteIfInvalid() {
  const url = sh('git remote get-url origin');
  if (url.includes('/tree/')) {
    const clean = url.split('/tree/')[0];
    log('corrigindo remote inválido', c.yellow);
    run(`git remote set-url origin ${clean}`);
  }
}

function hasChanges() {
  return !!sh('git status --porcelain');
}

function commit(msg) {
  if (!hasChanges()) {
    log('sem mudanças', c.gray);
    return false;
  }
  log('commit...', c.cyan);
  run('git add .');
  run(`git commit -m "${msg}"`);
  return true;
}

function safePull() {
  log('pull (rebase)...', c.cyan);
  const out = sh('git pull --rebase origin main');
  if (out.includes('CONFLICT')) {
    log('conflito detectado', c.red);
    process.exit(1);
  }
  return out;
}

function safePush() {
  log('push...', c.cyan);
  const out = sh('git push -u origin main');
  if (out.includes('rejected')) {
    log('push rejeitado → rebase automático', c.yellow);
    run('git pull --rebase origin main');
    return sh('git push -u origin main');
  }
  return out;
}

function autoStash() {
  const status = sh('git status --porcelain');
  if (status && !status.includes('??')) {
    log('stash automático', c.yellow);
    run('git stash');
    return true;
  }
  return false;
}

function popStash(stashed) {
  if (stashed) {
    log('restaurando stash', c.yellow);
    run('git stash pop || true');
  }
}

function sync(msg, url) {
  ensureRepo();
  ensureMain();
  ensureRemote(url);
  fixRemoteIfInvalid();

  const stashed = autoStash();

  commit(msg);
  safePull();
  const res = safePush();

  popStash(stashed);

  log('ok', c.green);
  console.log(res);
}

// ===== cli =====
function help() {
  console.log(`
gitx init <repo_url>
gitx sync "msg"
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

    case 'status':
      run('git status -sb');
      break;

    case 'set-remote':
      if (!args[0]) return log('faltando url', c.red);
      run(`git remote set-url origin ${args[0]}`);
      log('remote atualizado', c.green);
      break;

    default:
      help();
  }
}

main();