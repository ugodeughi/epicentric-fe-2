<script setup>
/** A content of the Catalog: thumbnail or icon, name, details, Links, Freeze. */
const props = defineProps({
  /** @type {import('vue').PropType<import('~/schemas/item').Item>} */
  item: { type: Object, required: true },
  /** This content is the one playing. */
  playing: { type: Boolean, default: false },
})

const emit = defineEmits(['freeze', 'play'])

const { t } = useI18n()
const { thumb } = useMediaUrl()

const kind = computed(() => itemKind(props.item))
const icon = computed(
  () =>
    ({ audio: 'music', image: 'image', video: 'video', embed: 'video', file: 'file', bookmark: 'bookmark' })[
      kind.value
    ],
)
const tone = computed(
  () =>
    ({
      audio: 'audio',
      image: 'visual',
      video: 'visual',
      embed: 'visual',
      file: 'file',
      bookmark: 'bookmark',
    })[kind.value],
)
const extension = computed(() => (props.item.FileExtension ?? '').toLowerCase())

// Images and videos have a thumbnail; when it is missing the icon stays.
const thumbUrl = computed(() => (['image', 'video'].includes(kind.value) ? thumb(props.item.Id) : null))
const thumbFailed = ref(false)
watch(thumbUrl, () => {
  thumbFailed.value = false
})

const title = computed(() => itemTitle(props.item))
const details = computed(() => {
  const kindName = t(`catalog.kinds.${kind.value}`)
  const who = props.item.Artist?.trim()
  return [who || kindName, extension.value].filter(Boolean).join(' · ')
})
const corner = computed(() => formatDuration(props.item.Duration) || extension.value)
const frozen = computed(() => Boolean(props.item.IsFreezed))
// Audio only for now: videos come with the full player.
const playable = computed(() => kind.value === 'audio')
</script>

<template>
  <article class="content" :class="[`content--${tone}`, { 'content--frozen': frozen }]">
    <div class="content__thumb">
      <img
        v-if="thumbUrl && !thumbFailed"
        class="content__image"
        :src="thumbUrl"
        alt=""
        loading="lazy"
        @error="thumbFailed = true"
      />
      <UiIcon v-else class="content__icon" :name="icon" :size="40" />
      <button
        v-if="playable"
        type="button"
        class="content__play"
        :aria-pressed="playing"
        :aria-label="t(playing ? 'catalog.pause' : 'catalog.play', { name: title })"
        @click="emit('play')"
      >
        <UiIcon :name="playing ? 'pause' : 'playSolid'" :size="22" />
      </button>
      <span v-if="frozen" class="content__badge content__badge--frozen">Frozen</span>
      <span v-if="corner" class="content__badge content__badge--corner tabular">{{ corner }}</span>
      <button
        type="button"
        class="content__freeze"
        :aria-pressed="frozen"
        :aria-label="t(frozen ? 'catalog.unfreeze' : 'catalog.freeze', { name: title })"
        :title="t(frozen ? 'catalog.unfreezeShort' : 'catalog.freezeShort')"
        @click="emit('freeze', !frozen)"
      >
        <UiIcon name="freeze" :size="18" />
      </button>
    </div>
    <div class="content__text">
      <h3 class="content__title" :title="title">{{ title }}</h3>
      <p class="content__details">{{ details }}</p>
      <p class="content__links">
        {{ item.LinksCount ? t('catalog.linksCount', item.LinksCount) : t('catalog.noLinks') }}
      </p>
    </div>
  </article>
</template>

<style scoped>
.content {
  --_tone: var(--content-file);

  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  min-width: 0;
  padding: var(--s-2);
  border-radius: var(--content-card-radius);
  background: var(--content-card-bg);
  transition: opacity var(--motion);
}

.content--audio {
  --_tone: var(--content-audio);
}

.content--visual {
  --_tone: var(--content-visual);
}

.content--bookmark {
  --_tone: var(--content-bookmark);
}

.content--frozen .content__image,
.content--frozen .content__icon,
.content--frozen .content__text {
  opacity: var(--content-frozen-opacity);
}

.content__thumb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: var(--content-thumb-radius);
  background: var(--content-thumb-bg);
  color: var(--_tone);
}

.content__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content__badge {
  position: absolute;
  padding: 2px var(--s-2);
  border-radius: var(--r-pill);
  background: var(--content-badge-bg);
  color: var(--content-badge-fg);
  font-size: var(--fs-caption);
  font-weight: var(--fw-bold);
}

.content__badge--corner {
  right: var(--s-2);
  bottom: var(--s-2);
}

.content__badge--frozen {
  bottom: var(--s-2);
  left: var(--s-2);
}

.content__play {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  padding: 0;
  border: 0;
  border-radius: var(--r-pill);
  background: var(--player-button-bg);
  box-shadow: var(--btn-primary-shadow);
  color: var(--player-button-fg);
  cursor: pointer;
  transform: translate(-50%, -50%);
}

.content__play:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* With a play button in the middle, the type icon is not needed. */
.content__thumb:has(.content__play) .content__icon {
  visibility: hidden;
}

.content__freeze {
  position: absolute;
  top: var(--s-2);
  right: var(--s-2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: var(--r-pill);
  background: var(--content-badge-bg);
  color: var(--content-badge-fg);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--motion);
}

/* Shown on hover and focus, and always when frozen or on touch screens. */
.content:hover .content__freeze,
.content__freeze:focus-visible,
.content__freeze[aria-pressed='true'] {
  opacity: 1;
}

@media (hover: none) {
  .content__freeze {
    opacity: 1;
  }
}

.content__freeze[aria-pressed='true'] {
  background: var(--_tone);
  color: var(--hex-fg);
}

.content__freeze:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.content__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 0 var(--s-1) var(--s-1);
}

.content__title {
  overflow: hidden;
  font-size: var(--fs-body);
  font-weight: var(--fw-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content__details,
.content__links {
  overflow: hidden;
  color: var(--fg-muted);
  font-size: var(--fs-small);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content__links {
  font-size: var(--fs-caption);
}
</style>
