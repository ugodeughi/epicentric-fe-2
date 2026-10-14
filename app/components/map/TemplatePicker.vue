<script setup>
/** Ready-made Maps grouped by theme; picks one (v-model: the template Map). */
const model = defineModel({ type: Object, default: null })

const { t } = useI18n()
const { templates, loadTemplates } = useMaps()

const status = ref(templates.value ? 'ready' : 'loading')
const name = useId()

async function load() {
  status.value = 'loading'
  try {
    await loadTemplates()
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
}

onMounted(() => {
  if (!templates.value) load()
})

const groups = computed(() =>
  (templates.value ?? [])
    .map((group) => ({
      id: group.Id,
      name: group.Name,
      description: plainText(group.Description),
      maps: (group.Maps ?? []).map((map) => ({
        map,
        count: countDescendants(map),
        preview: (map.Children ?? []).map((key) => key.Text).filter(Boolean),
      })),
    }))
    .filter((group) => group.maps.length),
)
</script>

<template>
  <div class="templates">
    <p v-if="status === 'loading'" class="muted" role="status">{{ t('maps.templates.loading') }}</p>
    <UiAlert v-else-if="status === 'error'">
      {{ t('maps.templates.error') }}
      <button type="button" class="templates__retry" @click="load">{{ t('maps.retry') }}</button>
    </UiAlert>
    <p v-else-if="!groups.length" class="muted">{{ t('maps.templates.none') }}</p>

    <fieldset v-for="group in groups" v-else :key="group.id" class="templates__group">
      <legend class="templates__name">{{ group.name }}</legend>
      <p v-if="group.description" class="templates__about">{{ group.description }}</p>
      <div class="templates__list">
        <label
          v-for="entry in group.maps"
          :key="entry.map.Id"
          class="templates__item"
          :class="{ 'templates__item--on': model?.Id === entry.map.Id }"
        >
          <input
            type="radio"
            class="templates__input"
            :name="name"
            :checked="model?.Id === entry.map.Id"
            @change="model = entry.map"
          />
          <span class="templates__title">{{ entry.map.Text }}</span>
          <span class="templates__count">{{ t('maps.templates.count', entry.count) }}</span>
          <span class="templates__preview">{{ entry.preview.join(' · ') }}</span>
        </label>
      </div>
    </fieldset>
  </div>
</template>

<style scoped>
.templates {
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
  max-height: min(56dvh, 520px);
  overflow-y: auto;
  /* Room for the focus ring of the cards. */
  padding: var(--s-1);
}

.templates__retry {
  margin-inline-start: var(--s-2);
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.templates__group {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.templates__name {
  padding: 0;
  font-weight: var(--fw-bold);
}

.templates__about {
  display: -webkit-box;
  margin-top: var(--s-1);
  overflow: hidden;
  color: var(--fg-soft);
  font-size: var(--fs-small);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.templates__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: var(--s-2);
  margin-top: var(--s-3);
}

.templates__item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
  padding: var(--s-3) var(--s-4);
  border: 2px solid transparent;
  border-radius: var(--r-sm);
  background: var(--inset-bg);
  cursor: pointer;
}

.templates__item--on {
  border-color: var(--accent-text);
}

.templates__item:has(:focus-visible) {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* The native radio stays in place, invisible, so keyboard and screen readers use it. */
.templates__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.templates__title {
  font-weight: var(--fw-bold);
  overflow-wrap: anywhere;
}

.templates__count {
  color: var(--accent-text);
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
}

.templates__preview {
  display: -webkit-box;
  overflow: hidden;
  color: var(--fg-soft);
  font-size: var(--fs-caption);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
