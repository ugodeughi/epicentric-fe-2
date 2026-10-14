/** How long a message stays on screen. */
export const TOAST_DURATION = 5000

let lastId = 0

/**
 * Short messages about the outcome of an action (UX rule: no "done" dialogs).
 * Shown by `UiToasts` in the app shell.
 */
export function useToast() {
  /** @type {import('vue').Ref<{ id: number, text: string, tone: 'info' | 'error' }[]>} */
  const toasts = useState('toasts', () => [])

  function dismiss(id) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  /**
   * @param {string} text already translated
   * @param {{ tone?: 'info' | 'error' }} [options]
   */
  function show(text, { tone = 'info' } = {}) {
    const id = ++lastId
    // The same message twice in a row is shown once.
    toasts.value = [...toasts.value.filter((toast) => toast.text !== text), { id, text, tone }].slice(-3)
    if (import.meta.client) setTimeout(() => dismiss(id), TOAST_DURATION)
    return id
  }

  return {
    toasts,
    show,
    error: (text) => show(text, { tone: 'error' }),
    dismiss,
  }
}
