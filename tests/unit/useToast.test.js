import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TOAST_DURATION, useToast } from '../../app/composables/useToast'

beforeEach(() => {
  vi.useFakeTimers()
  clearNuxtState()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToast', () => {
  it('shows a message and takes it away after a while', () => {
    const { toasts, show } = useToast()

    show('Saved.')
    expect(toasts.value).toEqual([expect.objectContaining({ text: 'Saved.', tone: 'info' })])

    vi.advanceTimersByTime(TOAST_DURATION)
    expect(toasts.value).toEqual([])
  })

  it('marks errors, shows a repeated message once and keeps the last three', () => {
    const { toasts, show, error } = useToast()

    error('Down.')
    error('Down.')
    expect(toasts.value).toEqual([expect.objectContaining({ text: 'Down.', tone: 'error' })])

    show('1')
    show('2')
    show('3')
    expect(toasts.value.map((toast) => toast.text)).toEqual(['1', '2', '3'])
  })

  it('can be closed before it goes away', () => {
    const { toasts, show, dismiss } = useToast()

    const id = show('Saved.')
    dismiss(id)

    expect(toasts.value).toEqual([])
  })
})
