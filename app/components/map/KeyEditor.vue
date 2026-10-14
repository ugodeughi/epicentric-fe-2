<script setup>
/**
 * Changes to one Epikey of the open Map, or to the Map itself: name, colour, parent,
 * deletion (the place among the siblings is changed with the arrows on the canvas).
 * Outcomes are reported with toasts.
 */
const props = defineProps({
  keyId: { type: String, required: true },
})

const emit = defineEmits(['deleted'])

const { t } = useI18n()
const { tree, renameKey, setKeyColor, moveKey, deleteKey } = useMaps()
const toast = useToast()

const key = computed(() => findKey(tree.value, props.keyId))
const isMap = computed(() => key.value?.Id === tree.value?.Id)
const busy = ref(false)

/** Runs one change at a time; a failure becomes an error toast. */
async function run(action, errorKey) {
  if (busy.value) return false
  busy.value = true
  try {
    await action()
    return true
  } catch {
    toast.error(t(errorKey))
    return false
  } finally {
    busy.value = false
  }
}

// Name
const name = ref('')
watch(
  () => [props.keyId, key.value?.Text],
  () => {
    name.value = key.value?.Text ?? ''
  },
  { immediate: true },
)
const renamed = computed(() => name.value.trim() && name.value.trim() !== (key.value?.Text ?? ''))

async function onRename() {
  if (!renamed.value) return
  const done = await run(() => renameKey(props.keyId, name.value), 'maps.edit.errors.rename')
  if (done) toast.show(t('maps.edit.renamed'))
}

// Colour: saved as soon as it is picked.
const color = ref(null)
watch(
  () => [props.keyId, key.value?.Color],
  () => {
    color.value = epikeyColorId(key.value?.Color)
  },
  { immediate: true },
)

async function onColor(value) {
  if (!value || value === epikeyColorId(key.value?.Color)) return
  color.value = value
  const done = await run(() => setKeyColor(props.keyId, value), 'maps.edit.errors.color')
  if (!done) color.value = epikeyColorId(key.value?.Color)
}

// Move under another Epikey
const moveOpen = ref(false)
const targets = computed(() => (moveOpen.value && tree.value ? moveTargets(tree.value, props.keyId) : []))
const target = ref(null)
const moveFormId = useId()
const targetName = useId()

function openMove() {
  target.value = null
  moveOpen.value = true
}

async function onMove() {
  const parent = targets.value.find((entry) => entry.key.Id === target.value)?.key
  if (!parent) return
  const done = await run(() => moveKey(props.keyId, parent.Id), 'maps.edit.errors.move')
  if (done) {
    moveOpen.value = false
    toast.show(t('maps.edit.moved', { name: key.value?.Text, parent: parent.Text }))
  }
}

// Delete
const deleteOpen = ref(false)
/** What goes with the Epikey, as text ("3 Epikeys and 7 Links"), or '' when nothing. */
const lost = computed(() => {
  const keys = countDescendants(key.value)
  const links = countLinks(key.value)
  return [keys && t('maps.edit.keysCount', keys), links && t('maps.links', links)]
    .filter(Boolean)
    .join(t('maps.edit.and'))
})

async function onDelete() {
  const text = key.value?.Text
  const parentId = findParent(tree.value, props.keyId)?.Id ?? null
  const done = await run(() => deleteKey(props.keyId), 'maps.edit.errors.delete')
  if (done) {
    deleteOpen.value = false
    toast.show(t(parentId ? 'maps.edit.deleted' : 'maps.edit.mapDeleted', { name: text }))
    emit('deleted', parentId)
  }
}
</script>

