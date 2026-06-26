import type { ParsedNode } from 'stream-markdown-parser'

export type { ParsedNode }

export interface MarkdownRenderProps {
  content: string
  final?: boolean
}