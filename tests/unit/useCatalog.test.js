import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CATALOG_PAGE_SIZE, useCatalog } from '../../app/composables/useCatalog'

const api = vi.hoisted(() => ({ items: { load: vi.fn(), save: vi.fn(), upload: vi.fn() } }))
mockNuxtImport('useApi', () => () => api)

const item = (Id, fields) => ({ Id, ItemName: `${Id}.mp3`, MediaType: 0, ...fields })

beforeEach(() => {
  vi.clearAllMocks()
  clearNuxtState()
})

describe('useCatalog', () => {
  it('shows a section with the backend type, order and page size, and counts it', async () => {
    api.items.load.mockResolvedValue({ items: [item('a'), item('b')], count: 2, more: false })
    const { items, count, counts, status, show } = useCatalog()

    await show({ section: 'visual', sort: 'name' })

    expect(api.items.load).toHaveBeenCalledWith({
      type: 'Video',
      search: '',
      order: 'ItemName asc',
      page: 0,
      pageSize: CATALOG_PAGE_SIZE,
    })
    expect(items.value.map((entry) => entry.Id)).toEqual(['a', 'b'])
    expect(count.value).toBe(2)
    expect(counts.value).toEqual({ visual: 2 })
    expect(status.value).toBe('ready')
  })

  it('does not take the number of results of a search as the size of the section', async () => {
    api.items.load.mockResolvedValue({ items: [item('a')], count: 1, more: false })
    const { counts, show } = useCatalog()

    await show({ section: 'audio', search: ' rush ' })

    expect(api.items.load).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'rush', order: 'ImportDate desc' }),
    )
    expect(counts.value).toEqual({})
  })

  it('adds pages while there are more, one request at a time', async () => {
    api.items.load
      .mockResolvedValueOnce({ items: [item('a')], count: 2, more: true })
      .mockResolvedValueOnce({ items: [item('b')], count: 2, more: false })
    const { items, more, show, loadMore } = useCatalog()

    await show({ section: 'audio' })
    await Promise.all([loadMore(), loadMore()])
    await loadMore()

    expect(api.items.load).toHaveBeenCalledTimes(2)
    expect(api.items.load).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }))
    expect(items.value.map((entry) => entry.Id)).toEqual(['a', 'b'])
    expect(more.value).toBe(false)
  })

  it('drops the answer of a section the user has already left', async () => {
    let answerAudio
    api.items.load
      .mockReturnValueOnce(new Promise((resolve) => (answerAudio = resolve)))
      .mockResolvedValueOnce({ items: [item('v')], count: 1, more: false })
    const { items, show } = useCatalog()

    const first = show({ section: 'audio' })
    await show({ section: 'visual' })
    answerAudio({ items: [item('a')], count: 1, more: false })
    await first

    expect(items.value.map((entry) => entry.Id)).toEqual(['v'])
  })

  it('reports a failed load', async () => {
    api.items.load.mockRejectedValue(new Error('down'))
    const { status, show } = useCatalog()

    await expect(show({ section: 'audio' })).rejects.toThrow('down')
    expect(status.value).toBe('error')
  })

  it('counts the sections without a number yet, leaving out those that fail', async () => {
    api.items.load.mockImplementation(async ({ type }) => {
      if (type === 'File') throw new Error('down')
      return { items: [], count: { Audio: 3, Video: 7, Bookmark: 0 }[type], more: false }
    })
    const { counts, loadCounts } = useCatalog()
    counts.value = { audio: 3 }

    await loadCounts()

    expect(api.items.load).toHaveBeenCalledTimes(3)
    expect(counts.value).toEqual({ audio: 3, visual: 7, bookmarks: 0 })
  })

  it('freezes a content at once, and goes back when the backend refuses', async () => {
    api.items.load.mockResolvedValue({ items: [item('a'), item('b')], count: 2, more: false })
    const { items, show, setFrozen } = useCatalog()
    await show({ section: 'audio' })

    await setFrozen('a', true)
    expect(api.items.save).toHaveBeenCalledWith('a', { IsFreezed: true })
    expect(items.value[0].IsFreezed).toBe(true)

    api.items.save.mockRejectedValueOnce(new Error('down'))
    await expect(setFrozen('b', true)).rejects.toThrow('down')
    expect(items.value[1].IsFreezed).toBe(false)
  })

  it('uploads files one by one, stops when space runs out, then shows the list again', async () => {
    api.items.load.mockResolvedValue({ items: [], count: 0, more: false })
    const { show, upload } = useCatalog()
    await show({ section: 'audio' })
    vi.clearAllMocks()
    api.items.load.mockResolvedValue({ items: [item('new')], count: 1, more: false })
    const quota = Object.assign(new Error('full'), { code: 'QUOTA_EXCEEDED' })
    api.items.upload
      .mockResolvedValueOnce({ Id: 'x' })
      .mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 'KO_DUPLICATED' }))
      .mockRejectedValueOnce(quota)

    const files = ['a', 'b', 'c', 'd'].map((name) => ({ name }))
    const result = await upload(files)

    expect(api.items.upload).toHaveBeenCalledTimes(3)
    expect(result.added).toBe(1)
    expect(result.failed.map(({ file, code }) => [file.name, code])).toEqual([
      ['b', 'KO_DUPLICATED'],
      ['c', 'QUOTA_EXCEEDED'],
    ])
    // The list and the four section counts.
    expect(api.items.load).toHaveBeenCalledTimes(5)
  })
})
