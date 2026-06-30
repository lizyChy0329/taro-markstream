---
name: release-pipeline
description: 手动触发的 npm 包发布流程 — workflow_dispatch 按钮一键发布。Use when the user wants to publish/release a new version, mentions npm publish/version bump/changeset/release/tag/github release, or encounters release failure.
---

# 发布工作流

taro-markstream-vue 使用 **changesets** 管理版本号，通过 GitHub Actions 的 **Publish** workflow（`workflow_dispatch`）手动触发发布。PR merge 到 main 只会跑 CI check（typecheck + build），**不会自动发布**。

## 步骤

### 1. 开发 + 添加 changeset

在 `v1` 分支开发，每项有意义的改动需要附带一个 changeset 文件：

```bash
# 交互式创建
pnpm changeset

# 选择 bump 类型：patch（修复）/ minor（新功能）/ major（破坏性变更）
# 填写变更描述
```

或手动创建 `.changeset/<name>.md`：

```markdown
---
'taro-markstream-vue': minor
---

feat: add RTL text support for paragraph rendering
```

纯 CI/文档/README 改动（无库代码变更）使用空 changeset：

```bash
pnpm changeset --empty
```

**完成标准：** `.changeset/*.md` 文件存在，bump 类型与变更匹配

### 2. 提 PR v1 → main

合并后 CI `check` job 执行 typecheck + build，**不会创建 Version Package PR**。

**完成标准：** CI check 通过

### 3. 手动发布

去 GitHub → Actions → **Publish** → Run workflow → 一键发布。

Workflow 自动执行：

1. `changeset version` — 消费 pending changeset，bump 版本号 + push
2. `pnpm release` — build + `changeset publish` 到 npm（自动创建 git tag）
3. Push tag + 创建 GitHub Release（从 CHANGELOG 取 release notes）

**完成标准：** 检查 npm / GitHub Releases / git tag 三者一致

### 4. 验证

| 检查项 | 命令 |
|--------|------|
| npm 版本 | `npm view taro-markstream-vue version` |
| GitHub Release | `gh release list --json tagName` |
| git tag | `git tag -l \| sort -V` |

---

## 关键文件

| 文件 | 作用 |
|------|------|
| `.github/workflows/ci.yml` | CI — 仅 PR check（typecheck + build） |
| `.github/workflows/publish.yml` | 手动发布 workflow — `workflow_dispatch` 触发 |
| `package.json#scripts.release` | `build && changeset publish` — 必须用 `changeset publish` 而非 `pnpm publish` |
| `.changeset/*.md` | pending changeset，发布时自动消费 |

## Publish workflow 结构

```yaml
name: Publish
on:
  workflow_dispatch: {}
jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v5
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          registry-url: https://registry.npmjs.org
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: |
          pnpm changeset version
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add -A
          git commit -m "chore: version package [skip ci]"
          git push origin main
      - run: pnpm release
        env: { NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }} }
      - run: |
          VERSION=$(node -p "require('./packages/taro-markstream-vue/package.json').version")
          git tag "v$VERSION"
          git push origin "v$VERSION"
      - run: |
          VERSION=$(node -p "require('./packages/taro-markstream-vue/package.json').version")
          gh release create "v$VERSION" --title "v$VERSION" --notes-file packages/taro-markstream-vue/CHANGELOG.md
        env: { GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} }
```

## 陷阱

### 没有创建 git tag

根因是 `release` 脚本用了 `pnpm publish` 而不是 `changeset publish`。`pnpm publish` 不创建 tag，`createGithubReleases` 依赖 tag 存在。**修复：** `release` 脚本必须用 `pnpm changeset publish`。

### PR 不含 changeset → merge 后什么都不发生

没有 pending changeset，Publish workflow 执行时 `changeset version` 无事可做，版本不变。

### 旧分支带来僵尸 changeset

`v1` 分支可能残留之前已经消费过的 `.changeset/*.md`，合并到 main 后导致 changesets 重复计算版本号。**修复：** 合并前确认 `.changeset/` 目录只有本次需要的新 changeset。

### Force push main

会删除版本提交，让 main 退回到旧版本号。**禁止 force push main。**

### NPM_TOKEN 未配置

在 GitHub 仓库 Settings → Secrets and variables → Actions 中必须设置 `NPM_TOKEN`（npm publish 用）。
