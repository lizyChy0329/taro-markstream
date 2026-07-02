# taro-markstream-vue

> 基于 Simon-He95 的 [markstream-vue](https://github.com/Simon-He95/markstream-vue) 感谢！

Taro 4 流式 Markdown 渲染器 — 面向 AI 聊天场景的 Vue 3 组件库


## 安装

```bash
pnpm add taro-markstream-vue
```

确保 peer 依赖已安装：

```bash
pnpm add vue@^3 @tarojs/components@^4 @tarojs/taro@^4
```

## 快速上手

```vue
<script setup lang="ts">
import { MarkdownRender, useSmoothMarkdownStream } from 'taro-markstream-vue'
import 'taro-markstream-vue/index.css'

const { visible, final, enqueue, finish } = useSmoothMarkdownStream()

// AI 流式返回时
enqueue(chunk)
// 流结束时
finish()
</script>

<template>
  <MarkdownRender :content="visible" :final="final" />
</template>
```

## 指南

### 基础渲染

```vue
<script setup lang="ts">
import { MarkdownRender } from 'taro-markstream-vue'
import 'taro-markstream-vue/index.css'

const md = `# Hello
**粗体** *斜体* ~~删除线~~
- 列表项 1
- 列表项 2`
</script>

<template>
  <MarkdownRender :content="md" :final="true" />
</template>
```

### 流式打字效果

```vue
<script setup lang="ts">
import { MarkdownRender, useSmoothMarkdownStream } from 'taro-markstream-vue'
import 'taro-markstream-vue/index.css'

const { visible, final, enqueue, finish } = useSmoothMarkdownStream({
  minCharsPerSecond: 30,
  maxCharsPerSecond: 200,
})

function onChunk(chunk: string) { enqueue(chunk) }
function onDone() { finish() }
</script>

<template>
  <MarkdownRender :content="visible" :final="final" />
</template>
```

### 事件处理

```vue
<script setup lang="ts">
import Taro from '@tarojs/taro'
import { MarkdownRender } from 'taro-markstream-vue'

const onLink = (e: { href: string }) => Taro.setClipboardData({ data: e.href })
const onImage = (e: { src: string }) => Taro.previewImage({ urls: [e.src] })
</script>

<template>
  <MarkdownRender
    content="# Hello"
    :final="true"
    @link-click="onLink"
    @image-click="onImage"
  />
</template>
```

## API

### MarkdownRender

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `content` | `string` | `''` | Markdown 原文 |
| `final` | `boolean` | `false` | 关闭流式容错模式；与 `useSmoothMarkdownStream` 的 `final` 配合 |

| 事件 | 载荷 | 说明 |
|------|------|------|
| `@link-click` | `{ href: string }` | 用户点击链接 |
| `@image-click` | `{ src: string }` | 用户点击图片 |

### useSmoothMarkdownStream

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `minCharsPerSecond` | `number` | `30` | 最小打字速度 |
| `maxCharsPerSecond` | `number` | `200` | 最大打字速度 |
| `targetLatencyMs` | `number` | `900` | 目标响应延迟，越小越快 |
| `catchUpLatencyMs` | `number` | `350` | 追赶模式延迟 |
| `catchUpThreshold` | `number` | `600` | 触发放大追赶的待输出字符数 |
| `startDelayMs` | `number` | `80` | 首次输出前静默时间 |
| `maxCharsPerCommit` | `number` | `80` | 单次调度最多吐出的字符 |
| `maxCommitFps` | `number` | `30` | 调度帧率上限 |
| `flushOnFinish` | `boolean` | `false` | finish 时立即吐完所有 |

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `visible` | `Ref<string>` | 当前已输出文本 → `:content` |
| `final` | `ComputedRef<boolean>` | `done && caughtUp` → `:final` |
| `source` | `Ref<string>` | 已入队全部原文 |
| `done` | `Ref<boolean>` | 是否已 finish |
| `caughtUp` | `ComputedRef<boolean>` | 是否追上入队速度 |
| `pendingChars` | `ComputedRef<number>` | 待输出字符数 |
| `enqueue(chunk)` | `(s: string) => void` | 入队文本段 |
| `finish(opts?)` | `(opts?: { flush?: boolean }) => void` | 标记流结束 |
| `flush()` | `() => void` | 立即吐出所有 |
| `reset(init?)` | `(s?: string) => void` | 重置，可设初始文本 |
| `pause()` | `() => void` | 暂停 |
| `resume()` | `() => void` | 恢复 |

### 类型导出

```ts
import type { MarkdownRenderProps, ParsedNode } from 'taro-markstream-vue'
import type { SmoothMarkdownStreamOptions, SmoothMarkdownStreamController } from 'taro-markstream-vue'
```

## 特性

### ✅ 基础 Markdown

| 语法 | 渲染效果 |
|------|----------|
| `#` ~ `######` 标题 | 粗体放大 |
| `**粗体**` / `*斜体*` | 样式化 |
| `~~删除线~~` | 贯穿线 |
| `` `行内代码` `` | 灰底等宽 |
| `[链接](url)` | 蓝色下划线 + `@link-click` |
| `![图片](src)` | `<image>` + `@image-click` |
| `` ```language `` | 深色背景 + 语法高亮 |
| `> 引用` | 蓝色左边框 |
| `-` / `1.` 列表 | 带序标号 |
| `---` 分割线 | 灰色横线 |
| `\| 表格 \|` | flex 布局 |
| `<br>` / HTML | 原文输出 |

### ✅ 扩展语法

| 语法 | 渲染效果 |
|------|----------|
| `==高亮==` | 黄色背景 |
| `<ins>` / `++插入++` | 下划线 |
| `<sub>` / `~下标~` | 下标 |
| `<sup>` / `^上标^` | 上标 |
| `- [x]` 任务列表 | checkbox + 文本 |
| `:smile:` Emoji | 原码显示 |
| `::: warning` 警告块 | 按 kind 着色 |
| 定义列表 `术语 : 描述` | 粗体 + 缩进 |
| `[^1]` 脚注 | 锚点 + ↩ 返回 |
| `diff language` 代码块 | 绿色 `+` / 红色 `-` |
| `<thinking>` | 灰底虚线容器 |
| 阿拉伯语 RTL | 自动从右到左 |
| 嵌套列表 | 递归缩进 |

### ⬜ 平台限制

| 语法 | 原因 |
|------|------|
| `$E=mc^2$` 数学公式 | 需 KaTeX DOM |
| `` ```mermaid `` | 需 SVG + Web Worker |
| `` ```infographic `` / `` ```d2 `` | 需 DOM + SVG |
| `` ```svg `` | 小程序无 SVG 支持 |

## 常见问题

### rich-text 为什么不行？

微信小程序编译期静态分析组件调用生成 `base.wxml`。`<rich-text nodes={html}>` 只在运行时才知道 HTML 内容，Taro 编译器无法预知其中含有的标签，导致 `Template tmpl_0_xx not found`。

`<MarkdownRender>` 将 AST 节点显式映射为 `h('view')`、`h('text')`、`h('image')`，Taro 编译期可正常扫描，不会出现断层。

### 安装问题

**Q: peer dependencies 冲突？**  
A: 确保安装了 `vue@^3`、`@tarojs/components@^4`、`@tarojs/taro@^4`，或用 `pnpm.overrides` 强制版本。

**Q: CSS 必须导入吗？**  
A: 必须。不导入则无样式，可覆盖 class 自定义。

### 运行时

**Q: content 更新后不渲染？**  
A: 流式场景 `:content` 绑 `visible` ref，`:final` 绑 `final` computed，不要直接绑 `source`。

**Q: final 用错会怎样？**  
A: `final: false` 启用流式容错解析；`true` 为严格解析。流式未结束就设为 `true` 会导致异常显示。

### 平台

**Q: 支持 H5 / 支付宝 / 字节小程序？**  
A: 技术可行但未充分测试，需自行验证组件兼容性。

### 性能

**Q: 长文本卡顿？**  
A: 数百行正常。如卡顿，降低 `maxCommitFps` 或增大 `targetLatencyMs`。小程序 JS 线程有约 5-10 秒执行上限。

### 样式

**Q: 如何自定义？**  
A: 覆盖 CSS class（`.tm-link`、`.tm-code-block` 等）。

### 流式

**Q: enqueue 可以分段调用吗？**  
A: 可以，调度器自动控制吐出节奏。`finish()` 后调用 `enqueue()` 会重置 `done`。调用 `flush()` 可立即显示全部。

## 架构

```
taro-markstream-vue
├── stream-markdown-parser   框架无关解析器
├── markstream-core          rAF → setTimeout 适配
└── Vue 组件层
    ├── useSmoothMarkdownStream  composable
    ├── MarkdownRender           核心组件
    └── nodes/renderer.ts        AST → VNode 渲染
```

## 开发

```bash
pnpm install          # 安装依赖
vpr build             # 构建 lib（含 CSS）
vpr dev               # 并行 watch lib + 小程序 playground
pnpm --filter taro-markstream-vue typecheck  # 类型检查
```

## 截图

### 控制区域

<img width="368" height="177" alt="control" src="https://github.com/user-attachments/assets/4c7af427-45b2-4658-b2f5-34d6c7f856b2" />

### 样式0

<img width="331" height="192" alt="thinking" src="https://github.com/user-attachments/assets/82886565-44ca-4a5f-bf21-c0b08479f36e" />

### 样式1

<img width="341" height="590" alt="1" src="https://github.com/user-attachments/assets/c1c48352-28dd-4c06-921b-7bf492a141ce" />

### 样式2

<img width="343" height="566" alt="2" src="https://github.com/user-attachments/assets/900eda7b-bef0-4427-b6e1-280c6c2ef8e7" />

### 样式3

<img width="351" height="684" alt="fc4341ef-398b-4c20-8e27-c11d357dfd23" src="https://github.com/user-attachments/assets/881fcbdf-a38a-43fd-bd00-3c6cbfa21d08" />

### 样式4

<img width="352" height="681" alt="4" src="https://github.com/user-attachments/assets/1f2f77d4-a16f-4c89-a7ff-1f0143dd52a0" />

### 样式5

<img width="351" height="667" alt="5" src="https://github.com/user-attachments/assets/0e54e977-d2df-4145-a66f-de707e26f451" />

## License

MIT
