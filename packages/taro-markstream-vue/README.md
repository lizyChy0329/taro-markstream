# taro-markstream-vue

> Taro 4 流式 Markdown 渲染器 — 面向 AI 聊天场景的最小 Vue 3 版本

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

## 详细用法

### 基础渲染

```vue
<script setup lang="ts">
import { MarkdownRender } from 'taro-markstream-vue'
import 'taro-markstream-vue/index.css'

const markdown = `# Hello World

这是一段 **粗体** 和 *斜体* 文本，以及 ~~删除线~~。

- 列表项 1
- 列表项 2`
</script>

<template>
  <MarkdownRender :content="markdown" :final="true" />
</template>
```

### 流式打字效果

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MarkdownRender, useSmoothMarkdownStream } from 'taro-markstream-vue'
import 'taro-markstream-vue/index.css'

const { visible, final, caughtUp, pendingChars, enqueue, finish, flush, reset, pause, resume } = useSmoothMarkdownStream({
  minCharsPerSecond: 30,
  maxCharsPerSecond: 200,
})

function onChunk(chunk: string) {
  enqueue(chunk)
}

function onDone() {
  finish()
}
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

function handleLink(e: { href: string }) {
  Taro.setClipboardData({ data: e.href })
}

function handleImage(e: { src: string }) {
  Taro.previewImage({ urls: [e.src] })
}
</script>

<template>
  <MarkdownRender
    content="# Hello"
    :final="true"
    @link-click="handleLink"
    @image-click="handleImage"
  />