<template>
  <section v-if="key" class="editor" :aria-busy="busy">
    <div class="editor__head">
      <EpikeyHex :size="56" :color="epikeyColorId(key.Color)" />
      <div>
        <p class="editor__kind">{{ isMap ? 'Map' : 'Epikey' }}</p>
        <p class="editor__name">{{ key.Text }}</p>
        <p class="muted">{{ t('maps.links', key.LinksCount ?? 0) }}</p>
      </div>
    </div>

    <form class="editor__rename" @submit.prevent="onRename">
      <UiField v-model="name" :label="t('maps.edit.name')" required />
      <UiButton v-if="renamed" type="submit" variant="secondary" :disabled="busy">
        {{ t('maps.edit.rename') }}
      </UiButton>
    </form>

    <EpikeyColorPicker :model-value="color" :label="t('maps.edit.color')" @update:model-value="onColor" />

    <div class="editor__actions">
      <template v-if="!isMap">
        <UiButton variant="secondary" :disabled="busy" @click="openMove">
          <UiIcon name="move" />
          {{ t('maps.edit.move') }}
        </UiButton>
      </template>
      <UiButton variant="ghost" :disabled="busy" @click="deleteOpen = true">
        <UiIcon name="trash" />
        {{ isMap ? t('maps.edit.deleteMap') : t('maps.edit.delete') }}
      </UiButton>
    </div>

    <UiDialog v-model:open="moveOpen" :title="t('maps.edit.moveTitle', { name: key.Text })">
      <form :id="moveFormId" @submit.prevent="onMove">
        <fieldset v-if="targets.length" class="targets">
          <legend class="targets__legend">{{ t('maps.edit.moveUnder') }}</legend>
          <label
            v-for="entry in targets"
            :key="entry.key.Id"
            class="targets__item"
            :style="{ '--_depth': entry.depth }"
          >
            <input v-model="target" type="radio" :name="targetName" :value="entry.key.Id" />
            <span
              class="targets__dot"
              :style="{ '--_color': epikeyColorVar(epikeyColorId(entry.key.Color)) }"
            />
            <span>{{ entry.key.Text }}</span>
          </label>
        </fieldset>
        <p v-else class="muted">{{ t('maps.edit.nowhere') }}</p>
      </form>
      <template #actions>
        <UiButton variant="ghost" @click="moveOpen = false">{{ t('maps.cancel') }}</UiButton>
        <UiButton type="submit" :form="moveFormId" :disabled="busy || !target">
          {{ busy ? t('maps.working') : t('maps.edit.moveSubmit') }}
        </UiButton>
      </template>
    </UiDialog>

    <UiDialog
      v-model:open="deleteOpen"
      :title="
        isMap
          ? t('maps.edit.deleteMapTitle', { name: key.Text })
          : t('maps.edit.deleteTitle', { name: key.Text })
      "
    >
      <p>{{ lost ? t('maps.edit.loses', { what: lost }) : t('maps.edit.losesNothing') }}</p>
      <p class="muted">{{ t('maps.edit.contentsStay') }}</p>
      <template #actions>
        <UiButton variant="ghost" @click="deleteOpen = false">{{ t('maps.cancel') }}</UiButton>
        <UiButton :disabled="busy" @click="onDelete">
          {{ busy ? t('maps.working') : t('maps.edit.deleteConfirm') }}
        </UiButton>
      </template>
    </UiDialog>
  </section>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.editor__head {
  display: flex;
  align-items: center;
  gap: var(--s-4);
}

.editor__kind {
  color: var(--fg-muted);
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
}

.editor__name {
  font-weight: var(--fw-bold);
  overflow-wrap: anywhere;
}

.editor__rename {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.editor__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.targets {
  display: flex;
  flex-direction: column;
  max-height: min(50dvh, 420px);
  margin: 0;
  padding: 0;
  overflow-y: auto;
  border: 0;
}

.targets__legend {
  margin-bottom: var(--s-2);
  padding: 0;
  color: var(--fg-soft);
  font-size: var(--fs-small);
  font-weight: var(--fw-semibold);
}

.targets__item {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  min-height: var(--tap);
  padding-inline: calc(var(--s-2) + var(--_depth) * var(--s-5)) var(--s-2);
  border-radius: var(--r-xs);
  cursor: pointer;
}

.targets__item:hover,
.targets__item:has(:checked) {
  background: var(--inset-bg);
}

.targets__item input {
  accent-color: var(--primary);
}

.targets__dot {
  flex: none;
  width: 14px;
  height: 16px;
  background: var(--_color);
  clip-path: var(--hex-shape);
}
</style>
