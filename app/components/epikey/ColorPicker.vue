<script setup>
/** Palette id (utils/epikeyPalette.js), or null for no colour. */
const model = defineModel({ type: String, default: null })

defineProps({
  label: { type: String, required: true },
})

const { t } = useI18n()
const name = useId()
</script>

<template>
  <fieldset class="swatches">
    <legend class="swatches__legend">{{ label }}</legend>
    <div class="swatches__list">
      <label v-for="id in EPIKEY_COLORS" :key="id" class="swatches__item" :title="t(`epikey.colors.${id}`)">
        <input v-model="model" type="radio" class="swatches__input" :name="name" :value="id" />
        <span class="swatches__dot" :style="{ '--_color': epikeyColorVar(id) }" />
        <span class="swatches__name">{{ t(`epikey.colors.${id}`) }}</span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.swatches {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.swatches__legend {
  margin-bottom: var(--s-2);
  padding: 0;
  color: var(--fg-soft);
  font-size: var(--fs-small);
  font-weight: var(--fw-semibold);
}

.swatches__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-1);
}

.swatches__item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--tap);
  height: var(--tap);
  cursor: pointer;
}

/* The native radio stays in place, invisible, so keyboard and screen readers use it. */
.swatches__input {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.swatches__dot {
  width: var(--swatch-size);
  height: var(--swatch-size);
  border-radius: var(--swatch-radius);
  background: var(--_color);
  transition: transform var(--motion);
}

.swatches__input:checked + .swatches__dot {
  outline: var(--swatch-selected-outline);
  outline-offset: 3px;
  transform: scale(var(--swatch-selected-scale));
}

.swatches__input:focus-visible + .swatches__dot {
  outline: 2px solid var(--focus-ring);
  outline-offset: 3px;
}

.swatches__name {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
