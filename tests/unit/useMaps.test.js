import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMaps } from '../../app/composables/useMaps'

const api = vi.hoisted(() => ({
  maps: { list: vi.fn(), tree: vi.fn(), createKey: vi.fn(), updateKey: vi.fn() },
  items: { upload: vi.fn(), load: vi.fn() },
}))
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

describe('Map background', () => {
  const file = { name: 'sea.png' }
  const duplicated = Object.assign(new Error('KO_DUPLICATED'), { code: 'KO_DUPLICATED' })

  beforeEach(() => {
    api.maps.updateKey.mockImplementation(async (key, fields) => ({ ...key, ...fields }))
  })

  it('uploads the image and saves its file name on the Map', async () => {
    const { maps, tree, open, setBackground } = useMaps()
    await open()
    api.items.upload.mockResolvedValue({ Id: 'i1', FileName: 'i1.png', ItemName: 'sea.png' })

    await setBackground(file)

    expect(api.items.upload).toHaveBeenCalledWith(file)
    expect(api.maps.updateKey).toHaveBeenCalledWith(expect.objectContaining({ Id: 'm1' }), {
      BackgroundImage: 'i1.png',
      BackgroundImageChanged: true,
    })
    expect(tree.value.BackgroundImage).toBe('i1.png')
    expect(maps.value[0].BackgroundImage).toBe('i1.png')
    // The Epikeys of the Map are untouched.
    expect(tree.value.Children).toHaveLength(1)
  })

  it('uses the image already in the Catalog when the upload is refused as a duplicate', async () => {
    const { tree, open, setBackground } = useMaps()
    await open()
    api.items.upload.mockRejectedValue(duplicated)
    api.items.load.mockResolvedValue({
      items: [
        { Id: 'x', ItemName: 'sea.png.bak', FileName: 'x.png' },
        { Id: 'i7', ItemName: 'sea.png', FileName: 'i7.png' },
      ],
    })

    await setBackground(file)

    expect(api.items.load).toHaveBeenCalledWith({ type: 'Video', search: 'sea.png' })
    expect(tree.value.BackgroundImage).toBe('i7.png')
  })

  it('fails when the duplicate cannot be found, or the upload fails, leaving the Map as it was', async () => {
    const { tree, open, setBackground } = useMaps()
    await open()

    api.items.upload.mockRejectedValue(duplicated)
    api.items.load.mockResolvedValue({ items: [] })
    await expect(setBackground(file)).rejects.toMatchObject({ code: 'KO_DUPLICATED' })

    api.items.upload.mockRejectedValue(Object.assign(new Error('full'), { code: 'QUOTA_EXCEEDED' }))
    await expect(setBackground(file)).rejects.toMatchObject({ code: 'QUOTA_EXCEEDED' })

    expect(api.maps.updateKey).not.toHaveBeenCalled()
    expect(tree.value.BackgroundImage).toBeUndefined()
  })

  it('puts an image already in the Catalog behind the Map, without uploading anything', async () => {
    const { tree, open, setBackgroundFromCatalog } = useMaps()
    await open()

    await setBackgroundFromCatalog({ Id: 'i3', FileName: 'dreaming.jpg', ItemName: 'Dreaming' })

    expect(api.items.upload).not.toHaveBeenCalled()
    expect(api.maps.updateKey).toHaveBeenCalledWith(expect.objectContaining({ Id: 'm1' }), {
      BackgroundImage: 'dreaming.jpg',
      BackgroundImageChanged: true,
    })
    expect(tree.value.BackgroundImage).toBe('dreaming.jpg')
  })

  it('removes the image from the Map', async () => {
    const { tree, open, removeBackground } = useMaps()
    await open()
    tree.value = { ...tree.value, BackgroundImage: 'i1.png' }

    await removeBackground()

    expect(api.maps.updateKey).toHaveBeenCalledWith(expect.objectContaining({ Id: 'm1' }), {
      BackgroundImage: null,
      BackgroundImageChanged: false,
    })
    expect(tree.value.BackgroundImage).toBeNull()
  })

  it('saves how much the image is darkened, between 0 and 1', async () => {
    const { tree, open, setBackgroundDim } = useMaps()
    await open()

    await setBackgroundDim(0.35)
    expect(api.maps.updateKey).toHaveBeenLastCalledWith(expect.anything(), {
      Opacity: 0.35,
      OpacityChanged: true,
    })
    expect(tree.value.Opacity).toBe(0.35)

    await setBackgroundDim(7)
    expect(tree.value.Opacity).toBe(1)
  })
})
