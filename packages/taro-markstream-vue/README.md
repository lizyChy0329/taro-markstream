# taro-markstream

> Taro 4 流式 Markdown 渲染器 — 面向 AI 聊天场景的最小 Vue 3 版本

## 安装

```bash
pnpm add taro-markstream
```

确保项目安装了必要的 peer 依赖：

```bash
pnpm add vue@^3 @tarojs/components@^4 @tarojs/taro@^4
```

## 使用

### 基础渲染

```vue
<template>
  <MarkdownRender
    content="# Hello\n**World**"
    @link-click="handleLink"
  />
</template>

<script setup lang="ts">
import { MarkdownRender } from 'taro-markstream/vue'
import 'taro-markstream/vue/index.css'

function handleLink(e: { href: string }) {
  Taro.setClipboardData({ data: e.href })
}
</script>
```

### 流式打字效果

```vue
<template>
  <MarkdownRender :content="visible" :final="final" />
</template>

<script setup lang="ts">
import { MarkdownRender, useSmoothMarkdownStream } from 'taro-markstream/vue'

const { visible, final, enqueue, finish } = useSmoothMarkdownStream({
  minCharsPerSecond: 30,
  maxCharsPerSecond: 200,
})

// AI 流式返回时逐个调用
enqueue(chunk)

// 流结束时调用
finish()
</script>
```

### API

#### `MarkdownRender` Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `content` | `string` | `''` | Markdown 原文 |
| `final` | `boolean` | `false` | 标记此次渲染为最终结果（关闭流式解析的容错模式） |

#### `MarkdownRender` Events

| 事件 | 载荷 | 说明 |
|------|------|------|
| `@link-click` | `{ href: string }` | 用户点击链接时触发 |
| `@image-click` | `{ src: string }` | 用户点击图片时触发 |

#### `useSmoothMarkdownStream` Options

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `minCharsPerSecond` | `number` | `30` | 最小打字速度（字符/秒） |
| `maxCharsPerSecond` | `number` | `200` | 最大打字速度（字符/秒） |
| `batchSize` | `number` | `5` | 每次调度最多吐出的字符数 |
| `scheduleInterval` | `number` | `50` | 调度间隔（毫秒） |
| `startDelay` | `number` | `0` | 首次输出前的延迟（毫秒） |

#### `useSmoothMarkdownStream` 返回值

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `source` | `Ref<string>` | 已入队的全部原文 |
| `visible` | `Ref<string>` | 当前已打出的可见文本 |
| `done` | `Ref<boolean>` | 是否已调用 `finish()` |
| `final` | `ComputedRef<boolean>` | `done && caughtUp`，适合直接传给 `MarkdownRender` 的 `:final` |
| `caughtUp` | `ComputedRef<boolean>` | 是否已追上入队速度 |
| `pendingChars` | `ComputedRef<number>` | 尚未打出的字符数 |
| `enqueue(chunk)` | `(chunk: string) => void` | 入队一段文本 |
| `finish(opts?)` | `(opts?: { flush?: boolean }) => void` | 标记流结束；`flush: true` 立即吐出所有剩余 |
| `flush()` | `() => void` | 立即吐出所有待输出文本 |
| `reset(init?)` | `(initialMarkdown?: string) => void` | 重置状态，可选初始文本 |
| `pause()` | `() => void` | 暂停输出 |
| `resume()` | `() => void` | 恢复输出 |

## 特性 / 支持的功能

### ✅ 已支持的 Markdown 语法

