/**
 * What is being listened to. This is the first piece of the player (phase 2.7): it plays
 * the audio of Catalog contents, one playlist at a time. The `<audio>` element lives in
 * `AppPlayer`, which follows this state and reports back with `onStarted`, `onEnded`, …
 */
export function usePlayer() {
  const api = useApi()

  /** @type {import('vue').Ref<import('~/schemas/playlist').AudioTrack[]>} */
  const tracks = useState('player:tracks', () => [])
  const index = useState('player:index', () => 0)
  /** 'idle' | 'loading' | 'playing' | 'paused' | 'error' */
  const status = useState('player:status', () => 'idle')
  /** Contents asked for with the last Play, to show which card is playing. */
  const itemIds = useState('player:items', () => [])

  const current = computed(() => tracks.value[index.value] ?? null)
  // Answers of a Play the user has already replaced are dropped.
  let request = 0

  /**
   * Plays Catalog contents, in their order. Replaces what was playing.
   * @param {string[]} ids
   */
  async function playItems(ids) {
    const mine = ++request
    itemIds.value = ids
    status.value = 'loading'
    try {
      const playlist = await api.playback.fromItems(ids)
      if (mine !== request) return
      tracks.value = playlist.AudioTracks ?? []
      index.value = 0
      status.value = tracks.value.length ? 'loading' : 'error'
      if (!tracks.value.length) throw Object.assign(new Error('Nothing to play'), { code: 'EMPTY_PLAYLIST' })
    } catch (error) {
      if (mine !== request) return
      status.value = 'error'
      throw error
    }
  }

  function pause() {
    if (status.value === 'playing') status.value = 'paused'
  }

  function resume() {
    if (current.value && ['paused', 'error'].includes(status.value)) status.value = 'loading'
  }

  function toggle() {
    if (status.value === 'playing') pause()
    else resume()
  }

  /** Next track, or the end of the playlist. */
  function next() {
    if (index.value < tracks.value.length - 1) {
      index.value++
      status.value = 'loading'
    } else {
      stop()
    }
  }

  /** Previous track; at the first one, back to its start. */
  function previous() {
    index.value = Math.max(0, index.value - 1)
    status.value = 'loading'
  }

  function stop() {
    request++
    tracks.value = []
    index.value = 0
    itemIds.value = []
    status.value = 'idle'
  }

  /** Whether a content of the Catalog is the one playing (or about to). */
  function isPlaying(itemId) {
    return (
      ['loading', 'playing'].includes(status.value) &&
      (current.value?.Item?.Id ?? itemIds.value[0]) === itemId
    )
  }

  // Reports of the <audio> element.
  const onStarted = () => {
    if (status.value === 'loading') status.value = 'playing'
  }
  const onFailed = () => {
    status.value = 'error'
  }

  return {
    tracks,
    index,
    status,
    current,
    playItems,
    pause,
    resume,
    toggle,
    next,
    previous,
    stop,
    isPlaying,
    onStarted,
    onEnded: next,
    onFailed,
  }
}
