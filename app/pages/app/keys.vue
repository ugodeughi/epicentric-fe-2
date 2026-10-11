<script setup>
definePageMeta({ layout: 'app' })

const { t } = useI18n()
const route = useRoute()
const {
  maps,
  tree,
  status,
  open,
  createKey,
  setBackground,
  setBackgroundFromCatalog,
  removeBackground,
  setBackgroundDim,
} = useMaps()
const { image } = useMediaUrl()

useHead({ title: () => `${tree.value?.Text || 'Epikey'} · Epicentric` })

const selectedId = ref(null)
const selected = computed(() => findKey(tree.value, selectedId.value))

async function load() {
  try {
    await open(route.query.map)
    // The Map itself starts selected, so a new Epikey always has a parent to go under.
    selectedId.value = tree.value?.Id ?? null
  } catch {
    // The page shows the error state from `status`.
  }
}

// The open Map lives in the URL (?map=<id>), so it survives a reload and can be linked.
watch(() => route.query.map, load)
onMounted(load)

function onMapChange(event) {
  navigateTo({ query: { ...route.query, map: event.target.value } })
}

// New Epikey under the selected one
const name = ref('')
const color = ref(null)
const creating = ref(false)
const createFailed = ref(false)

async function onCreate() {
  if (creating.value || !selected.value || !name.value.trim()) return
  creating.value = true
  createFailed.value = false

  try {
    await createKey({ parentId: selected.value.Id, text: name.value, color: color.value })
    name.value = ''
  } catch {
    createFailed.value = true
  } finally {
    creating.value = false
  }
}

// Image behind the Map
const BACKGROUND_SIZE = 1600
const backgroundUrl = computed(() => image(tree.value?.BackgroundImage, BACKGROUND_SIZE))
const backgroundPreview = computed(() => image(tree.value?.BackgroundImage, 320))
const fileInput = ref(null)
const backgroundBusy = ref(false)
const backgroundError = ref(null)

async function changeBackground(action, fallback) {
  if (backgroundBusy.value) return
  backgroundBusy.value = true
  backgroundError.value = null
  try {
    await action()
  } catch (error) {
    backgroundError.value =
      { QUOTA_EXCEEDED: 'maps.background.errors.quota', NETWORK_ERROR: 'auth.errors.network' }[error?.code] ??
      fallback
  } finally {
    backgroundBusy.value = false
  }
}

function onBackgroundPicked(event) {
  const [file] = event.target.files ?? []
  // The same file can be picked again after a failure.
  event.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    backgroundError.value = 'maps.background.errors.notImage'
    return
  }
  changeBackground(() => setBackground(file), 'maps.background.errors.upload')
}

// Images already in the Catalog, as in the legacy app: shown on request.
const pickerOpen = ref(false)

function onBackgroundChosen(item) {
  changeBackground(() => setBackgroundFromCatalog(item), 'maps.background.errors.save')
}

function onBackgroundRemove() {
  changeBackground(removeBackground, 'maps.background.errors.save')
}

// The slider darkens the image as it moves; the value is saved when it is released.
const dim = ref(0)
watch(
  () => [tree.value?.Id, tree.value?.Opacity],
  () => {
    dim.value = tree.value?.Opacity ?? 0
  },
  { immediate: true },
)

function onDimChange() {
  changeBackground(() => setBackgroundDim(dim.value), 'maps.background.errors.save')
}
</script>

