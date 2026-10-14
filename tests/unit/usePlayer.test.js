import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlayer } from '../../app/composables/usePlayer'

const api = vi.hoisted(() => ({ playback: { fromItems: vi.fn() } }))
mockNuxtImport('useApi', () => () => api)

const track = (Id, itemId) => ({ Id, PlayDuration: 10, Item: { Id: itemId, ItemName: `${itemId}.mp3` } })

beforeEach(() => {
  vi.clearAllMocks()
  clearNuxtState()
})

describe('usePlayer', () => {
  it('plays Catalog contents through a new playlist, and says which card is playing', async () => {
    api.playback.fromItems.mockResolvedValue({ AudioTracks: [track('t1', 'a'), track('t2', 'b')] })
    const { current, status, playItems, onStarted, isPlaying } = usePlayer()

    await playItems(['a', 'b'])
    expect(api.playback.fromItems).toHaveBeenCalledWith(['a', 'b'])
    expect(current.value.Id).toBe('t1')
    expect(status.value).toBe('loading')
    expect(isPlaying('a')).toBe(true)

    onStarted()
    expect(status.value).toBe('playing')
    expect(isPlaying('b')).toBe(false)
  })

  it('pauses, resumes, goes to the next track and stops at the end', async () => {
    api.playback.fromItems.mockResolvedValue({ AudioTracks: [track('t1', 'a'), track('t2', 'b')] })
    const { current, status, playItems, onStarted, toggle, onEnded, isPlaying } = usePlayer()
    await playItems(['a', 'b'])
    onStarted()

    toggle()
    expect(status.value).toBe('paused')
    expect(isPlaying('a')).toBe(false)
    toggle()
    expect(status.value).toBe('loading')

    onEnded()
    expect(current.value.Id).toBe('t2')
    onEnded()
    expect(current.value).toBeNull()
    expect(status.value).toBe('idle')
  })

  it('reports a playlist with nothing to play, and a failed request', async () => {
    const { status, playItems } = usePlayer()

    api.playback.fromItems.mockResolvedValueOnce({ AudioTracks: [] })
    await expect(playItems(['a'])).rejects.toMatchObject({ code: 'EMPTY_PLAYLIST' })
    expect(status.value).toBe('error')

    api.playback.fromItems.mockRejectedValueOnce(new Error('down'))
    await expect(playItems(['a'])).rejects.toThrow('down')
    expect(status.value).toBe('error')
  })

  it('keeps only the last Play when two overlap', async () => {
    let answerFirst
    api.playback.fromItems
      .mockReturnValueOnce(new Promise((resolve) => (answerFirst = resolve)))
      .mockResolvedValueOnce({ AudioTracks: [track('t2', 'b')] })
    const { current, playItems } = usePlayer()

    const first = playItems(['a'])
    await playItems(['b'])
    answerFirst({ AudioTracks: [track('t1', 'a')] })
    await first

    expect(current.value.Id).toBe('t2')
  })

  it('lets an error be retried, and closes', async () => {
    api.playback.fromItems.mockResolvedValue({ AudioTracks: [track('t1', 'a')] })
    const { status, current, playItems, onFailed, resume, stop } = usePlayer()
    await playItems(['a'])

    onFailed()
    expect(status.value).toBe('error')
    resume()
    expect(status.value).toBe('loading')

    stop()
    expect(current.value).toBeNull()
    expect(status.value).toBe('idle')
  })
})
