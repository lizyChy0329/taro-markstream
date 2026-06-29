# AGENTS.md
<!-- agents-md-version: 2 -->

## CRITICAL

- MUST: Use `pnpm` (not npm/yarn) for all dependency operations
- MUST: Use `vp run` (or `vpr`) for workspace commands — DO NOT use `pnpm run` for dev workflows
- MUST: Read `package.json` scripts before writing BUILD code
- MUST: Read `exports` field in `packages/taro-markstream-vue/package.json` before modifying package API
- ON FAIL: Check `dist/` exists and CSS is present before debugging playground imports

## 🛑 Strict Boundaries (NEVER DO)

- NEVER: Use `npm` or `yarn` (lockfile is `pnpm-lock.yaml`)
- NEVER: Force push to shared branches
- NEVER: Edit generated files in `dist/` — they are build output
- NEVER: Manually edit `pnpm-lock.yaml`

## Domain & Context

- Goal: Taro 4 流式 Markdown 渲染器 — 面向 AI 聊天场景
- Type: Both (lib + playground app)
- License: MIT
- Key Terms:
  - `taro-markstream-vue`: Vue 3 版渲染库，`packages/taro-markstream-vue/`
  - `playground-taro`: Taro 4 微信小程序演示 app
  - `weapp`: 微信小程序平台（唯一下游 target）
- Domain vocab: `CONTEXT.md`

## Monorepo

- Manager: pnpm workspaces
- Root: Shared devDeps, root scripts for orchestration
- Scope: `pnpm --filter <pkg>` or `vp run --filter <pkg>`

| Type | Path | Stack |
|------|------|-------|
| Library | `packages/taro-markstream-vue/` | Vue 3 + tsdown/viteplus |
| App (weapp) | `playground-taro/` | Taro 4 + Vue 3 + Webpack |

## Commands

```bash
# dev (parallel watch: lib + playground)
vpr dev                            # ON FAIL: run `vpr build` first, then retry
# build lib (JS + CSS, CSS bundled natively by vp pack)
vpr build                          # ON FAIL: check vite.config.ts pack block
# build playground only
vpr build:weapp                    # ON FAIL: check Taro config in playground-taro/config/
# typecheck lib
pnpm --filter taro-markstream-vue typecheck  # ON FAIL: check vue-tsc output for type errors
# publish (CI only)
bump:patch / bump:minor / bump:major  # CI only — never publish from local
```

## Structure

```
packages/taro-markstream-vue/   # Library package
  src/                          # Source code
  dist/                         # Build output (generated — do not edit)
playground-taro/                # WeChat mini-program app
  src/                          # App pages/components
  config/                       # Taro build config
  dist/                         # Build output (generated — do not edit)
test/fixtures/                  # Test fixture markdown files
```

## Patterns

- **Module:** ESM (`"type": "module"` in package.json)
- **Async:** async/await
- **Naming:** kebab-case for files, PascalCase for components, camelCase for functions/vars
- **Import:** Use full package name `taro-markstream-vue` for library imports (no relative cross-package)

## Known Traps

- **@tsdown/css required**: CSS import in entry file requires `@tsdown/css` installed. If CSS build fails with `css-guard` error, run: `pnpm add -D @tsdown/css --filter taro-markstream-vue`
- **Mini-program ModuleNotFoundError**: WeChat runtime doesn't support Node.js `exports` field. Ensure all package CSS imports resolve to actual files on disk, not just export map entries
- **vp pack --watch cleans before build**: `vp pack --watch` always cleans `dist/` before each rebuild. When used in dev alongside webpack (playground), the CSS file briefly disappears, causing `ModuleNotFoundError`. Fix: use `"dev": "vp pack && vp pack --watch"` (initial build first, then watch)
- **vite-plus must be per-package devDep**: Each package using `vite-plus` in its `vite.config.ts` must list `vite-plus` in its own `devDependencies`, even if root has it. vp resolves config imports from the package's own `node_modules`.