</template>
```

## API 参考

### MarkdownRender

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `content` | `string` | `''` | Markdown 原文 |
| `final` | `boolean` | `false` | 标记最终结果（关闭流式容错模式）；搭配 `useSmoothMarkdownStream` 的 `final` computed 使用 |

| 事件 | 载荷 | 说明 |
|------|------|------|
| `@link-click` | `{ href: string }` | 用户点击链接时触发 |
| `@image-click` | `{ src: string }` | 用户点击图片时触发 |

### useSmoothMarkdownStream

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `minCharsPerSecond` | `number` | `30` | 最小打字速度（字符/秒） |
| `maxCharsPerSecond` | `number` | `200` | 最大打字速度（字符/秒） |
| `targetLatencyMs` | `number` | `900` | 目标响应延迟（毫秒），越小吐字越快 |
| `catchUpLatencyMs` | `number` | `350` | 追赶模式下的延迟（毫秒） |
| `catchUpThreshold` | `number` | `600` | 触发追赶模式的待输出字符阈值 |
| `startDelayMs` | `number` | `80` | 首次输出前的延迟（毫秒） |
| `maxCharsPerCommit` | `number` | `80` | 每次调度最多吐出的字符数 |
| `maxCommitFps` | `number` | `30` | 调度帧率上限 |
| `flushOnFinish` | `boolean` | `false` | 调用 `finish()` 时是否立即吐出所有剩余 |

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `visible` | `Ref<string>` | 当前已打出的可见文本，直接传给 `:content` |
| `final` | `ComputedRef<boolean>` | `done && caughtUp`，直接传给 `:final` |
| `source` | `Ref<string>` | 已入队的全部原文 |
| `done` | `Ref<boolean>` | 是否已调用 `finish()` |
| `caughtUp` | `ComputedRef<boolean>` | 是否已追上入队速度（无可等待字符） |
| `pendingChars` | `ComputedRef<number>` | 尚未打出的字符数 |
| `enqueue(chunk)` | `(chunk: string) => void` | 入队一段文本（可多次调用） |
| `finish(opts?)` | `(opts?: { flush?: boolean }) => void` | 标记流结束；`flush: true` 立即吐出所有 |
| `flush()` | `() => void` | 立即吐出所有待输出文本 |
| `reset(init?)` | `(initialMarkdown?: string) => void` | 重置状态，可选初始文本 |
| `pause()` | `() => void` | 暂停输出 |
| `resume()` | `() => void` | 恢复输出 |

### 类型导出

```ts
import type { MarkdownRenderProps, ParsedNode } from 'taro-markstream-vue'
import type { SmoothMarkdownStreamOptions, SmoothMarkdownStreamController } from 'taro-markstream-vue'
```

## 特性

### ✅ 基础 Markdown

| 语法 | 渲染 |
|------|------|
| `#` ~ `######` 标题 | 粗体放大 |
| `**粗体**` / `*斜体*` | 样式化 |
| `~~删除线~~` | 贯穿线 |
| `` `行内代码` `` | 灰底等宽 |
| `[链接](url)` | 蓝色下划线 + `@link-click` 事件 |
| `![图片](src)` | `<image>` 组件 + `@image-click` 事件 |
| `` ```language `` 代码块 | 深色背景 + 语法高亮 |
| `> 引用` | 蓝色左边框 |
| `-` / `1.` 列表 | 带序标号 |
| `---` 分割线 | 灰色横线 |
| `\| 表格 \|` | flex 布局 |
| `<br>` 换行 / HTML 标签 | 原文输出 |

### ✅ 高级语法

| 语法 | 渲染 |
|------|------|
| `==高亮==` | 黄色背景 |
| `<ins>` / `++插入++` | 下划线 |
| `<sub>` / `~下标~` | 下标 |
| `<sup>` / `^上标^` | 上标 |
| `- [x]` 任务列表 | `[x]` / `[ ]` + 文本 |
| `:smile:` Emoji | 显示原码 |
| `::: warning` 警告块 | 按 kind 着色（warning/danger/tip/note/info/caution） |
| 定义列表 `术语 : 描述` | 加粗术语 + 缩进定义 |
| `[^1]` 脚注 | 锚点 + ↩ 返回 |
| `diff language` 代码块 | 绿色 `+` / 红色 `-` 行 |
| `<thinking>` 标签 | 灰底虚线边框容器 |
| 阿拉伯语 RTL | 自动识别并应用从右到左 |
| 嵌套列表（有序/无序混合） | 递归缩进 |

### ⬜ 平台限制（置灰标记）

| 语法 | 原因 |
|------|------|
| `$E=mc^2$` / `$$...$$` 数学公式 | 需要 KaTeX DOM 渲染 |
| `` ```mermaid `` Mermaid 图 | 需要 DOM + SVG + Web Worker |
| `` ```infographic `` Infographic | 需要 DOM + SVG 渲染 |
| `` ```d2 `` D2 图 | 需要 DOM + SVG 渲染 |
| `` ```svg `` SVG 代码块 | 小程序无 SVG 元素支持 |

## 常见陷阱

### 为什么不能用 `<rich-text>`？

微信小程序没有动态 DOM 注入。Taro 编译期将组件调用树静态分析后生成 `base.wxml` 模板文件。

**`<rich-text nodes={html}>` 的问题：** Taro 编译器只看到 `<rich-text>`，无法预知运行时 HTML 字符串会解出什么标签。若 HTML 中含有 `<a>`，Taro 因未扫描到显式的 `<a>` 或 `h('a')` 调用而跳过该模板生成，导致微信报错 `Template tmpl_0_62 not found`。

**`<MarkdownRender>` 使用 VNode 递归渲染的理由：** 将 Markdown AST 的每个节点显式映射为 `h('view')`、`h('text')`、`h('image')` 等调用。Taro 编译期扫描到这些调用，就会在 `base.wxml` 中生成对应的标准模板，运行时永远不会出现"模板未找到"的断层。

## FAQ

### 安装

**Q: 安装报 peer dependencies 冲突？**
A: 确保项目中已安装 `vue@^3`、`@tarojs/components@^4`、`@tarojs/taro@^4`。可在 `pnpm add` 时添加 `--save-peer` 或使用 `pnpm.overrides` 强制版本。

**Q: `import 'taro-markstream-vue/index.css'` 是必须的吗？**
A: 是。不导入 CSS 则没有任何样式。你可以基于内置 CSS 覆盖，或自定义全部样式。

### 运行时

**Q: `content` 更新后渲染闪烁或不更新？**
A: 确保 `:content` 响应式绑定正确。流式场景中 `:content` 应绑定 `visible` ref，`:final` 绑定 `final` computed。不要直接绑定 `source`。

**Q: `final` 用错会怎样？**
A: `final: false`（默认）时解析器处于流式容错模式，对不完整的 Markdown 语法更宽容。`final: true` 时严格解析。流式未结束就设为 `true`，可能导致不完整块显示异常。

### 平台

**Q: 微信报 `Template tmpl_0_xx not found`？**
A: 这是使用 `<rich-text>` 的典型错误。确保使用 `<MarkdownRender>` 而非 `<rich-text>`。如果自定义了 `renderer.ts`，确保所有用到的 `h()` 调用（`h('view')`、`h('text')`、`h('image')` 等）在 Taro 编译时可扫描到。

**Q: 支持 H5 吗？**
A: 技术可行，但未经充分测试。涉及小程序特有组件（如 `<image>` mode）在 H5 可能行为不同。

**Q: 支持支付宝/字节/企业微信小程序吗？**
A: 未测试。理论上 Taro 4 多平台框架可编译，但组件兼容性需自行验证。

### 性能

**Q: 长文本渲染卡顿？**
A: 单条消息数百行 Markdown 性能正常。若遇卡顿，可降低 `maxCommitFps` 或增大 `targetLatencyMs`。

**Q: 能渲染多长的 content？**
A: 无硬限制。但小程序 WebView 的 JS 线程有执行时间上限（约 5-10 秒），过长文本请分批渲染。

### 样式

**Q: 怎么自定义颜色/字体？**
A: 覆盖 CSS class 即可。查看 `index.css` 中的 class 命名（如 `.tm-link`、`.tm-code-block`、`.tm-blockquote`），在你的 App 样式中覆盖。

**Q: 750rpx 设计稿不匹配？**
A: Taro 默认使用 750rpx 设计稿宽度。如果你的项目使用不同设计稿，调整 `designWidth` 配置。

### 流式

**Q: `enqueue` 可以分段调用吗？**
A: 可以。`enqueue` 设计为多次调用，每次追加到 `source`。调度器会自动控制吐出节奏。

**Q: `finish()` 之后还能 `enqueue()` 吗？**
A: 可以。`finish()` 后调用 `enqueue()` 会自动将 `done` 重置为 `false`，继续追加。

**Q: 如何立即显示全部内容？**
A: 调用 `flush()` 或 `finish({ flush: true })`。

## 架构

```
taro-markstream
├── stream-markdown-parser  (复用，框架无关)
├── markstream-core          (复用，仅适配 rAF → setTimeout)
└── Vue 组件层
    ├── useSmoothMarkdownStream  (composable)
    ├── MarkdownRender           (核心组件)
    └── nodes/renderer.ts        (所有 AST 节点 → VNode 渲染)
```

## 开发

```bash
# 安装依赖
pnpm install

# 构建 lib（CSS 由 vp pack 自动打包到 dist/vue/index.css）
vpr build

# 并行 watch lib + 微信小程序 playground
vpr dev

# 类型检查
pnpm --filter taro-markstream-vue typecheck
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

<img width="351" height="684" alt="3" src="https://github.com/user-attachments/assets/f4173eb7-8654-4e4a-b2d0-542cfe2efb6f" />

### 样式4

<img width="352" height="681" alt="4" src="https://github.com/user-attachments/assets/1f2f77d4-a16f-4c89-a7ff-1f0143dd52a0" />

### 样式5

<img width="351" height="667" alt="5" src="https://github.com/user-attachments/assets/0e54e977-d2df-4145-a66f-de707e26f451" />

## License

MIT
