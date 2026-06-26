import type { ParsedNode } from 'stream-markdown-parser'
import { h, type VNode } from 'vue'
import { highlightCode } from '../../utils/code-highlighter'

export interface RenderContext {
  onLinkClick?: (href: string) => void
  onImageClick?: (src: string) => void
}

function renderInlines(node: ParsedNode, ctx: RenderContext): (VNode | string)[] {
  const type = node.type
  const anyNode = node as any

  switch (type) {
    case 'text':
      return [String(anyNode.content || '')]
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
    case 'html_inline':
      return [String(anyNode.content || '')]
    case 'inline':
      return renderInlineChildren(node, ctx)
    default:
      return [String(anyNode.content || '')]
  }
}

function renderInlineChildren(node: ParsedNode, ctx: RenderContext): (VNode | string)[] {
  const children = (node as any).children as ParsedNode[] | undefined
  if (!children || children.length === 0) {
    const content = (node as any).content || (node as any).code || ''
    return [String(content)]
  }
  return children.flatMap((child) => renderInlines(child, ctx))
}

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

function renderNode(node: ParsedNode, ctx: RenderContext): VNode | null {
  const type = node.type
  const anyNode = node as any

  switch (type) {
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
      const anyNode = node as any
      const lang = anyNode.language ? String(anyNode.language) : ''
      const code = String(anyNode.code || '')
      const header = lang ? h('view', { class: 'tm-code-header' }, String(lang)) : null
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
    default:
      return null
  }
}

export function renderTree(nodes: ParsedNode[], ctx: RenderContext = {}): VNode {
  const children = nodes.map((node) => renderNode(node, ctx)).filter(Boolean)
  return h('view', { class: 'tm-root' }, children)
}