| 语法 | 渲染方式 |
|------|----------|
| `#` ~ `######` 标题 | `<view class="tm-h1~6">` |
| `**粗体**` | `<text class="tm-strong">` |
| `*斜体*` | `<text class="tm-em">` |
| `~~删除线~~` | `<text class="tm-del">` |
| `` `行内代码` `` | `<text class="tm-code">` |
| `![alt](src)` 图片 | `<image>` |
| `[text](url)` 链接 | `<text class="tm-link">` → `@link-click` 事件 |
| `` ```language `` 代码块 | `<view class="tm-code-block">` + 语法高亮 |
| `> blockquote` 引用 | `<view class="tm-blockquote">` |
| `-` / `*` 无序列表 | `<view class="tm-list tm-list-ul">` |
| `1.` 有序列表 | `<view class="tm-list tm-list-ol">` + 计数器 |
| `---` 分割线 | `<view class="tm-hr">` |
| `\| 表 \|` 表格 | `<view class="tm-table">` flex 布局 |
| 段落 | `<view class="tm-p">` |
| `<br>` 或行尾 `\` 换行 | `<text class="tm-br">` |
| HTML 标签 | `<text class="tm-html">` 原文输出 |

### ✅ 已支持（高级语法）

| 语法 | 渲染方式 |
|------|----------|
| `==高亮==` | `<text class="tm-hl">` |
| `<ins>` / `++插入++` | `<text class="tm-ins">` |
| `<sub>` / `~下标~` | `<text class="tm-sub">` |
| `<sup>` / `^上标^` | `<text class="tm-sup">` |
| `- [x]` 任务列表 | `<text>[x]</text>` + 文本 |
| `:smile:` Emoji 短代码 | 显示原文 |
| `::: warning` 警告块 | 带颜色边框的容器（kind: warning/danger/tip/note/info） |
| 定义列表：`术语 : 定义` | `<view class="tm-dt">` / `<view class="tm-dd">` |
| `[^1]` 脚注 | 带锚点的脚注块 + ↩ 返回 |
| `diff json` diff 代码块 | 绿色 `+` / 红色 `-` 行渲染 |
| `<thinking>` 自定义标签 | 灰底虚线边框容器 |
| 嵌套列表（有序/无序混合） | 递归渲染 |

### ⬜ 置灰标记（小程序平台限制）

| 语法 | 原因 |
|------|------|
| `$E=mc^2$` / `$$...$$` 数学公式 | 需要 KaTeX DOM 渲染 |
| `` ```mermaid `` Mermaid 图 | 需要 DOM + SVG + Web Worker |
| `` ```infographic `` Infographic 图 | 需要 DOM + SVG 渲染 |
| `` ```d2 `` D2 图 | 需要 DOM + SVG 渲染 |
| `` ```svg `` SVG 代码块 | 小程序无 SVG 元素支持 |

### ✅ 流式支持

- `useSmoothMarkdownStream` composable → 基于 `markstream-core` 的平滑打字机效果
- 流式增量解析 → 每次 content 变化时 `stream-markdown-parser` 增量解析
- 事件驱动 → `@link-click` 处理链接交互

### ✅ 样式

- 内置基础 CSS（可覆盖）
- 750rpx 设计稿适配
- 支持通过宿主页面的样式覆盖

## ❌ 不支持的功能

与 [markstream-vue](https://github.com/Simon-He95/markstream-vue) 原版相比，以下功能**已移除**：

### 渲染器

| 功能 | 原因 |
|------|------|
| KaTeX 数学公式 | 小程序无 DOM，不可用 |
| Mermaid 图形 | 需要 Web Worker + SVG 渲染 |
| D2 图形 | 需要 Web Worker |
| AntV Infographic | 需要 DOM |
| Monaco Editor | 浏览器专属 |
| Shiki 代码高亮 | 需要 Web Worker |
| HTML 富文本（`v-html`） | 小程序无 innerHTML，使用 `<rich-text>` |

### 虚拟滚动与性能优化

| 功能 | 原因 |
|------|------|
| `useMarkstreamVirtualAdapter` | 聊天场景不需要内部文档虚拟化 |
| `MarkstreamVirtualTimeline` | 外层时间线虚拟滚动另由宿主实现 |
| 节点批量渲染调度器 | 单条消息节点数有限，无需批次调度 |
| 高度测量 / ResizeObserver | 无虚拟滚动就不需要高度测量 |
| 视口优先级调度 | 由 IntersectionObserver 替代 |
| 延迟渲染 / deferNodes | 不支持 |

### 组件

| 功能 | 原因 |
|------|------|
| CodeBlockNode (Monaco) | 编辑器不可用 |
| MathBlockNode / MathInlineNode | KaTeX 不可用 |
| MermaidBlockNode | 不可用 |
| D2BlockNode | 不可用 |
| InfographicBlockNode | 不可用 |
| Tooltip (Floating UI) | 弹窗不可用 |
| MarkdownCodeBlockNode | Shiki 不可用 |
| MarkstreamVirtualTimeline | 已移除 |
| AdmonitionNode / VmrContainerNode | 高级语法支持 |
| Emoji 解析 | 纯文本显示 |
| Checkbox 渲染 | 交互组件不可用 |
| Footnote / Reference | 高级语法 |
| Subscript / Superscript | HTML 标签受限 |
| Insert / Highlight | HTML 标签受限 |

### 平台特性

| 功能 | 原因 |
|------|------|
| Web Workers | 小程序不支持 |
| `requestAnimationFrame` | 使用 `setTimeout` 替代，50ms+ 间隔 |
| `document` / `HTMLElement` | 小程序无 DOM |
| `ResizeObserver` | 小程序不支持 |
| `Intl.Segmenter` | 使用内置降级（`Array.from`） |
| `performance.now()` | 小程序中不可靠，使用 `Date.now()` |
| `<style scoped>` 深度选择器 | 仅支持 class 选择器 |

## 架构

```
taro-markstream
├── stream-markdown-parser  (复用，框架无关)
├── markstream-core          (复用，仅适配 rAF → setTimeout)
└── Vue 组件层
    ├── useSmoothMarkdownStream  (composable)
    ├── MarkdownRender           (核心组件)
    └── nodes/renderer.ts        (~15 种节点 VNode 渲染)
```

## 常见陷阱

### 为什么不能用 `<rich-text>`

微信小程序没有动态 DOM 注入机制，Taro 在编译期将组件调用树静态分析后生成 `base.wxml` 模板文件（如 `tmpl_0_view`）。

**`<rich-text nodes={html}>` 的问题：** Taro 编译器只看到 `<rich-text>`，无法预知运行时 HTML 字符串会解出什么标签。若 HTML 中含有 `<a>`（内部编号 62），Taro 因未扫描到显式的 `<a>` 或 `h('a')` 调用而跳过该模板的生成，导致微信报错 `Template tmpl_0_62 not found`。

**`<MarkdownRender>` 使用 VNode 递归渲染的理由：** 将 Markdown AST 的每个节点显式映射为 `h('view')`、`h('text')`、`h('image')` 等调用。Taro 编译期扫描到这些调用，就会在 `base.wxml` 中生成对应的标准模板（`tmpl_0_view` 等），运行时永远不会出现"模板未找到"的断层。同时规避了 `rich-text` 二次解析的性能损耗，并且链接点击可通过 `@link-click` 自由定制跳转逻辑。

## 开发

```bash
# 在 monorepo 中
pnpm install
pnpm --filter taro-markstream build

# 启动 playground
pnpm --filter playground-taro dev:weapp
```

## License

MIT
