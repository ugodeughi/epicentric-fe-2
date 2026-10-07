<script setup>
// Provisional public page: status report of what has been built so far.
// Italian only and not linked from the app; remove it (with app/data/progress.js) at launch.
import { PROGRESS_DONE, PROGRESS_NEXT, PROGRESS_UPDATED } from '~/data/progress'

definePageMeta({ layout: false })
useHead({
  title: 'Stato dei lavori · Epicentric 2.0',
  htmlAttrs: { lang: 'it' },
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const total = PROGRESS_DONE.reduce((sum, section) => sum + section.items.length, 0)
</script>

<template>
  <div class="progress">
    <header class="progress__header">
      <AppLogo />
      <UiChip>Pagina provvisoria</UiChip>
    </header>

    <section class="progress__intro stack">
      <h1>Stato dei <strong>lavori.</strong></h1>
      <p class="progress__lead">
        Elenco di ciò che è stato sviluppato finora nel nuovo frontend di Epicentric 2.0, punto per punto.
      </p>
      <div class="progress__facts">
        <UiChip>Aggiornato al {{ PROGRESS_UPDATED }}</UiChip>
        <UiChip>{{ PROGRESS_DONE.length }} aree</UiChip>
        <UiChip>{{ total }} punti completati</UiChip>
      </div>
      <div>
        <UiButton to="/login">Apri l’app</UiButton>
      </div>
    </section>

    <nav class="progress__index" aria-label="Indice">
      <a v-for="(section, index) in PROGRESS_DONE" :key="section.title" :href="`#area-${index + 1}`">
        <UiChip>{{ index + 1 }}. {{ section.title }}</UiChip>
      </a>
    </nav>

    <main class="progress__sections">
      <section
        v-for="(section, index) in PROGRESS_DONE"
        :id="`area-${index + 1}`"
        :key="section.title"
        class="progress__section"
      >
        <UiCard>
          <div class="stack">
            <div>
              <h2>
                <span class="tabular muted">{{ index + 1 }}.</span>
                {{ section.title }}
              </h2>
              <p v-if="section.intro" class="muted">{{ section.intro }}</p>
            </div>
            <ul class="progress__list">
              <li v-for="item in section.items" :key="item.title" class="progress__item">
                <span class="progress__mark"><UiIcon name="check" :size="14" /></span>
                <span>
                  <strong>{{ item.title }}</strong>
                  <span class="progress__detail">{{ item.detail }}</span>
                </span>
              </li>
            </ul>
          </div>
        </UiCard>
      </section>
    </main>

    <section class="progress__next" data-surface="paper">
      <div class="stack">
        <h2>Prossimi passi</h2>
        <div class="progress__next-grid">
          <div v-for="group in PROGRESS_NEXT" :key="group.title">
            <h3>{{ group.title }}</h3>
            <ul class="progress__plain">
              <li v-for="item in group.items" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.progress {
  display: flex;
  flex-direction: column;
  gap: var(--s-10);
  max-width: 960px;
  margin: 0 auto;
  padding: var(--s-6) var(--s-4) var(--s-12);
}

.progress__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
}

.progress__lead {
  max-width: 56ch;
  color: var(--fg-soft);
  font-size: var(--fs-h2);
  font-weight: var(--fw-light);
  line-height: 1.35;
}

.progress__facts,
.progress__index {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.progress__index a {
  text-decoration: none;
}

.progress__sections {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.progress__section {
  scroll-margin-top: var(--s-4);
}

.progress__list,
.progress__plain {
  margin: 0;
  padding: 0;
  list-style: none;
}

.progress__list {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.progress__item {
  display: flex;
  gap: var(--s-3);
}

.progress__mark {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  border-radius: var(--r-pill);
  background: var(--secondary);
  color: var(--ink);
}

.progress__detail {
  display: block;
  color: var(--fg-soft);
}

.progress__next {
  padding: var(--s-8);
  border-radius: var(--panel-radius);
}

.progress__next-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--s-8);
}

.progress__next h3 {
  margin-bottom: var(--s-3);
  font-size: var(--fs-body);
  font-weight: var(--fw-bold);
}

.progress__plain {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  color: var(--fg-soft);
}

.progress__plain li {
  padding-inline-start: var(--s-4);
  border-inline-start: 2px solid var(--border);
}
</style>
