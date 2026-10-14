<script setup>
/** New Map: empty, with a name, or as a copy of a template. Emits the created Map. */
const open = defineModel('open', { type: Boolean, default: false })

const props = defineProps({
  /** 'empty' | 'template': the tab shown when the dialog opens. */
  start: { type: String, default: 'empty' },
})

const emit = defineEmits(['created'])

const { t } = useI18n()
const { createMap, importTemplate } = useMaps()
const toast = useToast()

const formId = useId()
const mode = ref(props.start)
const name = ref('')
const template = ref(null)
const busy = ref(false)
const failed = ref(false)

watch(open, (value) => {
  if (!value) return
  mode.value = props.start
  name.value = ''
  template.value = null
  failed.value = false
})

const modes = computed(() => [
  { value: 'empty', label: t('maps.newMap.empty') },
  { value: 'template', label: t('maps.newMap.fromTemplate') },
])

const ready = computed(() => (mode.value === 'empty' ? Boolean(name.value.trim()) : Boolean(template.value)))

async function onSubmit() {
  if (busy.value || !ready.value) return
  busy.value = true
  failed.value = false
  try {
    const created =
      mode.value === 'empty' ? await createMap(name.value) : await importTemplate(template.value.Id)
    open.value = false
    toast.show(t('maps.newMap.done', { name: created.Text }))
    emit('created', created)
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <UiDialog v-model:open="open" :title="t('maps.newMap.title')" :wide="mode === 'template'">
    <form :id="formId" class="new-map" @submit.prevent="onSubmit">
      <UiSegmented v-model="mode" :options="modes" :label="t('maps.newMap.how')" />
      <template v-if="mode === 'empty'">
        <UiField v-model="name" :label="t('maps.newMap.name')" required />
      </template>
      <template v-else>
        <p class="muted">{{ t('maps.newMap.templateHint') }}</p>
        <MapTemplatePicker v-model="template" />
      </template>
      <UiAlert v-if="failed">{{ t('maps.newMap.error') }}</UiAlert>
    </form>

    <template #actions>
      <UiButton variant="ghost" @click="open = false">{{ t('maps.cancel') }}</UiButton>
      <UiButton type="submit" :form="formId" :disabled="busy || !ready">
        {{ busy ? t('maps.working') : t('maps.newMap.submit') }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.new-map {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}
</style>
