// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createApiClient } from '../../app/services/api/client'
import { createItemsApi } from '../../app/services/api/items'

function itemsWith(status, data) {
  const fetchRaw = vi.fn().mockResolvedValue({ status, _data: data })
  return { fetchRaw, items: createItemsApi(createApiClient({ baseURL: 'http://api.test/api/', fetchRaw })) }
}

const record = (fields) => ({ UserId: 'u1', Signature: 'AA-BB', Gain: 100, deleted_at: null, ...fields })

describe('items API: upload', () => {
  it('sends one file in the field the backend expects and returns the new content', async () => {
    const { fetchRaw, items } = itemsWith(200, [
      {
        mediaItem: record({
          Id: 'i1',
          FileName: 'i1.png',
          ItemName: 'sea.png',
          MediaType: 1,
          MediaSubType: 0,
        }),
      },
    ])
    const file = new File(['x'], 'sea.png', { type: 'image/png' })

    const item = await items.upload(file)

    const [path, options] = fetchRaw.mock.calls[0]
    expect(path).toBe('items/upload')
    expect(options.method).toBe('POST')
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.getAll('fileUpload')).toEqual([file])
    expect(item).toEqual({ Id: 'i1', FileName: 'i1.png', ItemName: 'sea.png', MediaType: 1, MediaSubType: 0 })
  })

  it('reports a file already in the Catalog, refused with 409 and no body', async () => {
    const { items } = itemsWith(409, undefined)
    await expect(items.upload(new File(['x'], 'a.png'))).rejects.toMatchObject({
      code: 'KO_DUPLICATED',
      status: 409,
    })
  })

  it('reports the storage space running out', async () => {
    const { items } = itemsWith(409, 'QUOTA_EXCEEDED')
    await expect(items.upload(new File(['x'], 'a.png'))).rejects.toMatchObject({ code: 'QUOTA_EXCEEDED' })
  })

  it('rejects an answer without the uploaded content', async () => {
    const { items } = itemsWith(200, [])
    await expect(items.upload(new File(['x'], 'a.png'))).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
})

describe('items API: load', () => {
  it('asks for a page of a section and flattens the groups', async () => {
    const { fetchRaw, items } = itemsWith(200, {
      Result: 'OK',
      Data: {
        Items: [
          {
            Name: 'All',
            IsLeaf: true,
            Items: [record({ Id: 'a', ItemName: 'A' }), record({ Id: 'b', ItemName: 'B' })],
          },
          { Name: 'Other', IsLeaf: true, Items: [record({ Id: 'c' })] },
        ],
        Tags: [],
        Count: 9,
        More: true,
      },
    })

    const page = await items.load({ type: 'Video', search: '  sea.png ', page: 2, pageSize: 3 })

    expect(fetchRaw).toHaveBeenCalledWith(
      'items/load',
      expect.objectContaining({
        method: 'POST',
        body: { Type: 'Video', Search: 'sea.png', Order: 'ImportDate desc', Group: '', Page: 2, PageSize: 3 },
      }),
    )
    expect(page).toEqual({
      items: [{ Id: 'a', ItemName: 'A' }, { Id: 'b', ItemName: 'B' }, { Id: 'c' }],
      count: 9,
      more: true,
    })
  })

  it('asks for everything when there is nothing to search, and copes with an empty section', async () => {
    const { fetchRaw, items } = itemsWith(200, {
      Result: 'OK',
      Data: { Items: [], Tags: [], Count: 0, More: false },
    })

    await expect(items.load({ type: 'Audio' })).resolves.toEqual({ items: [], count: 0, more: false })
    expect(fetchRaw.mock.calls[0][1].body).toMatchObject({
      Type: 'Audio',
      Search: '*',
      Page: 0,
      PageSize: 50,
    })
  })
})
