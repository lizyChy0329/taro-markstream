---
name: release-pipeline
description: Set up the full npm package release pipeline — npmjs token, GitHub repo config, bumpp versioning, and GitHub Actions CI with auto bump + publish on merge to main. Use when the user wants to configure release automation, set up npm publish CI, or mentions bumpp / auto-versioning.
---

# Release Pipeline

Sets up the full release pipeline for an npm package: from token generation through automated CI bump + publish on merge to main.

Manual steps pause and prompt the user. Say "OK" to proceed to the next step.

## Steps

### 1. Generate npm access token

**Manual.** Ask the user:

> Go to [npmjs.com → Access Tokens](https://www.npmjs.com/settings/~/tokens) and create a **Publish**-scoped token. Copy it and paste it here.

Wait for user input. Store as `NPM_TOKEN`.

Completion criterion: token obtained from user.

### 2. Create GitHub repository

**Manual.** Ask the user:

> Create a new repository on GitHub (or confirm the existing one). What is the full repo URL (e.g. `https://github.com/owner/repo`)?

Wait for user input.

Update the target package's `package.json`:
- `repository.url`
- `homepage`
- `bugs.url`

Completion criterion: repo URL obtained and `package.json` updated.

### 3. Configure NPM_TOKEN in GitHub secrets

**Manual.** Ask the user:

> Go to GitHub repo → Settings → Secrets and variables → Actions. Create a repository secret named `NPM_TOKEN` with the token from step 1.

Wait for user to confirm "OK".

Completion criterion: user confirmed.

### 4. Local build + manual publish (first release)

**Manual.** Ask the user:

> Ready to do the first publish manually? I'll run the build and publish command. Confirm the package version in `package.json` first. Say "OK" to proceed.

On "OK":

```bash
pnpm install --frozen-lockfile
pnpm --filter {{package_name}} build
cd packages/{{package_dir}} && npm publish --registry https://registry.npmjs.org
```

If no tag exists for the current version, create one:

```bash
git tag v$(node -p "require('./packages/{{package_dir}}/package.json').version")
```

Completion criterion: `npm publish` exits 0. If it fails, surface the error and ask user to fix before retrying.

### 5. Install and configure bumpp

**Automatic.** Run:

```bash
pnpm add -D -w bumpp
```

Add to root `package.json` scripts:

```json
"bump:patch": "bumpp --patch --commit \"chore: release v\" --tag --push",
"bump:minor": "bumpp --minor --commit \"chore: release v\" --tag --push",
"bump:major": "bumpp --major --commit \"chore: release v\" --tag --push"
```

Completion criterion: `bumpp` in devDependencies, bump scripts in root `package.json`.

### 6. Configure CI workflow

**Automatic.** Replace `.github/workflows/ci.yml` with:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      bump:
        description: 'Bump type'
        default: 'patch'
        type: choice
        options: [patch, minor, major]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter {{package_name}} build

  publish:
    needs: build
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          registry-url: https://registry.npmjs.org
          cache: pnpm
      - run: pnpm install --frozen-lockfile

      - name: Bump version
        run: |
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            npx bumpp --${{ inputs.bump }} --commit "chore: release v" --tag --push
          else
            npx bumpp --patch --commit "chore: release v" --tag --push
          fi
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - run: pnpm --filter {{package_name}} build
      - run: pnpm --filter {{package_name}} publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Completion criterion: CI workflow updated with bumpp + publish logic.

### 7. Verify

- [ ] `bumpp` installed and bump scripts added to root `package.json`
- [ ] CI publish job bumps version and publishes on push to main
- [ ] `workflow_dispatch` available in GitHub Actions UI for manual minor/major
- [ ] Run `pnpm bump:patch --dry-run` to preview version bump

### Runtime: how to release

- **Merge to main** → CI auto bumps patch + publishes
- **Manual minor/major**: go to GitHub → Actions → CI → Run workflow → select bump type → Run