import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import UiSegmented from '~/components/ui/Segmented.vue'

const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' },
]

describe('UiSegmented', () => {
  it('exposes a radiogroup with the current option checked', async () => {
    const wrapper = await mountSuspended(UiSegmented, { props: { options, label: 'Test', modelValue: 'b' } })

    expect(wrapper.attributes('role')).toBe('radiogroup')
    const checked = wrapper.findAll('[role="radio"]').map((r) => r.attributes('aria-checked'))
    expect(checked).toEqual(['false', 'true', 'false'])
  })

  it('selects on click', async () => {
    const wrapper = await mountSuspended(UiSegmented, { props: { options, label: 'Test', modelValue: 'c' } })

    await wrapper.findAll('[role="radio"]')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['a'])
  })

  it('wraps around with the arrow keys', async () => {
    const wrapper = await mountSuspended(UiSegmented, { props: { options, label: 'Test', modelValue: 'c' } })

    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['a'])

    await wrapper.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['c'])
  })
})
