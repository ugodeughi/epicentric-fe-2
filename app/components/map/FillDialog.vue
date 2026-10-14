<script setup>
/** Fills the open (empty) Map with the Epikeys of a template Map. */
const open = defineModel('open', { type: Boolean, default: false })

const { t } = useI18n()
const { tree, fillFromTemplate } = useMaps()
const toast = useToast()

const formId = useId()
const template = ref(null)
const busy = ref(false)
const failed = ref(false)

watch(open, (value) => {
  if (!value) return
  template.value = null
  failed.value = false
})

async function onSubmit() {
  if (busy.value || !template.value) return
  busy.value = true
  failed.value = false
  try {
    await fillFromTemplate(template.value)
    open.value = false
    toast.show(t('maps.fill.done', { name: template.value.Text }))
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <UiDialog v-model:open="open" :title="t('maps.fill.title')" wide>
    <form :id="formId" class="fill" @submit.prevent="onSubmit">
      <p class="muted">{{ t('maps.fill.hint', { map: tree?.Text }) }}</p>
      <MapTemplatePicker v-model="template" />
      <UiAlert v-if="failed">{{ t('maps.fill.error') }}</UiAlert>
    </form>

    <template #actions>
      <UiButton variant="ghost" @click="open = false">{{ t('maps.cancel') }}</UiButton>
      <UiButton type="submit" :form="formId" :disabled="busy || !template">
        {{ busy ? t('maps.working') : t('maps.fill.submit') }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.fill {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}
</style>
