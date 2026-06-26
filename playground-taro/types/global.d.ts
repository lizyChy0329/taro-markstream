/// <reference types="@tarojs/taro" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'taro-markstream/vue' {
  import type { DefineComponent } from 'vue'
  export const MarkdownRender: DefineComponent<{
    content: string
    final?: boolean
  }>
  export function useSmoothMarkdownStream(options?: {
    minCharsPerSecond?: number
    maxCharsPerSecond?: number
    targetLatencyMs?: number
    flushOnFinish?: boolean
  }): {
    source: any
    visible: any
    done: any
    final: any
    enqueue: (chunk: string) => void
    finish: (opts?: { flush?: boolean }) => void
    flush: () => void
  }
}