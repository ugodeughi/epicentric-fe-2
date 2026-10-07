<script setup>
definePageMeta({ layout: 'app' })

const { t } = useI18n()
useHead({ title: 'Epikey · Epicentric' })
</script>

<template>
  <div class="page">
    <h1><strong>Epikey</strong></h1>
    <UiCard>
      <p class="muted">{{ t('keys.empty') }}</p>
    </UiCard>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
}
</style>
