<script setup>
// Development-only gallery of the design system (excluded from production builds).
definePageMeta({ layout: false })
useHead({ title: 'UI gallery · Epicentric' })

const themes = [
  { value: 'epicentric', label: 'epicentric' },
  { value: 'bare', label: 'bare' },
]
const theme = ref(useRuntimeConfig().public.theme)
watch(theme, (name) => {
  document.documentElement.dataset.theme = name
})

const surfaces = ['dark', 'paper']
const tab = ref('audio')
const tabs = [
  { value: 'all', label: 'Tutto', count: 128 },
  { value: 'audio', label: 'Audio', count: 86 },
  { value: 'visual', label: 'Visual', count: 31 },
]
const enabled = ref(true)
const text = ref('')
const secret = ref('epicentric')
const selected = ref('teal')
const filter = ref(false)
</script>

<template>
  <div class="gallery">
    <header class="gallery__bar">
      <h1>UI <strong>gallery</strong></h1>
      <UiSegmented v-model="theme" :options="themes" label="Theme" />
    </header>

    <section v-for="surface in surfaces" :key="surface" class="gallery__surface" :data-surface="surface">
      <h2>data-surface="{{ surface }}"</h2>

      <div class="gallery__row">
        <UiButton>Primary</UiButton>
        <UiButton variant="secondary">Secondary</UiButton>
        <UiButton variant="ghost">Ghost</UiButton>
        <UiButton disabled>Disabled</UiButton>
      </div>

      <div class="gallery__row">
        <UiSegmented v-model="tab" :options="tabs" label="Sections" />
        <UiSwitch v-model="enabled" label="Ignore ordered sequences" />
      </div>

      <div class="gallery__row">
        <UiChip>MP3</UiChip>
        <UiChip epikey="pink">Joy</UiChip>
        <UiChip clickable :active="filter" @click="filter = !filter">Frozen</UiChip>
      </div>

      <div class="gallery__row">
        <EpikeyHex
          v-for="color in EPIKEY_COLORS"
          :key="color"
          :color="color"
          :size="84"
          :label="color"
          :selected="color === selected"
          @click="selected = color"
        />
      </div>

      <UiAlert>Email o password non corretti.</UiAlert>

      <UiCard>
        <h2>Card</h2>
        <p class="muted">Un contenuto. Infiniti output.</p>
        <UiField v-model="text" label="Field" />
        <UiField v-model="secret" label="Password" type="password" />
      </UiCard>
    </section>
  </div>
</template>

<style scoped>
.gallery {
  display: flex;
  flex-direction: column;
  gap: var(--s-8);
  padding: var(--s-8);
}

.gallery__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
}

.gallery__surface {
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
  padding: var(--s-8);
  border: 1px solid var(--border);
  border-radius: var(--panel-radius);
}

.gallery__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-4);
}
</style>
