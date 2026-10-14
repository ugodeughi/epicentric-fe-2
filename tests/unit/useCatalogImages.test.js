import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCatalogImages } from '../../app/composables/useCatalogImages'

const api = vi.hoisted(() => ({ items: { load: vi.fn() } }))
mockNuxtImport('useApi', () => () => api)

const image = (Id) => ({ Id, ItemName: `${Id}.jpg`, FileName: `${Id}.jpg`, MediaType: 1, MediaSubType: 0 })

beforeEach(() => vi.clearAllMocks())

describe('useCatalogImages', () => {
  it('loads the first page of the Visual section, keeping only images with a file', async () => {
    api.items.load.mockResolvedValue({
      items: [
        image('a'),
        { Id: 'v', FileName: 'v.mp4', MediaType: 1, MediaSubType: 1 },
        { Id: 'e', MediaType: 1, MediaSubType: 2 },
        { Id: 'n', MediaType: 1, MediaSubType: 0 },
      ],
      more: true,
    })
    const { images, more, status, find } = useCatalogImages()
    expect(status.value).toBe('idle')

    await find()

    expect(api.items.load).toHaveBeenCalledWith({ type: 'Video', search: '', page: 0, pageSize: 30 })
    expect(images.value.map((item) => item.Id)).toEqual(['a'])
    expect(more.value).toBe(true)
    expect(status.value).toBe('ready')
  })

  it('adds the next page, and stops when there are no more', async () => {
    api.items.load.mockResolvedValueOnce({ items: [image('a')], more: true })
    api.items.load.mockResolvedValueOnce({ items: [image('b')], more: false })
    const { images, more, find, loadMore } = useCatalogImages()

    await find('sea')
    await loadMore()

    expect(api.items.load).toHaveBeenLastCalledWith({ type: 'Video', search: 'sea', page: 1, pageSize: 30 })
    expect(images.value.map((item) => item.Id)).toEqual(['a', 'b'])
    expect(more.value).toBe(false)

    await loadMore()
    expect(api.items.load).toHaveBeenCalledTimes(2)
  })

  it('starts again from the first page for a new search', async () => {
    api.items.load.mockResolvedValueOnce({ items: [image('a')], more: true })
    api.items.load.mockResolvedValueOnce({ items: [image('z')], more: false })
    const { images, find } = useCatalogImages()

    await find()
    await find('zebra')

    expect(api.items.load).toHaveBeenLastCalledWith({ type: 'Video', search: 'zebra', page: 0, pageSize: 30 })
    expect(images.value.map((item) => item.Id)).toEqual(['z'])
  })

  it('ignores the answer of a search the user has already replaced', async () => {
    let answerSlow
    api.items.load.mockReturnValueOnce(new Promise((resolve) => (answerSlow = resolve)))
    api.items.load.mockResolvedValueOnce({ items: [image('new')], more: false })
    const { images, find } = useCatalogImages()

    const slow = find('ol')
    await find('new')
    answerSlow({ items: [image('old')], more: true })
    await slow

    expect(images.value.map((item) => item.Id)).toEqual(['new'])
  })

  it('reports a failed load and keeps what was already shown', async () => {
    api.items.load.mockResolvedValueOnce({ items: [image('a')], more: true })
    api.items.load.mockRejectedValueOnce(new Error('down'))
    const { images, status, find, loadMore } = useCatalogImages()

    await find()
    await loadMore()

    expect(status.value).toBe('error')
    expect(images.value).toHaveLength(1)
  })
})
