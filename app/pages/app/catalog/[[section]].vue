<script setup>
definePageMeta({ layout: 'app' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { items, count, more, status, counts, show, loadMore, reload, loadCounts, setFrozen, upload } =
  useCatalog()
const player = usePlayer()

useHead({ title: 'Catalog · Epicentric' })

// Section in the path, search and order in the query: the view survives a reload and can be shared.
const section = computed(() => (route.params.section in CATALOG_SECTIONS ? route.params.section : null))
const search = computed(() => String(route.query.q ?? ''))
const sort = computed(() => (route.query.sort in CATALOG_SORTS ? route.query.sort : 'recent'))

// Section names are product terms and are not translated.
const SECTION_LABELS = { audio: 'Audio', visual: 'Visual', files: 'Other Files', bookmarks: 'Bookmarks' }
const tabs = computed(() =>
  Object.keys(CATALOG_SECTIONS).map((value) => ({
    value,
    label: SECTION_LABELS[value],
    count: counts.value[value],
  })),
)

function goToSection(value) {
  // Search and order stay; the filters belong to the list just left.
  navigateTo({ path: `/app/catalog/${value}`, query: route.query })
}

async function load() {
  if (!section.value) {
    await navigateTo({ path: '/app/catalog/audio', query: route.query }, { replace: true })
    return
  }
  try {
    await show({ section: section.value, search: search.value, sort: sort.value })
  } catch {
    // The page shows the error state from `status`.
  }
}

watch([section, search, sort], load)
onMounted(() => {
  load()
  loadCounts()
})

// Search: the address changes 300 ms after the last key.
const searchText = ref(search.value)
watch(search, (value) => {
  if (value !== searchText.value.trim()) searchText.value = value
})
let searchTimer
watch(searchText, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    const q = value.trim()
    if (q === search.value) return
    router.replace({ query: { ...route.query, q: q || undefined } })
  }, 300)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

const sorts = computed(() =>
  Object.keys(CATALOG_SORTS).map((value) => ({ value, label: t(`catalog.sort.${value}`) })),
)

function onSort(event) {
  router.replace({
    query: { ...route.query, sort: event.target.value === 'recent' ? undefined : event.target.value },
  })
}

// Filters on the contents already loaded: the backend cannot filter by Links or Freeze.
const withoutLinks = ref(false)
const onlyFrozen = ref(false)
watch(section, () => {
  withoutLinks.value = false
  onlyFrozen.value = false
})
const filtered = computed(() =>
  items.value.filter(
    (item) => (!withoutLinks.value || !item.LinksCount) && (!onlyFrozen.value || item.IsFreezed),
  ),
)
const filtering = computed(() => withoutLinks.value || onlyFrozen.value)

// More contents arrive when the end of the list comes into view.
const sentinel = ref(null)
let observer
onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) loadMore().catch(() => {})
    },
    { rootMargin: '600px' },
  )
})
watch(sentinel, (element, previous) => {
  if (previous) observer?.unobserve(previous)
  if (element) observer?.observe(element)
})
onBeforeUnmount(() => observer?.disconnect())

function onMore() {
  loadMore().catch(() => toast.error(t('catalog.errors.load')))
}

// Play, as in the legacy Catalog: the content becomes the user's playlist and the player
// bar plays it. The same card pauses and resumes it.
async function onPlay(item) {
  if (player.isPlaying(item.Id)) return player.pause()
  if (player.current.value?.Item?.Id === item.Id) return player.resume()
  try {
    await player.playItems([item.Id])
  } catch {
    toast.error(t('player.error', { name: itemTitle(item) }))
  }
}

async function onFreeze(item, frozen) {
  try {
    await setFrozen(item.Id, frozen)
    toast.show(t(frozen ? 'catalog.frozen' : 'catalog.unfrozen', { name: itemTitle(item) }))
  } catch {
    toast.error(t('catalog.errors.freeze'))
  }
}

// Upload from the device
const ACCEPT = { audio: 'audio/*', visual: 'image/*,video/*', files: '', bookmarks: '' }
const canUpload = computed(() => section.value !== 'bookmarks')
const fileInput = ref(null)
const uploading = ref(false)

async function onFiles(event) {
  const files = [...(event.target.files ?? [])]
  // The same files can be picked again after a failure.
  event.target.value = ''
  if (!files.length || uploading.value) return
  uploading.value = true
  try {
    const { added, failed } = await upload(files)
    if (added) toast.show(t('catalog.upload.done', added))
    for (const { file, code } of failed) {
      const reason =
        { QUOTA_EXCEEDED: 'quota', KO_DUPLICATED: 'duplicated', NETWORK_ERROR: 'network' }[code] ?? 'failed'
      toast.error(t(`catalog.upload.${reason}`, { name: file.name }))
    }
  } finally {
    uploading.value = false
  }
}