<template>
  <div class="page">
    <header class="page__head">
      <h1>
        Map <strong>{{ tree?.Text }}</strong>
      </h1>
      <label v-if="maps.length > 1" class="page__switch">
        <span>{{ t('maps.switch') }}</span>
        <select :value="tree?.Id" @change="onMapChange">
          <option v-for="map in maps" :key="map.Id" :value="map.Id">{{ map.Text }}</option>
        </select>
      </label>
    </header>

    <UiAlert v-if="status === 'error'">
      {{ t('maps.errors.load') }}
      <button type="button" class="page__retry" @click="load">{{ t('maps.retry') }}</button>
    </UiAlert>
    <p v-else-if="!tree" class="muted" role="status">{{ t('maps.loading') }}</p>

    <div v-else class="page__body">
      <ClientOnly>
        <MapCanvas
          class="page__canvas"
          :tree="tree"
          :selected-id="selectedId"
          :background="backgroundUrl"
          :dim="dim"
          :create="createKey"
          @select="selectedId = $event"
        />
      </ClientOnly>

      <UiCard class="page__panel">
        <template v-if="selected">
          <div class="page__selected">
            <EpikeyHex :size="56" :color="epikeyColorId(selected.Color)" />
            <div>
              <p class="page__name">{{ selected.Text }}</p>
              <p class="muted">{{ t('maps.links', selected.LinksCount ?? 0) }}</p>
            </div>
          </div>

          <form class="page__form" @submit.prevent="onCreate">
            <h2>{{ t('maps.newKey.title') }}</h2>
            <p class="muted">{{ t('maps.newKey.under', { parent: selected.Text }) }}</p>
            <UiField v-model="name" :label="t('maps.newKey.name')" required />
            <EpikeyColorPicker v-model="color" :label="t('maps.newKey.color')" />
            <UiAlert v-if="createFailed">{{ t('maps.errors.create') }}</UiAlert>
            <UiButton type="submit" block :disabled="creating || !name.trim()">
              {{ creating ? t('maps.newKey.submitting') : t('maps.newKey.submit') }}
            </UiButton>
          </form>
        </template>
        <p v-else class="muted">{{ t('maps.selectHint') }}</p>

        <section class="page__background" :aria-busy="backgroundBusy">
          <h2>{{ t('maps.background.title') }}</h2>
          <img v-if="backgroundPreview" class="page__preview" :src="backgroundPreview" alt="" />
          <p v-else class="muted">{{ t('maps.background.none') }}</p>

          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="page__file"
            :aria-label="t('maps.background.choose')"
            @change="onBackgroundPicked"
          />
          <div class="page__actions">
            <UiButton variant="secondary" :disabled="backgroundBusy" @click="fileInput.click()">
              {{
                backgroundBusy
                  ? t('maps.background.working')
                  : tree.BackgroundImage
                    ? t('maps.background.change')
                    : t('maps.background.choose')
              }}
            </UiButton>
            <UiButton
              v-if="tree.BackgroundImage"
              variant="ghost"
              :disabled="backgroundBusy"
              @click="onBackgroundRemove"
            >
              {{ t('maps.background.remove') }}
            </UiButton>
          </div>

          <UiButton variant="ghost" :aria-expanded="pickerOpen" @click="pickerOpen = !pickerOpen">
            {{ t('maps.background.fromCatalog') }}
          </UiButton>
          <MapBackgroundPicker
            v-if="pickerOpen"
            :current="tree.BackgroundImage"
            :disabled="backgroundBusy"
            @pick="onBackgroundChosen"
          />

          <label v-if="tree.BackgroundImage" class="page__dim">
            <span>{{ t('maps.background.dim') }}</span>
            <input v-model.number="dim" type="range" min="0" max="1" step="0.05" @change="onDimChange" />
          </label>

          <UiAlert v-if="backgroundError">{{ t(backgroundError) }}</UiAlert>
        </section>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
  /* Fill the viewport, so the canvas takes the space left under the title. */
  height: calc(100dvh - 2 * var(--s-8));
  min-height: 560px;
}

.page__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
}

.page__switch {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  color: var(--fg-soft);
  font-size: var(--fs-small);
}

.page__switch select {
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

.page__body {
  display: flex;
  flex: 1;
  gap: var(--s-6);
  min-height: 0;
}

.page__canvas {
  flex: 1;
  min-width: 0;
}

.page__panel {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: var(--s-6);
  width: 320px;
  overflow-y: auto;
}

.page__selected {
  display: flex;
  align-items: center;
  gap: var(--s-4);
}

.page__name {
  font-weight: var(--fw-bold);
  overflow-wrap: anywhere;
}

.page__background {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  padding-top: var(--s-6);
  border-top: 1px solid var(--border);
}

.page__preview {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--map-preview-radius);
  object-fit: cover;
}

/* The native file input stays out of sight: the button next to it opens it. */
.page__file {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

.page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.page__dim {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  color: var(--fg-soft);
  font-size: var(--fs-small);
  font-weight: var(--fw-semibold);
}

.page__dim input {
  width: 100%;
  min-height: var(--tap);
  accent-color: var(--primary);
}

.page__form {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

@media (width < 800px) {
  .page {
    height: auto;
    min-height: 0;
  }

  .page__body {
    flex-direction: column;
  }

  .page__canvas {
    flex: none;
    height: 64dvh;
  }

  .page__panel {
    width: auto;
  }
}
</style>
