<script setup>
definePageMeta({ layout: 'app' })

const { t } = useI18n()
useHead({ title: 'Catalog · Epicentric' })

// Section names are product terms and are not translated, except "all".
const sections = computed(() => [
  { value: 'all', label: t('catalog.all') },
  { value: 'audio', label: 'Audio' },
  { value: 'visual', label: 'Visual' },
  { value: 'other', label: 'Other Files' },
  { value: 'bookmarks', label: 'Bookmarks' },
])
const section = ref('all')
</script>

<template>
  <div class="page">
    <h1><strong>Catalog</strong></h1>
    <UiSegmented v-model="section" :options="sections" :label="t('catalog.sections')" />
    <UiCard>
      <p class="muted">{{ t('catalog.empty') }}</p>
    </UiCard>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--s-6);
}

.page > :deep(.card) {
  align-self: stretch;
}
</style>
