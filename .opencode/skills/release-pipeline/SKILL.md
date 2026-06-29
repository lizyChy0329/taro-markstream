---
name: release-pipeline
description: changesets 驱动的 npm 包发布流程。Use when the user wants to publish/release a new version, mentions npm publish/version bump/changeset/release/tag, asks why CI didn't publish, or encounters release failure.
---

# 发布工作流

taro-markstream-vue 使用 **changesets** 管理版本发布。每次合并 PR 到 main 后，changesets/action 自动创建 "Version Package" PR，合并它即触发 npm publish + GitHub Release。

## 步骤

### 1. 开发 + 添加 changeset

在 `v1` 分支开发，每项有意义的改动需要附带一个 changeset 文件：

```bash
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

**完成标准：** `.changeset/*.md` 文件存在，bump 类型与变更匹配

### 2. 提 PR v1 → main

包含 changeset 文件的 PR 合并到 main 后，`changesets/action` 自动：
- 检测 pending changeset
- 创建 "Version Package" PR（bump 版本号 + 生成 CHANGELOG）

**完成标准：** GitHub 上出现新的 "Version Package" PR

### 3. 合并 Version Package PR

合并后 CI `release` job 自动执行：

1. `pnpm --filter taro-markstream-vue build` — 构建 lib
2. `pnpm changeset publish` — 发布到 npm + 创建 git tag
3. `createGithubReleases: true` — 创建 GitHub Release

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
| `.github/workflows/ci.yml` | CI 配置 — check（PR）和 release（push to main）两个 job |
| `package.json#scripts.release` | `build && changeset publish` — 必须用 `changeset publish` 而非 `pnpm publish` |
| `package.json#scripts.changeset` | `changeset` — 创建新 changeset |
| `.changeset/*.md` | pending changeset，合并后自动消费 |

## CI 配置要点

```yaml
release:
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  permissions:
    contents: write           # 必须：创建 tag 和 release
    pull-requests: write      # 必须：创建 Version Package PR
  steps:
    - uses: changesets/action@v1
      with:
        publish: pnpm release
        createGithubReleases: true
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 陷阱

### PR 不含 changeset → 无发布

合并后 `changesets/action` 找不到 pending changeset，跳过所有操作。**修复：** 补 `.changeset/*.md`，重提 PR。

### 合并了 Version Package PR 却没有 tag/Release

根因是 `release` 脚本用了 `pnpm publish` 而不是 `changeset publish`。`pnpm publish` 直接发布到 npm 但不创建 tag，`createGithubReleases` 依赖 tag 存在才能创建 Release。**修复：** `release` 脚本必须用 `pnpm changeset publish`。

### 旧分支带来僵尸 changeset

`v1` 分支可能残留之前已经消费过的 `.changeset/*.md`，合并到 main 后导致 changesets 重复计算版本号。**修复：** 合并前确认 `.changeset/` 目录只有本次需要的新 changeset。

### Force push 回退 main

Force push main 会删除版本提交（version bump + CHANGELOG），让 main 退回到旧版本号。**禁止 force push main。**

### CI release job 因权限失败

`release` job 需要 `permissions: contents: write`（打 tag + 创建 Release）和 `pull-requests: write`（创建 Version Package PR）。缺少则静默跳过。

### NPM_TOKEN 未配置

在 GitHub 仓库 Settings → Secrets and variables → Actions 中必须设置 `NPM_TOKEN`（npm publish 用）和 `GITHUB_TOKEN`（自动注入，无需手动设置）。
