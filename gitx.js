#!/usr/bin/env node

const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');

const gitxRepository = 'https://github.com/tlipe/gitx-helper-git.git';

// ===== colors =====

const c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[37m'
};

function log(message, color = c.reset) {
  console.log(`${color}${message}${c.reset}`);
}

function fail(message, code = 1) {
  log(message, c.red);
  process.exit(code);
}

function warn(message) {
  log(message, c.yellow);
}

function info(message) {
  log(message, c.cyan);
}

function success(message) {
  log(message, c.green);
}

// ===== command helpers =====

function getCommandPath(command) {
  if (process.platform !== 'win32') {
    try {
      return execFileSync('which', [command], {
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf8'
      }).trim() || null;
    } catch {
      return null;
    }
  }

  const candidates = [
    `${command}.cmd`,
    `${command}.exe`,
    command
  ];

  for (const candidate of candidates) {
    try {
      const output = execFileSync(
        'where.exe',
        [candidate],
        {
          stdio: ['ignore', 'pipe', 'ignore'],
          encoding: 'utf8'
        }
      ).trim();

      const result = output
        .split(/\r?\n/)
        .map(value => value.trim())
        .find(Boolean);

      if (result) {
        return result;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function commandExists(command) {
  return !!getCommandPath(command);
}

function getNpmPath() {
  if (process.platform === 'win32') {
    const npmPath = getCommandPath('npm');

    if (!npmPath) {
      fail(
        'npm could not be found.\n' +
        'Run "where npm" and "where npm.cmd" in CMD to diagnose the PATH.'
      );
    }

    return npmPath;
  }

  const npmPath = getCommandPath('npm');

  if (!npmPath) {
    fail(
      'npm could not be found in PATH.'
    );
  }

  return npmPath;
}

function npm(args, options = {}) {
  const {
    silent = false,
    allowFailure = false
  } = options;

  try {
    const result = execFileSync(
      process.platform === 'win32'
        ? 'npm.cmd'
        : 'npm',
      args,
      {
        stdio: silent
          ? ['ignore', 'pipe', 'pipe']
          : 'inherit',
        encoding: 'utf8',
        windowsHide: false,
        shell: process.platform === 'win32'
      }
    );

    return typeof result === 'string'
      ? result.trim()
      : '';
  } catch (error) {
    if (allowFailure) {
      return '';
    }

    const stderr = error.stderr?.toString().trim();
    const stdout = error.stdout?.toString().trim();

    if (stderr) {
      log(stderr, c.red);
    } else if (stdout) {
      log(stdout, c.red);
    } else {
      log(error.message, c.red);
    }

    process.exit(1);
  }
}

function git(args, options = {}) {
  const {
    silent = false,
    allowFailure = false
  } = options;

  try {
    return execFileSync(
      'git',
      args,
      {
        stdio: silent
          ? ['ignore', 'pipe', 'pipe']
          : 'inherit',
        encoding: 'utf8'
      }
    ).trim();
  } catch (error) {
    if (allowFailure) {
      return '';
    }

    const stderr = error.stderr?.toString().trim();
    const stdout = error.stdout?.toString().trim();

    if (stderr) {
      log(stderr, c.red);
    } else if (stdout) {
      log(stdout, c.red);
    } else {
      log(error.message, c.red);
    }

    process.exit(1);
  }
}

function gitRead(args) {
  return git(args, {
    silent: true,
    allowFailure: true
  });
}

function ensureGit() {
  if (!commandExists('git')) {
    fail('git is not installed or is not available in PATH.');
  }
}

function ensureNpm() {
  getNpmPath();
}

// ===== repository =====

function isGitRepository() {
  return gitRead([
    'rev-parse',
    '--is-inside-work-tree'
  ]) === 'true';
}

function ensureRepository() {
  ensureGit();

  if (!isGitRepository()) {
    fail('Not inside a Git repository.');
  }
}

function repositoryRoot() {
  return gitRead([
    'rev-parse',
    '--show-toplevel'
  ]);
}

function currentBranch() {
  return gitRead([
    'branch',
    '--show-current'
  ]);
}

function currentCommit() {
  return gitRead([
    'rev-parse',
    'HEAD'
  ]);
}

function hasHead() {
  return !!gitRead([
    'rev-parse',
    '--verify',
    'HEAD'
  ]);
}

function isDetachedHead() {
  return !currentBranch();
}

function hasRemote(name = 'origin') {
  return !!gitRead([
    'remote',
    'get-url',
    name
  ]);
}

function remoteUrl(name = 'origin') {
  return gitRead([
    'remote',
    'get-url',
    name
  ]);
}

function remoteBranchExists(branch, remote = 'origin') {
  return !!gitRead([
    'show-ref',
    '--verify',
    `refs/remotes/${remote}/${branch}`
  ]);
}

// ===== working tree =====

function hasChanges() {
  return !!gitRead([
    'status',
    '--porcelain=v2'
  ]);
}

function hasUntrackedFiles() {
  const output = gitRead([
    'status',
    '--porcelain=v2'
  ]);

  return output
    .split('\n')
    .some(line => line.startsWith('?'));
}

function hasMergeConflict() {
  const output = gitRead([
    'status',
    '--porcelain=v2'
  ]);

  return output
    .split('\n')
    .some(line => line.startsWith('u '));
}

function ensureNoOperationInProgress() {
  const gitDir = gitRead([
    'rev-parse',
    '--git-dir'
  ]);

  if (!gitDir) {
    return;
  }

  const operations = [
    ['rebase-merge', 'rebase'],
    ['rebase-apply', 'rebase'],
    ['MERGE_HEAD', 'merge'],
    ['CHERRY_PICK_HEAD', 'cherry-pick'],
    ['REVERT_HEAD', 'revert']
  ];

  for (const [file, operation] of operations) {
    if (fs.existsSync(path.join(gitDir, file))) {
      fail(
        `A ${operation} operation is already in progress. ` +
        `Resolve it or run "gitx cancel".`
      );
    }
  }
}

// ===== remote =====

function validateRemoteUrl(url) {
  if (!url) {
    return false;
  }

  if (url.startsWith('git@')) {
    return /^git@[^:]+:[^/]+\/.+$/.test(url);
  }

  try {
    const parsed = new URL(url);

    return (
      parsed.protocol === 'https:' ||
      parsed.protocol === 'http:' ||
      parsed.protocol === 'ssh:'
    );
  } catch {
    return false;
  }
}

function ensureRemote(url) {
  if (hasRemote()) {
    return;
  }

  if (!url) {
    fail(
      'No origin remote configured. ' +
      'Use: gitx init <repo_url>'
    );
  }

  if (!validateRemoteUrl(url)) {
    fail('Invalid repository URL.');
  }

  info(`Adding origin: ${url}`);

  git([
    'remote',
    'add',
    'origin',
    url
  ]);
}

function fixRemoteIfInvalid() {
  const url = remoteUrl();

  if (!url) {
    return;
  }

  if (url.includes('/tree/')) {
    const clean = url.split('/tree/')[0];

    warn('Invalid repository URL detected.');
    warn('Remote contains "/tree/".');

    git([
      'remote',
      'set-url',
      'origin',
      clean
    ]);

    success(`Remote normalized: ${clean}`);
  }
}

// ===== branch =====

function ensureBranch() {
  if (!hasHead()) {
    info('Repository has no commits.');

    git([
      'checkout',
      '-b',
      'main'
    ]);

    return 'main';
  }

  const branch = currentBranch();

  if (!branch) {
    fail(
      'Detached HEAD detected. ' +
      'gitx will not modify a detached HEAD automatically.'
    );
  }

  return branch;
}

// ===== snapshots =====

function snapshotName(prefix = 'gitx-safety') {
  const now = new Date();

  const timestamp = now
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);

  return `${prefix}-${timestamp}`;
}

function tagExists(tag) {
  return !!gitRead([
    'rev-parse',
    '--verify',
    `refs/tags/${tag}`
  ]);
}

function createSafetySnapshot() {
  if (!hasHead()) {
    return null;
  }

  let tag = snapshotName();
  let index = 1;

  while (tagExists(tag)) {
    tag = `${snapshotName()}-${index++}`;
  }

  git([
    'tag',
    tag,
    'HEAD'
  ]);

  success(`Safety snapshot created: ${tag}`);

  return tag;
}

// ===== stash =====

function createStash() {
  if (!hasChanges()) {
    return null;
  }

  const message = `gitx-safety-${Date.now()}`;

  info('Saving uncommitted work before synchronization...');

  git([
    'stash',
    'push',
    '--include-untracked',
    '--message',
    message
  ]);

  const stash = gitRead([
    'stash',
    'list',
    '--format=%gd',
    '-1'
  ]);

  if (!stash) {
    fail(
      'gitx could not verify the safety stash. ' +
      'Synchronization stopped.'
    );
  }

  success(`Work safely stored in ${stash}`);

  return stash;
}

function restoreStash(stash) {
  if (!stash) {
    return;
  }

  info(`Restoring ${stash}...`);

  git([
    'stash',
    'pop',
    stash
  ]);

  if (hasMergeConflict()) {
    warn(
      'Stash restoration produced conflicts. ' +
      'The stash was not discarded.'
    );

    fail(
      'Resolve the conflicts manually. ' +
      'Your previous work remains protected in the stash.'
    );
  }

  success('Local work restored.');
}

// ===== commits =====

function stageAll() {
  git([
    'add',
    '--all'
  ]);
}

function commit(message) {
  if (!hasChanges()) {
    return false;
  }

  if (!message.trim()) {
    message = 'update';
  }

  stageAll();

  info('Creating commit...');

  git([
    'commit',
    '-m',
    message
  ]);

  return true;
}

// ===== synchronization =====

function fetchRemote() {
  info('Fetching remote state...');

  git([
    'fetch',
    '--prune',
    'origin'
  ]);
}

function rebaseOntoRemote(branch) {
  if (!remoteBranchExists(branch)) {
    return;
  }

  info(`Rebasing "${branch}" onto "origin/${branch}"...`);

  try {
    git([
      'rebase',
      `origin/${branch}`
    ]);
  } catch {
    warn('Rebase stopped because Git detected a conflict.');

    git([
      'rebase',
      '--abort'
    ]);

    fail(
      'Synchronization stopped safely. ' +
      'No automatic merge or conflict resolution was attempted.'
    );
  }
}

function push(branch, force = false) {
  info(`Pushing "${branch}"...`);

  const args = [
    'push',
    '--set-upstream',
    'origin',
    branch
  ];

  if (force) {
    args.splice(1, 0, '--force-with-lease');
  }

  git(args);
}

function sync(message) {
  ensureRepository();
  ensureNoOperationInProgress();

  const branch = ensureBranch();

  if (!hasRemote()) {
    fail(
      'No origin remote configured. ' +
      'Use: gitx init <repo_url>'
    );
  }

  fixRemoteIfInvalid();

  const safetyTag = createSafetySnapshot();
  const stash = createStash();

  try {
    commit(message);

    fetchRemote();

    if (remoteBranchExists(branch)) {
      rebaseOntoRemote(branch);
    } else {
      info(
        `No remote branch named "origin/${branch}". ` +
        'This will be treated as the first push.'
      );
    }

    push(branch);

    success('Synchronization completed safely.');
  } catch {
    warn('Synchronization stopped.');

    if (safetyTag) {
      warn(`Safety snapshot remains available: ${safetyTag}`);
    }

    process.exitCode = 1;
  } finally {
    if (stash) {
      restoreStash(stash);
    }
  }
}

// ===== force =====

function confirmForce() {
  if (process.env.GITX_ALLOW_FORCE !== '1') {
    fail(
      'Force push is disabled by default.\n' +
      'If you intentionally want to rewrite remote history, set:\n' +
      'GITX_ALLOW_FORCE=1\n' +
      'and run "gitx force" again.'
    );
  }
}

function forcePush() {
  ensureRepository();
  ensureNoOperationInProgress();

  const branch = ensureBranch();

  if (!hasRemote()) {
    fail('No origin remote configured.');
  }

  const safetyTag = createSafetySnapshot();

  confirmForce();

  warn(
    `This will rewrite origin/${branch} if the remote still matches ` +
    'your last known state.'
  );

  warn('gitx uses --force-with-lease instead of --force.');

  push(branch, true);

  success('Protected force push completed.');

  if (safetyTag) {
    info(`Local safety snapshot: ${safetyTag}`);
  }
}

// ===== update =====

function getInstalledGitxVersion() {
  const output = npm([
    'list',
    '--global',
    'gitx',
    '--depth=0',
    '--json'
  ], {
    silent: true,
    allowFailure: true
  });

  if (!output) {
    return '';
  }

  try {
    const data = JSON.parse(output);

    return data.dependencies?.gitx?.version || '';
  } catch {
    return '';
  }
}

function update() {
  const currentVersion = pkg.version;

  info(`Current version: ${currentVersion}`);
  info('Updating gitx directly from GitHub...');

  npm([
    'install',
    '--global',
    gitxRepository
  ]);

  const installedVersion = getInstalledGitxVersion();

  if (!installedVersion) {
    fail(
      'gitx was installed, but the installed version could not be verified.'
    );
  }

  if (installedVersion === currentVersion) {
    success(`gitx is already up to date (${installedVersion}).`);
    return;
  }

  success(
    `gitx updated: ${currentVersion} -> ${installedVersion}`
  );
}

// ===== diagnostics =====

function doctor() {
  ensureRepository();

  const root = repositoryRoot();
  const branch = currentBranch();
  const remote = remoteUrl();

  console.log('');
  log('gitx doctor', c.white);
  console.log('');

  console.log(`Git:        ${commandExists('git') ? 'OK' : 'MISSING'}`);
  console.log(`npm:        ${commandExists('npm') ? 'OK' : 'MISSING'}`);
  console.log(`Repository: ${root || 'INVALID'}`);
  console.log(`Branch:     ${branch || 'DETACHED'}`);
  console.log(
    `HEAD:       ${hasHead() ? currentCommit().slice(0, 12) : 'EMPTY'}`
  );
  console.log(`Origin:     ${remote || 'NOT CONFIGURED'}`);
  console.log(`Changes:    ${hasChanges() ? 'YES' : 'NO'}`);
  console.log(`Untracked:  ${hasUntrackedFiles() ? 'YES' : 'NO'}`);
  console.log(`Conflicts:  ${hasMergeConflict() ? 'YES' : 'NO'}`);

  console.log('');

  if (hasMergeConflict()) {
    warn('Repository contains unresolved conflicts.');
    return;
  }

  if (isDetachedHead()) {
    warn('Repository is in detached HEAD state.');
    return;
  }

  if (!remote) {
    warn('No origin remote is configured.');
    return;
  }

  success('Repository diagnostics completed.');
}

// ===== information =====

function showStatus() {
  ensureRepository();

  const branch = currentBranch();
  const remote = remoteUrl();

  console.log('');

  log(`Repository: ${repositoryRoot()}`, c.white);
  log(`Branch: ${branch || 'detached HEAD'}`, c.white);
  log(`Remote: ${remote || 'none'}`, c.white);

  console.log('');

  const output = gitRead([
    'status',
    '--short',
    '--branch'
  ]);

  console.log(output || 'Working tree clean.');
}

function showDiff() {
  ensureRepository();

  git([
    'diff',
    '--'
  ]);
}

function showLog() {
  ensureRepository();

  git([
    'log',
    '--oneline',
    '--decorate',
    '-20'
  ]);
}

function showRemote() {
  ensureRepository();

  const url = remoteUrl();

  if (!url) {
    fail('No origin remote configured.');
  }

  console.log(url);
}

function snapshot() {
  ensureRepository();

  if (!hasHead()) {
    fail('Cannot create a snapshot before the first commit.');
  }

  createSafetySnapshot();
}

// ===== cancel =====

function cancel() {
  ensureRepository();

  const gitDir = gitRead([
    'rev-parse',
    '--git-dir'
  ]);

  if (
    fs.existsSync(path.join(gitDir, 'rebase-merge')) ||
    fs.existsSync(path.join(gitDir, 'rebase-apply'))
  ) {
    git([
      'rebase',
      '--abort'
    ]);

    success('Rebase cancelled.');
    return;
  }

  if (fs.existsSync(path.join(gitDir, 'MERGE_HEAD'))) {
    git([
      'merge',
      '--abort'
    ]);

    success('Merge cancelled.');
    return;
  }

  if (fs.existsSync(path.join(gitDir, 'CHERRY_PICK_HEAD'))) {
    git([
      'cherry-pick',
      '--abort'
    ]);

    success('Cherry-pick cancelled.');
    return;
  }

  if (fs.existsSync(path.join(gitDir, 'REVERT_HEAD'))) {
    git([
      'revert',
      '--abort'
    ]);

    success('Revert cancelled.');
    return;
  }

  info('No cancellable Git operation is currently running.');
}

// ===== init =====

function init(url) {
  ensureGit();

  if (!isGitRepository()) {
    info('Initializing Git repository...');

    git([
      'init'
    ]);
  }

  ensureRepository();

  if (!hasHead()) {
    info('Creating main branch...');

    git([
      'checkout',
      '-b',
      'main'
    ]);
  }

  if (url) {
    if (!validateRemoteUrl(url)) {
      fail('Invalid repository URL.');
    }

    if (hasRemote()) {
      const current = remoteUrl();

      if (current !== url) {
        warn(`origin already exists: ${current}`);
        info(`Use "gitx set-remote ${url}" to change it.`);
      }
    } else {
      ensureRemote(url);
    }
  }

  fixRemoteIfInvalid();

  success('Repository initialized.');
}

// ===== remote configuration =====

function setRemote(url) {
  ensureRepository();

  if (!url) {
    fail('Missing repository URL.');
  }

  if (!validateRemoteUrl(url)) {
    fail('Invalid repository URL.');
  }

  if (!hasRemote()) {
    git([
      'remote',
      'add',
      'origin',
      url
    ]);

    success('origin remote added.');
    return;
  }

  const current = remoteUrl();

  if (current === url) {
    info('Remote is already configured with this URL.');
    return;
  }

  warn(`Current remote: ${current}`);
  warn(`New remote:     ${url}`);

  git([
    'remote',
    'set-url',
    'origin',
    url
  ]);

  success('origin remote updated.');
}

// ===== cli =====

function help() {
  console.log(`
gitx - safe Git synchronization CLI

Usage:
  gitx init <repo_url>
  gitx sync "message"
  gitx update
  gitx status
  gitx diff
  gitx log
  gitx remote
  gitx snapshot
  gitx doctor
  gitx cancel
  gitx set-remote <repo_url>
  gitx force

Information:
  gitx --version
  gitx --help
  gitx help

Commands:
  init          Initialize repository and configure origin
  sync          Safely commit, fetch, rebase and push
  update        Update gitx directly from GitHub
  status        Show repository state
  diff          Show local unstaged changes
  log           Show recent commits
  remote        Show origin URL
  snapshot      Create a local safety snapshot
  doctor        Diagnose repository state
  cancel        Abort an active Git operation
  set-remote    Change origin URL
  force         Protected force push using --force-with-lease

Safety model:
  - Never uses --force automatically
  - Never automatically merges after a failed rebase
  - Never resolves conflicts automatically
  - Creates a safety snapshot before synchronization
  - Preserves uncommitted and untracked files
  - Does not rename existing branches automatically
  - Stops when repository state is ambiguous
  - Uses argument-safe Git execution
  - Updates gitx directly from the official GitHub repository
`);
}

function unknownCommand(command) {
  log(`Unknown command: ${command}`, c.red);
  console.log('Run "gitx --help" to see available commands.');
  process.exitCode = 1;
}

function main() {
  const [, , command, ...args] = process.argv;

  if (
    command === '--version' ||
    command === '-v'
  ) {
    console.log(pkg.version);
    return;
  }

  if (
    !command ||
    command === '--help' ||
    command === '-h' ||
    command === 'help'
  ) {
    help();
    return;
  }

  try {
    switch (command) {
      case 'init':
        init(args[0]);
        break;

      case 'sync':
        sync(args.join(' ') || 'update');
        break;

      case 'update':
        update();
        break;

      case 'force':
        forcePush();
        break;

      case 'status':
        showStatus();
        break;

      case 'diff':
        showDiff();
        break;

      case 'log':
        showLog();
        break;

      case 'remote':
        showRemote();
        break;

      case 'snapshot':
        snapshot();
        break;

      case 'doctor':
        doctor();
        break;

      case 'cancel':
        cancel();
        break;

      case 'set-remote':
        setRemote(args[0]);
        break;

      default:
        unknownCommand(command);
    }
  } catch {
    process.exitCode = 1;
  }
}

main();
