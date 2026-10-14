// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createApiClient } from '../../app/services/api/client'
import { createPlaybackApi } from '../../app/services/api/playback'

describe('playback API', () => {
  it('makes the playlist from Catalog contents and keeps the fields the player reads', async () => {
    const fetchRaw = vi.fn().mockResolvedValue({
      status: 200,
      _data: {
        Result: 'OK',
        Data: {
          Id: 'u1',
          AudioPosition: {},
          VideoTracks: [],
          AudioTracks: [
            {
              Id: 'lfh6vn',
              Position: 0,
              SkipTo: 0,
              PlayDuration: 6,
              Gain: 100,
              Item: { Id: 'i1', ItemName: 'a.wav', Duration: 6, Gain: 100 },
            },
          ],
        },
      },
    })
    const playback = createPlaybackApi(createApiClient({ baseURL: 'http://api.test/api/', fetchRaw }))

    await expect(playback.fromItems(['i1'])).resolves.toEqual({
      Id: 'u1',
      AudioTracks: [
        { Id: 'lfh6vn', SkipTo: 0, PlayDuration: 6, Item: { Id: 'i1', ItemName: 'a.wav', Duration: 6 } },
      ],
    })
    expect(fetchRaw).toHaveBeenCalledWith(
      'items/playlist',
      expect.objectContaining({ method: 'POST', body: { Items: ['i1'] } }),
    )
  })
})
