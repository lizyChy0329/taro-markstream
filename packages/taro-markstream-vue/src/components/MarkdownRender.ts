import type { ParsedNode } from 'stream-markdown-parser'
import type { MarkdownIt } from 'stream-markdown-parser'
import type { RenderContext } from './nodes/renderer'
import { defineComponent, h, ref, watch, type VNode } from 'vue'
import { getMarkdown, parseMarkdownToStructure } from 'stream-markdown-parser'
import { renderTree } from './nodes/renderer'

let md: MarkdownIt | null = null
try {
  md = getMarkdown(undefined, { customHtmlTags: ['thinking'], enableContainers: true })
} catch {
  md = null
}

export default defineComponent({
  name: 'MarkdownRender',
  props: {
    content: { type: String, default: '' },
    final: { type: Boolean, default: false },
  },
  emits: ['link-click', 'image-click'],
  setup(props, { emit }) {
    const tree = ref<VNode | null>(null)

    watch(
      () => [props.content, props.final] as const,
      () => {
        if (!props.content) {
          tree.value = null
          return
        }
        if (!md) {
          tree.value = h('text', {}, props.content)
          return
        }
        try {
          const nodes: ParsedNode[] = parseMarkdownToStructure(props.content, md, {
            final: props.final,
            customHtmlTags: ['thinking'],
          })
          const ctx: RenderContext = {
            onLinkClick: (href) => emit('link-click', { href }),
            onImageClick: (src) => emit('image-click', { src }),
          }
          tree.value = renderTree(nodes, ctx)
        } catch {
          tree.value = h('text', {}, props.content)
        }
      },
      { immediate: true },
    )

    return () => tree.value || h('view', { class: 'tm-empty' })
  },
})