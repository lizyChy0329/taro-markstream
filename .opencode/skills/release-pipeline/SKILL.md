---
name: release-pipeline
description: Set up the full npm package release pipeline — npmjs token, GitHub repo config, standard-version, and GitHub Actions CI with tag-based publish. Use when the user wants to configure release automation, set up npm publish CI, or mentions standard-version / tag-based publish.
---

# Release Pipeline

Sets up the full release pipeline for an npm package: from token generation through automated CI publish on tag.

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

Set `gh_repo` for subsequent steps.

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

Completion criterion: `npm publish` exits 0. If it fails, surface the error and ask user to fix before retrying.

### 5. Install and configure standard-version

**Automatic.** Run:

```bash
pnpm --filter root -D add standard-version
```

Add to root `package.json` scripts:

```json
"release": "standard-version",
"postrelease": "git push --follow-tags origin main"
```

Add `.versionrc` to root:

```json
{
  "bumpFiles": [
    "package.json",
    "packages/{{package_dir}}/package.json"
  ]
}
```

Completion criterion: `standard-version` in devDependencies, release scripts in root `package.json`, `.versionrc` created.

### 6. Switch CI to tag-based publish

**Automatic.** Update `.github/workflows/ci.yml`:

Change publish job `if` condition to:

```yaml
publish:
  if: startsWith(github.ref, 'refs/tags/v')
```

Add a version-check step:

```yaml
      - run: |
          # Verify tag matches package version
          TAG_VERSION=${GITHUB_REF_NAME#v}
          PKG_VERSION=$(node -p "require('./packages/{{package_dir}}/package.json').version")
          if [ "$TAG_VERSION" != "$PKG_VERSION" ]; then
            echo "Tag v$TAG_VERSION does not match package version $PKG_VERSION"
            exit 1
          fi
```

Remove `if: github.ref == 'refs/heads/main' && github.event_name == 'push'` from publish job.

Completion criterion: CI workflow updated and version validation in place.

### 7. Verify

- [ ] `standard-version` installed and scripts added to root `package.json`
- [ ] `.versionrc` created at repo root
- [ ] CI publish job triggers on tag push only
- [ ] CI publish job validates tag matches package version
- [ ] Run `pnpm release --dry-run` to preview version bump