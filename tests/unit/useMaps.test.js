import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMaps } from '../../app/composables/useMaps'

const api = vi.hoisted(() => ({ maps: { list: vi.fn(), tree: vi.fn(), createKey: vi.fn() } }))
mockNuxtImport('useApi', () => () => api)

const work = { Id: 'm1', Text: 'Work', Children: [{ Id: 'k1', Text: 'Focus', Children: [] }] }
const home = { Id: 'm2', Text: 'Home', Children: [] }

beforeEach(() => {
  vi.clearAllMocks()
  clearNuxtState()
  api.maps.list.mockResolvedValue([
    { Id: 'm1', Text: 'Work' },
    { Id: 'm2', Text: 'Home' },
  ])
  api.maps.tree.mockImplementation(async (id) => structuredClone(id === 'm2' ? home : work))
})

describe('useMaps', () => {
  it('opens the first Map when none is asked for', async () => {
    const { maps, tree, status, open } = useMaps()
    expect(status.value).toBe('idle')

    await open()

    expect(maps.value).toHaveLength(2)
    expect(tree.value.Id).toBe('m1')
    expect(status.value).toBe('ready')
  })

  it('opens the requested Map, and falls back to the first for an unknown id', async () => {
    const { tree, open } = useMaps()

    await open('m2')
    expect(tree.value.Id).toBe('m2')

    await open('not-mine')
    expect(api.maps.tree).toHaveBeenLastCalledWith('m1')
    expect(tree.value.Id).toBe('m1')
  })

  it('reports a failed load', async () => {
    api.maps.list.mockRejectedValue(new Error('down'))
    const { status, open } = useMaps()

    await expect(open()).rejects.toThrow('down')
    expect(status.value).toBe('error')
  })

  it('creates an Epikey as the last child, with the saved colour, then reloads the Map', async () => {
    const { tree, open, createKey } = useMaps()
    await open()
    api.maps.createKey.mockResolvedValue({ Id: 'k2', Text: 'Calm' })
    api.maps.tree.mockResolvedValue({
      ...work,
      Children: [...work.Children, { Id: 'k2', Text: 'Calm', Children: [] }],
    })

    const created = await createKey({ parentId: 'm1', text: 'Calm', color: 'sky' })

    expect(api.maps.createKey).toHaveBeenCalledWith({
      parentId: 'm1',
      text: 'Calm',
      color: '#7FD1E8',
      order: 2,
    })
    expect(created.Id).toBe('k2')
    expect(tree.value.Children.map((key) => key.Id)).toEqual(['k1', 'k2'])
  })

  it('leaves the Map as it was when the creation fails', async () => {
    const { tree, open, createKey } = useMaps()
    await open()
    api.maps.createKey.mockRejectedValue(new Error('nope'))

    await expect(createKey({ parentId: 'k1', text: 'X' })).rejects.toThrow('nope')
    expect(api.maps.createKey).toHaveBeenCalledWith({ parentId: 'k1', text: 'X', color: null, order: 1 })
    expect(tree.value.Children).toHaveLength(1)
  })
})
