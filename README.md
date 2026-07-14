# Gitx — Helper Git
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/tlipe/gitx-helper-git/blob/main/LICENSE)
[![Contributing](https://img.shields.io/badge/Contributing-Guidelines-orange.svg)](https://github.com/tlipe/gitx-helper-git/blob/main/CONTRIBUTING.md)
[![npm Version](https://img.shields.io/npm/v/gitx.svg?color=brightgreen)](https://www.npmjs.com/package/gitx)
[![Build Status](https://img.shields.io/badge/Build-Passing-success.svg)](https://github.com/tlipe/gitx-helper-git/actions)

Gitx is a lightweight **Git helper tool** built with JavaScript that streamlines everyday repository tasks. It simplifies pushing, pulling, and syncing projects, reducing repetitive commands and making Git workflows more efficient.

---

Gitx streamlines the most failure-prone parts of a typical Git workflow by collapsing commit, pull (with rebase), conflict handling, and push into a single deterministic operation. Instead of manually sequencing multiple commands and interpreting Git’s often ambiguous errors, it enforces a consistent execution path with automatic fallbacks (rebase → autostash → merge). This reduces cognitive overhead and eliminates repetitive decision points.

In terms of speed, it minimizes round-trips between failed pushes and corrective pulls. A rejected push is immediately handled through synchronization logic, avoiding the common trial-and-error cycle. Automatic staging, commit execution, and conditional pulling reduce command count and context switching, which materially accelerates iteration, especially in active repositories with frequent upstream changes.

From a safety perspective, Gitx avoids destructive operations by default. It prioritizes non-invasive strategies (rebase and merge) and only exposes force push as an explicit, separate command. Temporary state is preserved via controlled stashing, and conflicts are surfaced early when they require manual resolution. This ensures that automation does not obscure risk, while still removing the majority of routine failure cases.

---

## Features

- **Quick Initialization**: Set up a repository with `gitx init <repo_url>`.  
- **Seamless Sync**: Commit and push changes with `gitx sync "msg"`.  
- **Force Push**: Resolve conflicts with `gitx force`.  
- **Status Check**: View repository status with `gitx status`.  
- **Remote Management**: Configure or update remotes with `gitx set-remote <repo_url>`.  

---

## Installation

Install Gitx globally via npm:

```bash
npm install -g https://github.com/tlipe/gitx-helper-git
```

This makes the `gitx` command available system-wide.

---

## Usage

To explore available commands:

```bash
gitx help
```

Essential commands:

```bash
gitx init <repo_url>
gitx sync "your commit message"
gitx force
gitx status
gitx set-remote <repo_url>
```

---

## Requirements

- Node.js (>= 16.x)  
- Git installed and configured  

---

## Documentation

Comprehensive documentation is available in the Wiki.

---

## Contributing

Contributions are welcome:  
- Fork the repository  
- Create a new branch (`feature/your-feature`)  
- Commit your changes  
- Open a pull request  

See the Contribution Guidelines.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