const summary = computed(() => {
  if (status.value !== 'ready' && !items.value.length) return ''
  return search.value ? t('catalog.results', count.value) : t('catalog.total', count.value)
})
</script>

<template>
  <div class="page">
    <header class="page__head">
      <div>
        <h1><strong>Catalog</strong></h1>
        <p class="muted" role="status">{{ summary }}</p>
      </div>
      <label class="page__search">
        <UiIcon name="search" />
        <span class="sr-only">{{ t('catalog.search') }}</span>
        <input v-model="searchText" type="search" :placeholder="t('catalog.searchPlaceholder')" />
      </label>
    </header>

    <div class="page__bar">
      <UiSegmented
        v-if="section"
        :model-value="section"
        :options="tabs"
        :label="t('catalog.sections')"
        @update:model-value="goToSection"
      />
      <div class="page__tools">
        <UiChip clickable :active="withoutLinks" @click="withoutLinks = !withoutLinks">
          {{ t('catalog.filters.noLinks') }}
        </UiChip>
        <UiChip clickable :active="onlyFrozen" @click="onlyFrozen = !onlyFrozen">Frozen</UiChip>
        <label class="page__sort">
          <span class="sr-only">{{ t('catalog.sort.label') }}</span>
          <select :value="sort" @change="onSort">
            <option v-for="option in sorts" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <template v-if="canUpload">
          <input
            ref="fileInput"
            type="file"
            multiple
            class="sr-only"
            :accept="ACCEPT[section] || undefined"
            :aria-label="t('catalog.upload.label')"
            tabindex="-1"
            @change="onFiles"
          />
          <!-- Secondary when the empty list already offers the upload as its main action. -->
          <UiButton
            :variant="status === 'ready' && !items.length && !search ? 'secondary' : 'primary'"
            :disabled="uploading"
            @click="fileInput.click()"
          >
            <UiIcon name="upload" />
            {{ uploading ? t('catalog.upload.working') : t('catalog.upload.label') }}
          </UiButton>
        </template>
      </div>
    </div>

    <UiAlert v-if="status === 'error' && !items.length">
      {{ t('catalog.errors.load') }}
      <button type="button" class="page__retry" @click="reload().catch(() => {})">
        {{ t('maps.retry') }}
      </button>
    </UiAlert>

    <div v-else-if="status === 'loading' && !items.length" class="page__grid" aria-hidden="true">
      <div v-for="n in 8" :key="n" class="page__skeleton" />
    </div>

    <UiCard v-else-if="section && !items.length" class="page__empty">
      <template v-if="search">
        <p>{{ t('catalog.empty.search', { q: search }) }}</p>
      </template>
      <template v-else>
        <p>{{ t(`catalog.empty.${section}`) }}</p>
        <UiButton v-if="canUpload" :disabled="uploading" @click="fileInput.click()">
          <UiIcon name="upload" />
          {{ t('catalog.upload.first') }}
        </UiButton>
      </template>
    </UiCard>

    <template v-else>
      <p v-if="filtering && !filtered.length" class="muted">{{ t('catalog.empty.filtered') }}</p>
      <ul class="page__grid" :aria-busy="status === 'loading'">
        <li v-for="item in filtered" :key="item.Id">
          <CatalogCard
            :item="item"
            :playing="player.isPlaying(item.Id)"
            @play="onPlay(item)"
            @freeze="onFreeze(item, $event)"
          />
        </li>
      </ul>
      <p v-if="filtering && more" class="muted">{{ t('catalog.filters.partial') }}</p>
      <div v-if="more" ref="sentinel" class="page__more">
        <UiButton variant="secondary" :disabled="status === 'loading'" @click="onMore">
          {{ status === 'loading' ? t('catalog.loading') : t('catalog.more') }}
        </UiButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
}

.page__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--s-4);
}

.page__search {
  display: flex;
  flex: 0 1 380px;
  align-items: center;
  gap: var(--s-2);
  min-height: var(--tap);
  padding: 0 var(--s-4);
  border: 1px solid var(--field-border);
  border-radius: var(--r-pill);
  background: var(--field-bg);
  color: var(--fg-muted);
}

.page__search:focus-within {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.page__search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--field-fg);
  font: inherit;
}

.page__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
}

.page__tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
}

.page__sort select {
  min-height: var(--tap);
  padding: 0 var(--s-4);
  border: 1px solid var(--field-border);
  border-radius: var(--field-radius);
  background: var(--field-bg);
  color: var(--field-fg);
  font: inherit;
}

.page__retry {
  margin-inline-start: var(--s-2);
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: var(--s-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.page__skeleton {
  aspect-ratio: 210 / 210;
  border-radius: var(--content-card-radius);
  background: var(--content-card-bg);
  opacity: 0.6;
}

.page__empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--s-4);
}

.page__more {
  display: flex;
  justify-content: center;
}

@media (width < 800px) {
  .page__search {
    flex-basis: 100%;
  }

  .page__grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--s-3);
  }
}
</style>
