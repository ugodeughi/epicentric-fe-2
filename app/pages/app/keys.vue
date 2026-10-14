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
  shiftKey,
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

function goToMap(mapId) {
  if (route.query.map === mapId || (!mapId && !route.query.map)) return load()
  return navigateTo({ query: { ...route.query, map: mapId || undefined } })
}

function onMapChange(event) {
  goToMap(event.target.value)
}

// New Map, empty or from a template
const newMapOpen = ref(false)
const newMapStart = ref('empty')

function openNewMap(start) {
  newMapStart.value = start
  newMapOpen.value = true
}

// An empty Map offers its first steps: a template or a first Epikey.
const isEmpty = computed(() => Boolean(tree.value) && !tree.value.Children?.length)
const fillOpen = ref(false)
const panel = ref(null)

function startFirstKey() {
  selectedId.value = tree.value.Id
  nextTick(() => panel.value?.$el.querySelector('.page__form input')?.focus())
}

// The arrows on the selected Epikey move it among its siblings.
const toast = useToast()

async function onShift(keyId, step) {
  try {
    await shiftKey(keyId, step)
  } catch {
    toast.error(t('maps.edit.errors.order'))
  }
}

// After a deletion the parent is selected; after deleting the Map, another one opens.
function onDeleted(parentId) {
  if (parentId) selectedId.value = parentId
  else goToMap(maps.value[0]?.Id)
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
// Maps copied from a template name an image of the template account, which cannot be loaded.
const previewBroken = ref(false)
watch(backgroundPreview, () => {
  previewBroken.value = false
})
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
      <div class="page__tools">
        <label v-if="maps.length > 1" class="page__switch">
          <span>{{ t('maps.switch') }}</span>
          <select :value="tree?.Id" @change="onMapChange">
            <option v-for="map in maps" :key="map.Id" :value="map.Id">{{ map.Text }}</option>
          </select>
        </label>
        <UiButton variant="secondary" :disabled="!tree" @click="openNewMap('empty')">
          <UiIcon name="plus" />
          {{ t('maps.newMap.open') }}
        </UiButton>
      </div>
    </header>

    <MapNewDialog v-model:open="newMapOpen" :start="newMapStart" @created="goToMap($event.Id)" />
    <MapFillDialog v-model:open="fillOpen" />

    <UiAlert v-if="status === 'error'">
      {{ t('maps.errors.load') }}
      <button type="button" class="page__retry" @click="load">{{ t('maps.retry') }}</button>
    </UiAlert>
    <p v-else-if="!tree" class="muted" role="status">{{ t('maps.loading') }}</p>

    <div v-else class="page__body">
      <div class="page__stage">
        <section v-if="isEmpty" class="page__empty" :aria-label="t('maps.empty.title')">
          <h2>{{ t('maps.empty.title') }}</h2>
          <p class="muted">{{ t('maps.empty.text') }}</p>
          <div class="page__actions">
            <UiButton @click="fillOpen = true">
              <UiIcon name="template" />
              {{ t('maps.empty.template') }}
            </UiButton>
            <UiButton variant="secondary" @click="startFirstKey">
              <UiIcon name="plus" />
              {{ t('maps.empty.first') }}
            </UiButton>
          </div>
        </section>

        <ClientOnly>
          <MapCanvas
            class="page__canvas"
            :tree="tree"
            :selected-id="selectedId"
            :background="backgroundUrl"
            :dim="dim"
            :create="createKey"
            :shift="onShift"
            @select="selectedId = $event"
          />
        </ClientOnly>
      </div>

      <UiCard ref="panel" class="page__panel">
        <!-- Mounted while the Epikey is being deleted too, so it can say where to go next. -->
        <MapKeyEditor v-if="selectedId" :key-id="selectedId" @deleted="onDeleted" />
        <template v-if="selected">
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
          <img
            v-if="backgroundPreview && !previewBroken"
            class="page__preview"
            :src="backgroundPreview"
            alt=""
            @error="previewBroken = true"
          />
          <p v-else-if="backgroundPreview" class="muted">{{ t('maps.background.missing') }}</p>
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
  height: calc(100dvh - 2 * var(--s-8) - var(--player-offset));
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

.page__stage {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--s-4);
  min-width: 0;
}

.page__canvas {
  flex: 1;
  min-width: 0;
}

.page__tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-4);
}

/* First steps of an empty Map, above the canvas so the root Epikey stays in view. */
.page__empty {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-6);
  border-radius: var(--card-radius);
  background: var(--card-bg);
  text-align: center;
}

.page__empty h2 {
  font-size: var(--fs-h2);
}

.page__empty p {
  max-width: 56ch;
}

.page__empty .page__actions {
  justify-content: center;
}

.page__panel {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: var(--s-6);
  width: 320px;
  overflow-y: auto;
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
  padding-top: var(--s-6);
  border-top: 1px solid var(--border);
}

@media (width < 800px) {
  .page {
    height: auto;
    min-height: 0;
  }

  .page__body {
    flex-direction: column;
  }

  .page__stage {
    flex: none;
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
