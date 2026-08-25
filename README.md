# Gitx . Safe Git Helper Synchronization CLI

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/tlipe/gitx-helper-git/blob/main/LICENSE)
[![Contributing](https://img.shields.io/badge/Contributing-Guidelines-orange.svg)](https://github.com/tlipe/gitx-helper-git/blob/main/CONTRIBUTING.md)
[![npm Version](https://img.shields.io/npm/v/gitx.svg?color=brightgreen)](https://www.npmjs.com/package/gitx)
[![Build Status](https://img.shields.io/badge/Build-Passing-success.svg)](https://github.com/tlipe/gitx-helper-git/actions)

Gitx is a lightweight Git synchronization CLI built with JavaScript. It simplifies common repository operations such as committing, fetching, rebasing, pushing, inspecting repository state, creating safety snapshots, and updating Gitx itself.

Gitx is designed around a conservative safety model: routine synchronization never uses force push, conflicts are not resolved automatically, and local work is protected before synchronization.

---

## Features

* **Safe Synchronization** — Commit, fetch, rebase, and push in a single operation.
* **Automatic Safety Snapshot** — Creates a local Git tag before synchronization.
* **Uncommitted Work Protection** — Preserves modified and untracked files using Git stash.
* **Protected Force Push** — Uses `--force-with-lease` and requires explicit confirmation through an environment variable.
* **Repository Diagnostics** — Inspect Git, npm, branch, remote, changes, and conflicts with `doctor`.
* **Operation Cancellation** — Abort active rebase, merge, cherry-pick, or revert operations.
* **Remote Management** — Configure or change the `origin` remote.
* **Local Inspection** — View status, diff, recent commits, and the configured remote.
* **Self Update** — Update Gitx directly from the official GitHub repository.
* **Argument-Safe Git Execution** — Git commands are executed using structured arguments instead of shell command concatenation.

---

## Installation

Install Gitx globally from GitHub via npm:

```bash
npm install -g https://github.com/tlipe/gitx-helper-git.git
```

After installation, the `gitx` command is available system-wide.

---

## Usage

Show all available commands:

```bash
gitx help
```

Or:

```bash
gitx --help
```

Check the installed version:

```bash
gitx --version
```

---

## Synchronization

### Quick Sync

Synchronize the current repository using an automatically generated commit message:

```bash
gitx .
```

The synchronization flow is:

```text
commit → fetch → rebase → push
```

If the remote branch does not exist, Gitx treats the operation as the first push.

### Sync with a Commit Message

```bash
gitx "fix authentication bug"
```

The message is used for the generated Git commit.

### Explicit Sync

```bash
gitx sync "update dependencies"
```

If no message is supplied, Gitx uses `update`:

```bash
gitx sync
```

---

## Push

Push the current branch without running the synchronization workflow:

```bash
gitx push
```

Gitx automatically configures the upstream branch when pushing.

---

## Initialize a Repository

Initialize the current directory as a Git repository and configure `origin`:

```bash
gitx init <repo_url>
```

Example:

```bash
gitx init https://github.com/user/project.git
```

If the repository does not have commits yet, Gitx creates the `main` branch.

You can also initialize without specifying a remote:

```bash
gitx init
```

---

## Remote Management

Show the configured `origin` URL:

```bash
gitx remote
```

Change the `origin` URL:

```bash
gitx set-remote <repo_url>
```

Example:

```bash
gitx set-remote https://github.com/user/project.git
```

---

## Repository Information

Show the current repository state:

```bash
gitx status
```

Show local unstaged changes:

```bash
gitx diff
```

Show the latest commits:

```bash
gitx log
```

Create a local safety snapshot:

```bash
gitx snapshot
```

The snapshot is stored as a Git tag and can be used as a recovery point.

---

## Diagnostics

Run repository diagnostics:

```bash
gitx doctor
```

Gitx reports:

* Git availability
* npm availability
* Repository path
* Current branch
* Current HEAD
* Origin remote
* Modified files
* Untracked files
* Merge conflicts

This is useful when Gitx stops because the repository state is ambiguous or unsafe to modify automatically.

---

## Cancel an Active Git Operation

Abort an active Git operation:

```bash
gitx cancel
```

Gitx can cancel:

```text
rebase
merge
cherry-pick
revert
```

If no cancellable operation is active, Gitx reports that no operation is currently running.

---

## Force Push

Force push is disabled by default.

To intentionally allow a protected force push, set:

### Windows CMD

```cmd
set GITX_ALLOW_FORCE=1
gitx force
```

### PowerShell

```powershell
$env:GITX_ALLOW_FORCE="1"
gitx force
```

Gitx uses:

```bash
git push --force-with-lease
```

instead of:

```bash
git push --force
```

This provides an additional check that the remote branch has not changed unexpectedly.

---

## Update Gitx

Check for a newer Gitx release and update directly from GitHub:

```bash
gitx update
```

Gitx checks the latest GitHub release and installs the repository globally through npm.

---

## Command Reference

| Command                  | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `gitx .`                 | Quick synchronization with automatic commit message |
| `gitx "<message>"`       | Synchronize with a custom commit message            |
| `gitx sync "<message>"`  | Explicit synchronization                            |
| `gitx push`              | Push the current branch                             |
| `gitx init <repo>`       | Initialize repository and configure `origin`        |
| `gitx update`            | Update Gitx from GitHub                             |
| `gitx status`            | Show repository state                               |
| `gitx diff`              | Show local unstaged changes                         |
| `gitx log`               | Show recent commits                                 |
| `gitx remote`            | Show the `origin` URL                               |
| `gitx snapshot`          | Create a local safety snapshot                      |
| `gitx doctor`            | Diagnose repository state                           |
| `gitx cancel`            | Abort an active Git operation                       |
| `gitx set-remote <repo>` | Change the `origin` URL                             |
| `gitx force`             | Protected force push using `--force-with-lease`     |
| `gitx --version`         | Show installed version                              |
| `gitx --help`            | Show help                                           |

---

## Safety Model

Gitx follows a conservative synchronization strategy:

* Never uses `--force` automatically.
* Uses `--force-with-lease` for explicit force pushes.
* Never automatically merges after a failed rebase.
* Never resolves conflicts automatically.
* Creates a safety snapshot before synchronization.
* Preserves uncommitted and untracked files.
* Does not automatically rename existing branches.
* Stops when the repository state is ambiguous.
* Detects active Git operations before modifying the repository.
* Uses argument-safe Git execution.
* Updates directly from the official GitHub repository.

When a rebase encounters a conflict during synchronization, Gitx aborts the rebase instead of attempting automatic conflict resolution. The user's previous local work remains protected through the safety mechanisms.

---

## Requirements

* Node.js `>= 16.x`
* Git installed and available in `PATH`
* npm available in `PATH`

Gitx supports Windows and Unix-like systems.

---

## Documentation

Additional documentation is available in the repository Wiki.

---

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch:

```bash
git checkout -b feature/your-feature
```

3. Make your changes.
4. Commit your changes.
5. Open a pull request.

---

## License

This project is licensed under the MIT License. See [LICENSE](https://github.com/tlipe/gitx-helper-git/blob/main/LICENSE) for details.
