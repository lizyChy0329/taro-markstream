import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getMarkdown, parseMarkdownToStructure } from 'stream-markdown-parser'
import { renderTree } from '../src/components/nodes/renderer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

const fixturesDir = resolve(__dirname, '../../../test/fixtures')
const md = getMarkdown(undefined, { customHtmlTags: ['thinking'], enableContainers: true })

// Known unsupported fixture files: only assert placeholder behavior, not snapshot
const PLACEHOLDER_ONLY = new Set(['math.md', 'mermaid.md'])

function readFixture(name: string): string {
  return readFileSync(resolve(fixturesDir, name), 'utf-8')
}

function serializeVNode(vnode: any): string {
  if (typeof vnode === 'string' || typeof vnode === 'number') return String(vnode)
  if (vnode == null) return ''
  if (Array.isArray(vnode)) return vnode.map(serializeVNode).join('')
  if (typeof vnode.type === 'symbol') {
    // Fragment or other symbol type - serialize children directly
    const children = vnode.children
    if (Array.isArray(children)) return children.map(serializeVNode).join('')
    return serializeVNode(children)
  }
  const tag = vnode.type as string
  const props = vnode.props || {}
  const attrs = Object.entries(props)
    .filter(([k]) => k !== 'onClick' && k !== 'onImageClick' && k !== 'key')
    .map(([k, v]) => {
      if (v === null || v === undefined || v === false) return ''
      if (k === 'onClick') return ''
      if (k === 'onImageClick') return ''
      return ` ${k}="${String(v)}"`
    })
    .join('')

  const rawChildren = vnode.children
  let children: any[] = []
  if (rawChildren != null) {
    children = Array.isArray(rawChildren) ? rawChildren : [rawChildren]
  } else if (vnode.text != null) {
    children = [vnode.text]
  }

  const inner = children.map(serializeVNode).join('')
  return `<${tag}${attrs}>${inner}</${tag}>`
}

const ALL_FIXTURES = [
  'admonition.md',
  'checkbox.md',
  'code-diff.md',
  'escaped-brackets.md',
  'fence-with-meta.md',
  'footnotes.md',
  'headings.md',
  'html-full-document-nested.md',
  'image-link.md',
  'math.md',
  'mermaid.md',
  'nested-lists-edge.md',
  'table.md',
  'trailing-backticks.md',
  'unclosed-fence.md',
  'unmatched-brackets.md',
]

describe('VNode rendering (Taro mini-program DOM)', () => {
  describe.each(
    ALL_FIXTURES.filter(f => !PLACEHOLDER_ONLY.has(f)),
  )('fixture %s', (fixture) => {
    it('renders match snapshot', () => {
      const content = readFixture(fixture)
      const nodes = parseMarkdownToStructure(content, md, {
        final: true,
        customHtmlTags: ['thinking'],
      })
      const vnode = renderTree(nodes)
      const html = serializeVNode(vnode)
      expect(html).toMatchSnapshot()
    })
  })

  describe.each(['math.md', 'mermaid.md'])('unsupported fixture %s', (fixture) => {
    it('renders placeholder fallback', () => {
      const content = readFixture(fixture)
      const nodes = parseMarkdownToStructure(content, md, {
        final: true,
        customHtmlTags: ['thinking'],
      })
      const vnode = renderTree(nodes)
      const html = serializeVNode(vnode)
      const expectedLabel = fixture === 'math.md' ? '[Math]' : '[Mermaid]'
      expect(html).toContain(expectedLabel)
    })
  })
})
