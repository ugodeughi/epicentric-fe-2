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
})
