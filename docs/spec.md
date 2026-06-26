# 从 markstream-vue 移植测试数据 & 不支持特性置灰

## 背景

从 `markstream-vue` 项目移植测试数据（fixture markdown 文件）到 `taro-markstream`，用于验证渲染正确性。同时，对 `taro-markstream` 不支持的特性（math、mermaid、infographic 等），在渲染器中以「置灰提醒」方式展示，而非静默丢弃。

## 阶段一：复制测试数据

### 目标

将 `markstream-vue/test/fixtures/` 完整复制到 `taro-markstream/test/fixtures/`，不做任何修改。

### 文件清单

```
test/fixtures/
├── headings.md              # 标题
├── table.md                 # 表格
├── code-diff.md             # diff 代码块
├── image-link.md            # 图片 & 链接
├── checkbox.md              # 复选框（不支持）
├── admonition.md            # 警告块（不支持）
├── footnotes.md             # 脚注（不支持）
├── escaped-brackets.md      # 转义括号
├── fence-with-meta.md       # fence 带 meta 信息
├── html-full-document-nested.md  # 完整 HTML
├── nested-lists-edge.md     # 嵌套列表边界
├── trailing-backticks.md    # 尾部反引号
├── unclosed-fence.md        # 未闭合 fence
├── unmatched-brackets.md    # 不匹配括号
├── math.md                  # 数学公式（不支持）
├── mermaid.md               # Mermaid 图（不支持）
├── infographic.md           # Infographic（不支持）
├── security/
│   └── html-xss-corpus.json # XSS 测试语料
├── mermaid-svg/             # Mermaid SVG 参考
└── react-markdown-migration-demo/  # 迁移示例
```

### 规则

- 所有文件原样复制，不做任何修改
- 不支持的特性保留 fixture，渲染器层负责置灰

## 阶段二：Playground 演示数据

从 `markstream-vue/playground-shared/testLabFixtures.ts` 复制到 `playground-taro/src/testLabFixtures.ts`，供 playground 演示用。

## 阶段三：渲染器置灰处理

### 当前问题

`renderer.ts` 的 `renderNode` 和 `renderInlines` 中，未识别的 node type 走 `default` 分支：
- `renderInlines` default: 返回 `String(anyNode.content || '')` — 直接显示原文（尚可）
- `renderNode` default: 返回 `null` — 静默丢弃，用户看不到任何痕迹

### 改后行为

所有不支持的特性，以「灰色禁用」样式展示，保留原始内容可见。

#### 需要新增的节点处理

| Node type | 类别 | 渲染方式 |
|---|---|---|
| `math_inline` | inline | `<text class="tm-unsupported">[Math] α + β</text>` |
| `math_block` | block | 灰底块 + `[Math Block]` 标签 + 原内容 |
| `admonition` | block | 灰底块 + `[Admonition: type]` 标签 + 子内容 |
| `checkbox` / `checkbox_input` | inline | 灰底 `[ ]` / `[x]` + 文本内容 |
| `footnote_reference` | inline | 灰底 `[^1]` 标签 |
| `footnote` / `footnote_anchor` | block | 灰底块 + `[Footnote]` 标签 + 内容 |
| `emoji` | inline | 直接显示原始文本（如 `:smile:`） |
| `highlight` | inline | 灰底行 + 原始内容 |
| `insert` | inline | 灰底行 + 原始内容 |
| `subscript` | inline | 灰底行 + 原始内容 |
| `superscript` | inline | 灰底行 + 原始内容 |
| `reference` | inline | 灰底行 + 原始内容 |
| `definition_list` | block | 灰底块 + 原始内容 |
| `definition_item` | block | 灰底块 + 原始内容 |
| `vmr_container` | block | 灰底块 + 原始内容 |
| 其他未知 block | block | 灰底块 + 原始内容 |

### CSS 样式

```css
.tm-unsupported {
  background-color: #f5f5f5;
  color: #999;
  border: 1rpx dashed #d9d9d9;
  border-radius: 6rpx;
  padding: 8rpx 12rpx;
  margin: 8rpx 0;
  font-size: 24rpx;
}
.tm-unsupported-tag {
  display: inline-block;
  background: #e8e8e8;
  color: #bbb;
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  margin-right: 8rpx;
}
```