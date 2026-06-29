# taro-markstream 领域词汇表

## 包

- **taro-markstream-vue** — 核心库包（`packages/taro-markstream-vue/`），Vue 3 流式 Markdown 渲染器，导入路径 `taro-markstream-vue`
- **playground-taro** — Taro 4 演示应用（`playground-taro/`），消费 `taro-markstream-vue`

## Vite+ 任务编排

所有开发命令通过 `vp run`（简写 `vpr`）执行：

- `vpr dev` — 并行 watch lib + playground（微信小程序）
- `vpr build` — 构建 lib（vp pack + CSS 拷贝到 dist/）
- `pnpm --filter taro-markstream-vue typecheck` — 类型检查
- `pnpm --filter playground-taro build:weapp` — 构建 playground

## lib 构建产物

- JS: `dist/vue/index.mjs`（exports 的 `.` 指向此路径）
- Types: `dist/vue/index.d.mts`
- CSS: `dist/index.css`（exports 的 `./index.css` 指向此路径，不会被 tsdown 清理）
- 构建命令：`vp pack && cp src/index.css dist/index.css`

## 已移除

- `tsdown.config.ts` — 已迁移到 `vite.config.ts` 的 `pack` 块
- `dev:h5` / `build:h5` — H5 平台脚本已删除，专属 weapp
