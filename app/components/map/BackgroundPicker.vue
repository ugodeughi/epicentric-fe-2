<script setup>
defineProps({
  /** File name of the image in use, to mark it in the list. */
  current: { type: String, default: null },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['pick'])

const { t } = useI18n()
const { thumb } = useMediaUrl()
const { images, more, status, find, loadMore } = useCatalogImages()

const search = ref('')
let timer
// The backend has no rate limiting: search only once the user stops typing.
watch(search, (text) => {
  clearTimeout(timer)
  timer = setTimeout(() => find(text), 300)
})
onMounted(() => find())
onBeforeUnmount(() => clearTimeout(timer))

// A thumbnail that cannot be loaded leaves the name of the image in its place.
const broken = ref(new Set())
function onBroken(id) {
  broken.value = new Set(broken.value).add(id)
}
</script>

<template>
  <div class="picker">
    <UiField v-model="search" :label="t('maps.background.search')" type="search" />

    <ul v-if="images.length" class="picker__grid">
      <li v-for="item in images" :key="item.Id">
        <button
          type="button"
          class="picker__item"
          :title="item.ItemName"
          :aria-pressed="item.FileName === current"
          :disabled="disabled"
          @click="emit('pick', item)"
        >
          <span v-if="broken.has(item.Id)" class="picker__name">{{ item.ItemName }}</span>
          <img
            v-else
            :src="thumb(item.Id)"
            :alt="item.ItemName ?? ''"
            loading="lazy"
            @error="onBroken(item.Id)"
          />
        </button>
      </li>
    </ul>

    <p v-if="status === 'loading'" class="muted" role="status">{{ t('maps.background.loading') }}</p>
    <UiAlert v-else-if="status === 'error'">{{ t('maps.background.errors.catalog') }}</UiAlert>
    <p v-else-if="status === 'ready' && !images.length" class="muted">
      {{ search.trim() ? t('maps.background.noMatch') : t('maps.background.empty') }}
    </p>

    <UiButton v-if="more && status !== 'loading'" variant="ghost" @click="loadMore">
      {{ t('maps.background.more') }}
    </UiButton>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: var(--s-2);
  max-height: 264px;
  margin: 0;
  padding: 2px;
  overflow-y: auto;
  list-style: none;
}

.picker__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: var(--map-preview-radius);
  background: var(--inset-bg);
  color: var(--fg-soft);
  cursor: pointer;
}

.picker__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.picker__name {
  padding: var(--s-1);
  overflow: hidden;
  font-size: var(--fs-caption);
  overflow-wrap: anywhere;
}

.picker__item[aria-pressed='true'] {
  outline: var(--swatch-selected-outline);
  outline-offset: -2px;
}

.picker__item:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}

.picker__item:disabled {
  cursor: default;
  opacity: 0.6;
}
</style>
