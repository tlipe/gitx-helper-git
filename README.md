# Gitx — Helper Git

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/tlipe/gitx-helper-git/blob/main/LICENSE)
[![npm Version](https://img.shields.io/npm/v/gitx.svg?color=brightgreen)](https://www.npmjs.com/package/gitx)
[![Build Status](https://img.shields.io/badge/Build-Passing-success.svg)](https://github.com/tlipe/gitx-helper-git/actions)

**Gitx** is a lightweight **Git helper tool** built with JavaScript that streamlines everyday repository tasks. It simplifies pushing, pulling, and syncing projects, reducing repetitive commands and making Git workflows more efficient.

---

## Why Gitx?

Gitx streamlines the most failure-prone parts of a typical Git workflow by collapsing commit, pull (with rebase), conflict handling, and push into a single deterministic operation. Instead of manually sequencing multiple commands and interpreting Git's often ambiguous errors, it enforces a consistent execution path with automatic fallbacks (rebase → autostash → merge). This reduces cognitive overhead and eliminates repetitive decision points.

In terms of speed, it minimizes round-trips between failed pushes and corrective pulls. A rejected push is immediately handled through synchronization logic, avoiding the common trial-and-error cycle. Automatic staging, commit execution, and conditional pulling reduce command count and context switching, which materially accelerates iteration, especially in active repositories with frequent upstream changes.

From a safety perspective, Gitx avoids destructive operations by default. It prioritizes non-invasive strategies (rebase and merge) and only exposes force push as an explicit, separate command. Temporary state is preserved via controlled stashing, and conflicts are surfaced early when they require manual resolution. This ensures that automation does not obscure risk, while still removing the majority of routine failure cases.

---

## Features

- **Quick Initialization**: Set up a repository with `gitx init <repo_url>`
- **Seamless Sync**: Commit and push changes with `gitx sync "msg"`
- **Force Push**: Resolve conflicts with `gitx force`
- **Status Check**: View repository status with `gitx status`
- **Remote Management**: Configure or update remotes with `gitx set-remote <repo_url>`
- **Diff & Log**: Inspect changes and history with `gitx diff` and `gitx log`
- **Snapshots**: Create quick snapshots with `gitx snapshot`
- **Doctor**: Run diagnostics with `gitx doctor`
- **Cancel Operations**: Abort ongoing operations with `gitx cancel`

---

## Installation

Install Gitx globally via npm:

```bash
npm install -g gitx
```

Or install directly from GitHub:

```bash
npm install -g https://github.com/tlipe/gitx-helper-git.git
```

This makes the `gitx` command available system-wide.

---

## Requirements

- **Node.js** (>= 16.x)
- **Git** installed and configured

---

## Usage

### Explore Commands

To see all available commands:

```bash
gitx help
```

### Essential Commands

| Command | Description |
|---------|-------------|
| `gitx init <repo_url>` | Initialize a new Git repository with remote |
| `gitx sync "message"` | Stage, commit, pull (rebase), and push |
| `gitx push` or `gitx .` | Push current changes |
| `gitx force` | Force push to resolve conflicts |
| `gitx status` | Show repository status |
| `gitx diff` | Show differences |
| `gitx log` | Show commit history |
| `gitx remote` | List remotes |
| `gitx set-remote <repo_url>` | Set or update remote URL |
| `gitx snapshot` | Create a snapshot |
| `gitx doctor` | Run diagnostics |
| `gitx cancel` | Cancel ongoing operations |
| `gitx update` | Update gitx |

### Examples

```bash
# Initialize a new repository
gitx init https://github.com/username/repo.git

# Sync your work (stage, commit, pull, push)
gitx sync "feat: add new feature"

# Quick push
gitx push

# Check status
gitx status

# Set a remote
gitx set-remote https://github.com/username/new-repo.git
```

---

## Documentation

Comprehensive documentation is available in the [Wiki](https://github.com/tlipe/gitx-helper-git/wiki).

---

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a pull request

See the [Contribution Guidelines](https://github.com/tlipe/gitx-helper-git/blob/main/CONTRIBUTING.md) for more details.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Version

Current version: **1.0.8**
