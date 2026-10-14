// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createApiClient } from '../../app/services/api/client'
import { createMapsApi } from '../../app/services/api/maps'

// A backend record carries many more fields than the client keeps.
const record = (fields) => ({
  UserId: 'u1',
  Gain: 100,
  EqualizerId: 'rock',
  Zoom: 1,
  deleted_at: null,
  ...fields,
})

function mapsWith(data) {
  const fetchRaw = vi.fn().mockResolvedValue({ status: 200, _data: { Result: 'OK', Data: data } })
  return { fetchRaw, maps: createMapsApi(createApiClient({ baseURL: 'http://api.test/api/', fetchRaw })) }
}

describe('maps API', () => {
  it('lists the Maps keeping only the fields the app reads', async () => {
    const { fetchRaw, maps } = mapsWith([
      record({ Id: 'm1', Text: 'My first map', IsRoot: true, ParentId: null }),
    ])

    await expect(maps.list()).resolves.toEqual([
      { Id: 'm1', Text: 'My first map', IsRoot: true, ParentId: null },
    ])
    expect(fetchRaw).toHaveBeenCalledWith('maps/load', expect.objectContaining({ method: 'GET' }))
  })

  it('loads a Map with its whole subtree', async () => {
    const { fetchRaw, maps } = mapsWith(
      record({
        Id: 'm1',
        Text: 'Map',
        Horizontal: false,
        Children: [
          record({ Id: 'k1', Text: 'Joy', Color: '#4FC1A6', Children: [record({ Id: 'k2', Children: [] })] }),
        ],
      }),
    )

    await expect(maps.tree('m 1')).resolves.toEqual({
      Id: 'm1',
      Text: 'Map',
      Horizontal: false,
      Children: [{ Id: 'k1', Text: 'Joy', Color: '#4FC1A6', Children: [{ Id: 'k2', Children: [] }] }],
    })
    expect(fetchRaw).toHaveBeenCalledWith('maps/key/m%201/loadrecursive', expect.anything())
  })

  it('rejects a tree whose Epikeys have no id', async () => {
    const { maps } = mapsWith({ Id: 'm1', Children: [{ Text: 'broken' }] })
    await expect(maps.tree('m1')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('creates an Epikey under a parent with the backend field names', async () => {
    const { fetchRaw, maps } = mapsWith(
      record({ Id: 'k9', Text: 'Calm', ParentId: 'm1', IsRoot: false, Order: 3 }),
    )

    const created = await maps.createKey({ parentId: 'm1', text: '  Calm ', color: '#7FD1E8', order: 3 })

    expect(fetchRaw).toHaveBeenCalledWith(
      'maps/key/save',
      expect.objectContaining({
        method: 'POST',
        body: { Text: 'Calm', ParentId: 'm1', IsRoot: false, Color: '#7FD1E8', Order: 3 },
      }),
    )
    expect(created).toEqual({ Id: 'k9', Text: 'Calm', ParentId: 'm1', IsRoot: false, Order: 3 })
  })

  it('changes fields of an Epikey, always saying who its parent is or that it is a Map', async () => {
    const { fetchRaw, maps } = mapsWith(
      record({ Id: 'm1', IsRoot: true, BackgroundImage: 'i1.png', Opacity: 0.4 }),
    )

    const saved = await maps.updateKey({ Id: 'm1', IsRoot: true, Text: 'Map' }, { BackgroundImage: 'i1.png' })

    expect(fetchRaw).toHaveBeenCalledWith(
      'maps/key/save',
      expect.objectContaining({
        method: 'POST',
        body: { Id: 'm1', ParentId: null, IsRoot: true, BackgroundImage: 'i1.png' },
      }),
    )
    expect(saved).toEqual({ Id: 'm1', IsRoot: true, BackgroundImage: 'i1.png', Opacity: 0.4 })

    await maps.updateKey({ Id: 'k1', ParentId: 'm1' }, { Text: 'New name' })
    expect(fetchRaw.mock.calls[1][1].body).toEqual({
      Id: 'k1',
      ParentId: 'm1',
      IsRoot: false,
      Text: 'New name',
    })
  })

  it('creates an empty Map as a root Epikey', async () => {
    const { fetchRaw, maps } = mapsWith(record({ Id: 'm9', Text: 'Travels', IsRoot: true, ParentId: null }))

    await expect(maps.createMap({ text: ' Travels ', order: 4 })).resolves.toMatchObject({ Id: 'm9' })
    expect(fetchRaw).toHaveBeenCalledWith(
      'maps/key/save',
      expect.objectContaining({ body: { Text: 'Travels', ParentId: null, IsRoot: true, Order: 4 } }),
    )
  })

  it('deletes, moves and orders Epikeys with the bodies the backend reads', async () => {
    const { fetchRaw, maps } = mapsWith({ Result: true })

    await maps.deleteKey('k 1')
    await maps.moveKey('k1', 'k2')
    await maps.setOrder(['k3', 'k1'])

    expect(fetchRaw.mock.calls.map(([path, options]) => [path, options.method, options.body])).toEqual([
      ['maps/key/k%201/delete', 'DELETE', undefined],
      ['maps/key/move', 'POST', { Item: { SourceId: 'k1', DestinationId: 'k2' } }],
      ['maps/key/setorder', 'POST', { Items: ['k3', 'k1'] }],
    ])
  })

  it('lists the templates with their Maps, ignoring the fields the app does not read', async () => {
    const { maps } = mapsWith([
      {
        Id: 't1',
        Name: 'AUDIO Templates',
        Description: '<p>Audio</p>',
        BackgroundImage: 'audio.jpg',
        Maps: [
          record({ Id: 'tm1', Text: 'MY AUDIO LIBRARY', Children: [record({ Id: 'tk1', Text: 'Stories' })] }),
        ],
      },
    ])

    await expect(maps.templates()).resolves.toEqual([
      {
        Id: 't1',
        Name: 'AUDIO Templates',
        Description: '<p>Audio</p>',
        Maps: [{ Id: 'tm1', Text: 'MY AUDIO LIBRARY', Children: [{ Id: 'tk1', Text: 'Stories' }] }],
      },
    ])
  })

  it('copies a template Map without its Links, or a template Epikey under a parent', async () => {
    const { fetchRaw, maps } = mapsWith(record({ Id: 'new', Text: 'Copy', IsRoot: true }))

    await maps.importTemplate('tm1')
    await maps.addTemplateKey({ parentId: 'm1', templateKeyId: 'tk1' })

    expect(fetchRaw.mock.calls.map(([path, options]) => [path, options.body])).toEqual([
      ['maps/templates/import', { Item: { Id: 'tm1' }, ImportMedia: false }],
      ['maps/key/template/add', { ParentId: 'm1', Item: 'tk1' }],
    ])
  })
})
