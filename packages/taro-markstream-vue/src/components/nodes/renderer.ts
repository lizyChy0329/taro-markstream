import type { ParsedNode } from 'stream-markdown-parser'
import { h, type VNode } from 'vue'
import { highlightCode } from '../../utils/code-highlighter'

export interface RenderContext {
  onLinkClick?: (href: string) => void
  onImageClick?: (src: string) => void
  scrollToAnchor?: (id: string) => void
}

function isRtl(s: string): boolean {
  return /[\u0590-\u07FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(s)
}

const UNSUPPORTED_LANG = new Set(['mermaid', 'infographic', 'd2', 'svg'])

// ── helpers ──────────────────────────────────────────

function renderUnsupportedInline(label: string, content: string | (VNode | string)[]): VNode {
  const tag = h('text', { class: 'tm-unsupported-tag' }, `[${label}]`)
  const children = typeof content === 'string'
    ? [tag, h('text', {}, content)]
    : [tag, ...content]
  return h('text', { class: 'tm-unsupported' }, children)
}

function renderUnsupportedBlock(label: string, content?: string): VNode {
  const tag = h('view', { class: 'tm-unsupported-tag' }, `[${label}]`)
  return h('view', { class: 'tm-unsupported' }, [
    tag,
    content ? h('text', {}, content) : null,
  ].filter(Boolean))
}

function renderUnsupportedBlockWithChildren(label: string, children: VNode[]): VNode {
  const tag = h('view', { class: 'tm-unsupported-tag' }, `[${label}]`)
  return h('view', { class: 'tm-unsupported' }, [tag, ...children])
}

// ── inline renderer ──────────────────────────────────

function renderInlines(node: ParsedNode, ctx: RenderContext): (VNode | string)[] {
  const type = node.type
  const anyNode = node as any

  switch (type) {
    case 'text': {
      const text = String(anyNode.content || '').trim()
      if (!text) return []
      if (isRtl(text)) return [h('text', { class: 'tm-rtl' }, text)]
      return [h('text', {}, text)]
    }
    case 'strong':
      return [h('text', { class: 'tm-strong' }, renderInlineChildren(node, ctx))]
    case 'emphasis':
      return [h('text', { class: 'tm-em' }, renderInlineChildren(node, ctx))]
    case 'strikethrough':
      return [h('text', { class: 'tm-del' }, renderInlineChildren(node, ctx))]
    case 'inline_code':
      return [h('text', { class: 'tm-code' }, String(anyNode.code || ''))]
    case 'link': {
      const href = anyNode.href || ''
      return [h('text', {
        class: 'tm-link',
        onClick: () => ctx.onLinkClick?.(href),
      }, renderInlineChildren(node, ctx))]
    }
    case 'image': {
      const src = anyNode.src || ''
      const alt = anyNode.alt || ''
      return [h('image', {
        class: 'tm-image',
        src,
        alt,
        mode: 'widthFix',
        onClick: () => ctx.onImageClick?.(src),
      })]
    }
    case 'hardbreak':
      return [h('text', { class: 'tm-br' }, '\n')]
    case 'html_inline': {
      const tag = (anyNode.tag || '').toLowerCase()
      if (tag === 'sub') return [h('text', { class: 'tm-sub' }, renderInlineChildren(node, ctx))]
      if (tag === 'sup') return [h('text', { class: 'tm-sup' }, renderInlineChildren(node, ctx))]
      if (tag === 'ins') return [h('text', { class: 'tm-ins' }, renderInlineChildren(node, ctx))]
      return [String(anyNode.content || '')]
    }
    case 'inline':
      return renderInlineChildren(node, ctx)
    case 'highlight':
      return [h('text', { class: 'tm-hl' }, renderInlineChildren(node, ctx))]
    case 'insert':
      return [h('text', { class: 'tm-ins' }, renderInlineChildren(node, ctx))]
    case 'subscript':
      return [h('text', { class: 'tm-sub' }, renderInlineChildren(node, ctx))]
    case 'superscript':
      return [h('text', { class: 'tm-sup' }, renderInlineChildren(node, ctx))]
    case 'emoji':
      return [h('text', { class: 'tm-emoji' }, String(anyNode.markup || anyNode.name || ''))]
    case 'checkbox_input': {
      const checked = anyNode.checked
      return [h('view', {
        class: `tm-checkbox-input${checked ? ' tm-checked' : ''}`,
      }, checked ? [h('text', { class: 'tm-checkbox-tick' }, '✓')] : undefined)]
    }
    case 'label_open':
    case 'label_close':
      return []
    case 'footnote_reference': {
      const id = anyNode.id || ''
      return [h('text', {
        class: 'tm-footnote-ref',
        onClick: () => ctx.scrollToAnchor?.(`fn-${id}`),
      }, `[${id}]`)]
    }
    case 'reference':
      return [renderUnsupportedInline('Reference', String(anyNode.content || ''))]
    case 'math_inline':
      return [renderUnsupportedInline('Math', String(anyNode.content || ''))]
    default:
      return [h('text', { class: 'tm-unsupported' }, String(anyNode.content || ''))]
  }
}

function renderInlineChildren(node: ParsedNode, ctx: RenderContext): (VNode | string)[] {
  const children = (node as any).children as ParsedNode[] | undefined
  if (!children || children.length === 0) {
    const content = (node as any).content || (node as any).code || ''
    return [h('text', {}, String(content))]
  }
  return children.flatMap((child) => renderInlines(child, ctx))
    .map(c => typeof c === 'string' ? h('text', {}, c) : c)
}

function renderTextWithRtl(text: string): VNode {
  if (isRtl(text)) return h('text', { class: 'tm-rtl' }, text)
  return h('text', {}, text)
}

// ── table renderer ───────────────────────────────────

function renderTable(node: ParsedNode, ctx: RenderContext): VNode {
  const anyNode = node as any
  const header = anyNode.header as any
  const rows = (anyNode.rows as any[]) || []

  const headerCells = header?.cells?.map((cell: any) => (
    h('view', { class: 'tm-th' }, renderInlineChildren(cell, ctx))
  )) || []

  const headerRow = headerCells.length
    ? h('view', { class: 'tm-tr' }, headerCells)
    : null

  const bodyRows = rows.map((row: any) => {
    const cells = (row.cells || []).map((cell: any) => {
      const classNames = cell.align ? `tm-td tm-td-${cell.align}` : 'tm-td'
      return h('view', { class: classNames }, renderInlineChildren(cell, ctx))
    })
    return h('view', { class: 'tm-tr' }, cells)
  })

  return h('view', { class: 'tm-table' }, [
    headerRow,
    h('view', { class: 'tm-tbody' }, bodyRows),
  ].filter(Boolean))
}

// ── diff code block ──────────────────────────────────

function renderDiffBlock(anyNode: any): VNode {
  const code = String(anyNode.code || '')
  const headerLang = anyNode.language ? String(anyNode.language) : ''
  const diffHeader = headerLang
    ? h('view', { class: 'tm-code-header' }, `diff ${headerLang}`)
    : h('view', { class: 'tm-code-header' }, 'diff')

  const lines = code.split('\n')
  const lineNodes = lines.map((line: string) => {
    if (line.startsWith('+')) {
      return h('view', { class: 'tm-diff-line tm-diff-add' }, [
        h('text', { class: 'tm-diff-sign' }, '+'),
        h('text', {}, line.slice(1)),
      ])
    }
    if (line.startsWith('-')) {
      return h('view', { class: 'tm-diff-line tm-diff-del' }, [
        h('text', { class: 'tm-diff-sign' }, '-'),
        h('text', {}, line.slice(1)),
      ])
    }
    if (line.startsWith('@@')) {
      return h('view', { class: 'tm-diff-line tm-diff-header' }, [
        h('text', {}, line),
      ])
    }
    if (line.startsWith('---') || line.startsWith('+++')) {
      return h('view', { class: 'tm-diff-line tm-diff-file' }, [
        h('text', {}, line),
      ])
    }
    return h('view', { class: 'tm-diff-line' }, [
      h('text', { class: 'tm-diff-sign' }, ' '),
      h('text', {}, line),
    ])
  })

  return h('view', { class: 'tm-code-block tm-diff-block' }, [
    diffHeader,
    h('view', { class: 'tm-pre' }, lineNodes),
  ].filter(Boolean))
}

// ── block renderer ───────────────────────────────────

function renderNode(node: ParsedNode, ctx: RenderContext): VNode | null {
  const type = node.type
  const anyNode = node as any

  switch (type) {
    // ── supported blocks ──
    case 'heading': {
      const level = Math.min(6, Math.max(1, anyNode.level || 1))
      return h('view', { class: `tm-h${level}` }, renderInlineChildren(node, ctx))
    }
    case 'paragraph': {
      const children = renderInlineChildren(node, ctx)
      if (!children.length) return null
      return h('view', { class: 'tm-p' }, children)
    }
    case 'code_block': {
      const lang = String(anyNode.language || '').toLowerCase()
      const code = String(anyNode.code || '')

      if (anyNode.diff) return renderDiffBlock(anyNode)

      if (UNSUPPORTED_LANG.has(lang)) {
        return renderUnsupportedBlock(lang.charAt(0).toUpperCase() + lang.slice(1), code)
      }

      const header = lang ? h('view', { class: 'tm-code-header' }, String(anyNode.language)) : null
      const tokens = highlightCode(code, lang)
      const codeChildren = tokens.map((t) =>
        h('text', { class: `tm-token-${t.type}` }, t.content),
      )
      const pre = h('view', { class: 'tm-pre' }, codeChildren)
      return h('view', { class: 'tm-code-block' }, [
        header,
        pre,
      ].filter(Boolean))
    }
    case 'list': {
      const items = (anyNode.items || anyNode.children || []) as ParsedNode[]
      return h('view', {
        class: `tm-list ${anyNode.ordered ? 'tm-list-ol' : 'tm-list-ul'}`,
      }, items.map((item) => renderNode(item, ctx)).filter(Boolean))
    }
    case 'list_item': {
      const liChildren = (node as any).children as ParsedNode[] | undefined
      const rendered = liChildren?.flatMap(child =>
        child.type === 'paragraph'
          ? renderInlineChildren(child, ctx)
          : [renderNode(child, ctx)].filter(Boolean),
      ) || []
      return h('view', { class: 'tm-li' }, rendered)
    }
    case 'blockquote':
      return h('view', { class: 'tm-blockquote' },
        ((node as any).children || []).map((child: ParsedNode) => renderNode(child, ctx)).filter(Boolean))
    case 'thematic_break':
      return h('view', { class: 'tm-hr' })
    case 'table':
      return renderTable(node, ctx)
    case 'html_block':
      return h('text', { class: 'tm-html' }, String(anyNode.content || ''))
    case 'inline':
      return h('view', {}, renderInlineChildren(node, ctx))

    // ── newly supported ──
    case 'admonition': {
      const kind = anyNode.kind || ''
      return h('view', { class: `tm-admonition tm-admonition-${kind || 'note'}` }, [
        h('view', { class: 'tm-admonition-title' }, kind || 'note'),
        ...(((node as any).children || []).map((child: ParsedNode) => renderNode(child, ctx)).filter(Boolean)),
      ])
    }
    case 'checkbox': {
      const ch = (node as any).children as ParsedNode[] | undefined
      const rendered = ch?.flatMap(child =>
        child.type === 'paragraph'
          ? renderInlineChildren(child, ctx)
          : [renderNode(child, ctx)].filter(Boolean),
      ) || []
      return h('view', { class: 'tm-checkbox' }, rendered)
    }
    case 'definition_list': {
      const items = (anyNode.items || anyNode.children || []) as ParsedNode[]
      return h('view', { class: 'tm-dl' },
        items.map((item: ParsedNode) => renderNode(item, ctx)).filter(Boolean))
    }
    case 'definition_item': {
      const term = (anyNode.term || []) as ParsedNode[]
      const def = (anyNode.definition || []) as ParsedNode[]
      return h('view', { class: 'tm-dl-item' }, [
        h('view', { class: 'tm-dt' }, term.flatMap((t: ParsedNode) => renderInlines(t, ctx)).filter(Boolean)),
        h('view', { class: 'tm-dd' }, def.flatMap((d: ParsedNode) => renderInlines(d, ctx)).filter(Boolean)),
      ])
    }
    case 'footnote': {
      const id = anyNode.id || ''
      const fnChildren = ((node as any).children || []) as ParsedNode[]
      const rendered = fnChildren.flatMap(child =>
        child.type === 'paragraph'
          ? renderInlineChildren(child, ctx)
          : [renderNode(child, ctx)].filter(Boolean),
      )
      return h('view', { id: `fn-${id}`, class: 'tm-footnote' }, [
        h('text', { class: 'tm-footnote-id' }, `[${id}] `),
        ...rendered,
        h('text', { class: 'tm-footnote-back', onClick: () => ctx.scrollToAnchor?.(`fnref-${id}`) }, ' ↩'),
      ])
    }
    case 'footnote_anchor': {
      const id = anyNode.id || ''
      return null
    }
    case 'vmr_container':
      return renderUnsupportedBlockWithChildren('Container',
        ((node as any).children || []).map((child: ParsedNode) => renderNode(child, ctx)).filter(Boolean))

    // ── custom tag (thinking) ──
    case 'thinking': {
      const thinkChildren = ((node as any).children || []) as ParsedNode[]
      const body = thinkChildren.length
        ? thinkChildren.map((child) => renderNode(child, ctx)).filter(Boolean)
        : [h('text', {}, String(anyNode.content || ''))]
      return h('view', { class: 'tm-thinking' }, [
        h('view', { class: 'tm-thinking-header' }, 'Thinking'),
        ...body,
      ])
    }

    // ── platform-limited (gray out) ──
    case 'math_block':
      return renderUnsupportedBlock('Math', String(anyNode.content || anyNode.code || ''))

    default:
      return h('view', { class: 'tm-unsupported' }, String(anyNode.content || ''))
  }
}

// ── entry ────────────────────────────────────────────

export function renderTree(nodes: ParsedNode[], ctx: RenderContext = {}): VNode {
  const children = nodes.map((node) => renderNode(node, ctx)).filter(Boolean)
  return h('view', { class: 'tm-root' }, children)
}