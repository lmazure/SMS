---
name: generate-release
description: Generate a release for the SMS project.
---

# Generate Release

Generate a release for the SMS project.

## When to use this skill

- Use this when you need to generate a release for the SMS project.

## How to use it

1) If the user has not clearly indicate the release numder, ask for it.  
   The release number must be in the format `vX.X.X`.
2) Update the release number in:
    - `README.md` where is describe how to declare SMS in Claude Desktop config file
    - `package.json`
    - `src/index.ts` where is created the `McpServer` instance
3) Ask for a code review and confirmation by the user
4) Push the last commits
5) Merge (and squash) the issue branch on the `main` branch
6) Tag the release:
    ```bash
    git switch main
    git pull
    git tag -a v0.0.4 -m "Release v0.0.4"
    ```
7) Push the tag on GitHub:
    ```bash
    git push origin v0.0.4
    ```
