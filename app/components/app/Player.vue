<script setup>
/**
 * The player bar, at the bottom of every app page while something is playing. It owns
 * the only <audio> element and follows `usePlayer`.
 */
const { t } = useI18n()
const toast = useToast()
const { stream } = useMediaUrl()
const { tracks, index, status, current, toggle, next, previous, stop, onStarted, onEnded, onFailed } =
  usePlayer()

const audio = ref(null)
const elapsed = ref(0)

const src = computed(() => stream(current.value?.Id))
const length = computed(() => current.value?.PlayDuration || current.value?.Item?.Duration || 0)
const title = computed(() => (current.value?.Item ? itemTitle(current.value.Item) : ''))
const artist = computed(() => current.value?.Item?.Artist ?? '')
const progress = computed(() => (length.value ? Math.min(1, elapsed.value / length.value) : 0))
const visible = computed(() => status.value !== 'idle')

// A new track: a new stream from its start.
watch(src, async (value) => {
  elapsed.value = 0
  await nextTick()
  if (!audio.value) return
  if (!value) {
    audio.value.removeAttribute('src')
    audio.value.load()
    return
  }
  audio.value.src = value
  play()
})

// Pause and resume ask the element; after an error the stream is opened again.
watch(status, (value, previousValue) => {
  if (!audio.value || !src.value) return
  if (value === 'paused') audio.value.pause()
  if (value === 'loading' && previousValue === 'paused') play()
  if (value === 'loading' && previousValue === 'error') {
    audio.value.src = src.value
    play()
  }
})

function play() {
  audio.value.play().catch((error) => {
    // A Play started by the user is allowed; anything else is reported.
    if (error?.name !== 'AbortError') fail()
  })
}

function fail() {
  onFailed()
  toast.error(t('player.error', { name: title.value }))
}

// The page keeps room for the bar, so it never covers the last contents. Its height
// changes with the screen (two lines on phones): it is measured.
const bar = ref(null)
let observer
function setOffset(height) {
  document.documentElement.style.setProperty(
    '--player-offset',
    height ? `${Math.ceil(height) + 16}px` : '0px',
  )
}
onMounted(() => {
  observer = new ResizeObserver(([entry]) =>
    setOffset(visible.value ? (entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height) : 0),
  )
  observer.observe(bar.value)
})
watch(visible, (value) => setOffset(value ? bar.value?.offsetHeight : 0))
onBeforeUnmount(() => {
  observer?.disconnect()
  document.documentElement.style.removeProperty('--player-offset')
})

// Media keys and the lock screen of phones.
watch(current, (track) => {
  if (!import.meta.client || !('mediaSession' in navigator)) return
  navigator.mediaSession.metadata = track
    ? new MediaMetadata({ title: title.value, artist: artist.value })
    : null
})
onMounted(() => {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.setActionHandler('play', toggle)
  navigator.mediaSession.setActionHandler('pause', toggle)
  navigator.mediaSession.setActionHandler('nexttrack', next)
  navigator.mediaSession.setActionHandler('previoustrack', previous)
})
</script>

<template>
  <div v-show="visible" ref="bar" class="player" role="region" :aria-label="t('player.label')">
    <audio
      ref="audio"
      preload="none"
      @playing="onStarted"
      @ended="onEnded"
      @error="src && fail()"
      @timeupdate="elapsed = $event.target.currentTime"
    />
    <div class="player__track">
      <p class="player__title" :title="title">
        {{ status === 'loading' && !title ? t('player.loading') : title }}
      </p>
      <p class="player__artist">
        {{ artist }}
        <span v-if="tracks.length > 1" class="tabular">{{ index + 1 }} / {{ tracks.length }}</span>
      </p>
    </div>

    <div class="player__controls">
      <button
        v-if="tracks.length > 1"
        type="button"
        class="player__button"
        :aria-label="t('player.previous')"
        @click="previous"
      >
        <UiIcon name="previous" />
      </button>
      <button
        type="button"
        class="player__button player__button--main"
        :aria-label="status === 'playing' ? t('player.pause') : t('player.play')"
        :disabled="!current"
        @click="toggle"
      >
        <UiIcon :name="status === 'playing' ? 'pause' : 'playSolid'" :size="24" />
      </button>
      <button
        v-if="tracks.length > 1"
        type="button"
        class="player__button"
        :aria-label="t('player.next')"
        @click="next"
      >
        <UiIcon name="next" />
      </button>
    </div>

    <div class="player__time tabular">
      <span>{{ formatDuration(elapsed) || '0:00' }}</span>
      <span class="player__bar" aria-hidden="true"
        ><span :style="{ transform: `scaleX(${progress})` }"
      /></span>
      <span>{{ formatDuration(length) }}</span>
    </div>

    <button type="button" class="player__button" :aria-label="t('player.close')" @click="stop">
      <UiIcon name="close" />
    </button>
  </div>
</template>

<style scoped>
.player {
  position: fixed;
  right: var(--s-6);
  bottom: var(--s-4);
  left: calc(236px + var(--s-6));
  z-index: 15;
  display: flex;
  align-items: center;
  gap: var(--s-4);
  min-height: var(--player-height);
  padding: var(--s-2) var(--s-3) var(--s-2) var(--s-5);
  border-radius: var(--player-radius);
  background: var(--player-bg);
  box-shadow: var(--player-shadow);
  color: var(--player-fg);
}

.player__track {
  flex: 1 1 180px;
  min-width: 0;
}

.player__title {
  overflow: hidden;
  font-weight: var(--fw-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player__artist {
  display: flex;
  gap: var(--s-2);
  overflow: hidden;
  color: var(--player-muted);
  font-size: var(--fs-small);
  white-space: nowrap;
}

.player__controls {
  display: flex;
  align-items: center;
  gap: var(--s-1);
}

.player__button {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: var(--tap);
  height: var(--tap);
  padding: 0;
  border: 0;
  border-radius: var(--r-pill);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.player__button--main {
  width: 52px;
  height: 52px;
  background: var(--player-button-bg);
  color: var(--player-button-fg);
}

.player__button:disabled {
  opacity: 0.5;
  cursor: default;
}

.player__button:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.player__time {
  display: flex;
  flex: 2 1 220px;
  align-items: center;
  gap: var(--s-3);
  color: var(--player-muted);
  font-size: var(--fs-small);
}

.player__bar {
  flex: 1;
  height: 6px;
  overflow: hidden;
  border-radius: var(--r-pill);
  background: var(--player-track);
}

.player__bar span {
  display: block;
  height: 100%;
  background: var(--player-progress);
  transform-origin: left;
  transition: transform 250ms linear;
}

@media (prefers-reduced-motion: reduce) {
  .player__bar span {
    transition: none;
  }
}

/* Phone: above the tab bar, title and buttons on one line, the time line under them. */
@media (width < 800px) {
  .player {
    right: var(--s-2);
    bottom: calc(76px + env(safe-area-inset-bottom));
    left: var(--s-2);
    flex-wrap: wrap;
    gap: var(--s-2);
    padding: var(--s-2) var(--s-2) var(--s-2) var(--s-4);
  }

  .player__time {
    flex-basis: 100%;
    order: 4;
    padding-right: var(--s-2);
  }
}
</style>
