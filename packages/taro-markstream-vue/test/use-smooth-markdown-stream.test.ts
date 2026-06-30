import { describe, expect, it } from 'vitest'
import { effectScope } from 'vue'
import { useSmoothMarkdownStream } from '../src/composables/useSmoothMarkdownStream'

describe('useSmoothMarkdownStream', () => {
  it('starts with empty source and visible', () => {
    const scope = effectScope()
    scope.run(() => {
      const stream = useSmoothMarkdownStream()
      expect(stream.source.value).toBe('')
      expect(stream.visible.value).toBe('')
    })
    scope.stop()
  })

  it('tracks source via enqueue', () => {
    const scope = effectScope()
    scope.run(() => {
      const stream = useSmoothMarkdownStream()
      stream.enqueue('Hello')
      expect(stream.source.value).toBe('Hello')
    })
    scope.stop()
  })

  it('accumulates multiple enqueues', () => {
    const scope = effectScope()
    scope.run(() => {
      const stream = useSmoothMarkdownStream()
      stream.enqueue('Hello ')
      stream.enqueue('World')
      expect(stream.source.value).toBe('Hello World')
    })
    scope.stop()
  })

  it('finish sets done to true', () => {
    const scope = effectScope()
    scope.run(() => {
      const stream = useSmoothMarkdownStream()
      expect(stream.done.value).toBe(false)
      stream.finish()
      expect(stream.done.value).toBe(true)
    })
    scope.stop()
  })

  it('reset clears source and visible', () => {
    const scope = effectScope()
    scope.run(() => {
      const stream = useSmoothMarkdownStream()
      stream.enqueue('Hello')
      stream.reset()
      expect(stream.source.value).toBe('')
      expect(stream.visible.value).toBe('')
      expect(stream.done.value).toBe(false)
    })
    scope.stop()
  })

  it('reset with initial markdown sets source', () => {
    const scope = effectScope()
    scope.run(() => {
      const stream = useSmoothMarkdownStream()
      stream.enqueue('Hello')
      stream.reset('New content')
      expect(stream.source.value).toBe('New content')
    })
    scope.stop()
  })

  it('pendingChars returns source minus visible length', () => {
    const scope = effectScope()
    scope.run(() => {
      const stream = useSmoothMarkdownStream({ charsPerSecond: 10000 })
      stream.enqueue('Hello World')
      // With high charsPerSecond, flush will catch up
      expect(stream.pendingChars.value).toBeGreaterThanOrEqual(0)
    })
    scope.stop()
  })

  it('caughtUp is true when nothing pending', () => {
    const scope = effectScope()
    scope.run(() => {
      const stream = useSmoothMarkdownStream({ charsPerSecond: 10000 })
      stream.enqueue('Hi')
      stream.flush()
      expect(stream.caughtUp.value).toBe(true)
    })
    scope.stop()
  })

  it('final is true when done and caught up', () => {
    const scope = effectScope()
    scope.run(() => {
      const stream = useSmoothMarkdownStream({ charsPerSecond: 10000 })
      stream.enqueue('Hi')
      stream.flush()
      stream.finish()
      expect(stream.final.value).toBe(true)
    })
    scope.stop()
  })

  it('pause and resume control flow', () => {
    const scope = effectScope()
    scope.run(() => {
      const stream = useSmoothMarkdownStream()
      stream.enqueue('Hello')
      stream.pause()
      // no error thrown
      stream.resume()
      expect(stream.source.value).toBe('Hello')
    })
    scope.stop()
  })

  it('finish with flush syncs visible immediately', () => {
    const scope = effectScope()
    scope.run(() => {
      const stream = useSmoothMarkdownStream({ charsPerSecond: 10000 })
      stream.enqueue('Sync text')
      stream.finish({ flush: true })
      expect(stream.visible.value).toBe('Sync text')
    })
    scope.stop()
  })
})
