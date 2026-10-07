<script setup>
const { locale, locales, setLocale, t } = useI18n()

const options = computed(() => locales.value.map((l) => ({ value: l.code, label: l.code.toUpperCase() })))

const current = computed({
  get: () => locale.value,
  set: (code) => setLocale(code),
})
</script>

<template>
  <UiSegmented v-model="current" :options="options" :label="t('shell.language')" />
</template>
