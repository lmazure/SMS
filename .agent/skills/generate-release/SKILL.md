---
name: generate-release
description: Generate a release for the SMS project.
---

# Generate Release

Generate a release for the SMS project.

## When to use this skill

- Use this when you need to generate a release for the SMS project.

## How to use it

1) If the user has not clearly indicate the release number, ask for it.  
   The release number must be in the format `vX.X.X`.
2) If the user has not clearly indicate the release description, ask for it.
3) Build the documentation.
4) If the documentation has been updated (check with `git status`), then commit it with the message `Update documentation for release vX.X.X`. Otherwise, skip this step.
5) Update the release number in:
    - `README.md` where is described how to declare SMS in Claude Desktop config file;
    - `package.json`;
    - `src/index.ts` where is created the `McpServer` instance.
6) Ask the user for a code review and confirmation.
7) Commit the changes with the message `Update for release vX.X.X`.
8) Push all last commits (using `git push`).
9) Determine the issue branch name (using `git branch --show-current`).
10) Merge (and squash) the issue branch on the `main` branch (using `git switch main`, `git merge --squash <branch>`, `git commit -m "Merge <release description>"`, and `git push`).
11) Tag the release (using `git tag -a vX.X.X -m "Release vX.X.X"`).
12) Push the tag on GitHub (using `git push origin vX.X.X`).

If any step fails, stop the process and ask the user to handle the issue and finish the process.
