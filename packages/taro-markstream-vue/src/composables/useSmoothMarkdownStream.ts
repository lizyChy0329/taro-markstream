import { computed, getCurrentScope, onScopeDispose, ref } from 'vue'
import { createSmoothMarkdownStream } from 'markstream-core'
import type { SmoothMarkdownStreamOptions } from 'markstream-core'

export type { SmoothMarkdownStreamOptions }

export interface SmoothMarkdownStreamController {
  source: ReturnType<typeof ref<string>>
  visible: ReturnType<typeof ref<string>>
  done: ReturnType<typeof ref<boolean>>
  final: ReturnType<typeof computed<boolean>>
  caughtUp: ReturnType<typeof computed<boolean>>
  pendingChars: ReturnType<typeof computed<number>>
  enqueue: (chunk: string) => void
  finish: (options?: { flush?: boolean }) => void
  flush: () => void
  reset: (initialMarkdown?: string) => void
  pause: () => void
  resume: () => void
}

export function useSmoothMarkdownStream(
  options: SmoothMarkdownStreamOptions = {},
): SmoothMarkdownStreamController {
  const source = ref('')
  const visible = ref('')
  const done = ref(false)

  const controller = createSmoothMarkdownStream(options)
  const sync = () => {
    const snapshot = controller.getSnapshot()
    source.value = snapshot.source
    visible.value = snapshot.visible
    done.value = snapshot.done
  }
  const unsubscribe = controller.subscribe(sync)
  sync()

  const pendingChars = computed(() =>
    Math.max(0, source.value.length - visible.value.length),
  )
  const caughtUp = computed(() => pendingChars.value === 0)
  const final = computed(() => done.value && caughtUp.value)

  if (getCurrentScope()) {
    onScopeDispose(() => {
      unsubscribe()
      controller.destroy()
    })
  }

  return {
    source,
    visible,
    done,
    final,
    caughtUp,
    pendingChars,
    enqueue: (chunk: string) => controller.enqueue(chunk),
    finish: (finishOptions?: { flush?: boolean }) =>
      controller.finish(finishOptions),
    flush: () => controller.flush(),
    reset: (initialMarkdown?: string) => controller.reset(initialMarkdown),
    pause: () => controller.pause(),
    resume: () => controller.resume(),
  }
}