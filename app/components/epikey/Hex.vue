<script setup>
const props = defineProps({
  /** Epikey palette id (see utils/epikeyPalette.js). */
  color: { type: String, default: null },
  /** Width in px; height follows the theme ratio. */
  size: { type: Number, default: 96 },
  label: { type: String, default: '' },
  /** Enlarges the label only, for an Epikey drawn small (the Map zoomed out). */
  labelScale: { type: Number, default: 1 },
  selected: { type: Boolean, default: false },
})

const style = computed(() => ({
  '--_size': `${props.size}px`,
  '--_color': epikeyColorVar(props.color),
  '--_label-scale': props.labelScale,
}))
</script>

<template>
  <span class="hex" :class="{ 'hex--selected': selected }" :style="style">
    <span class="hex__shape">
      <span v-if="label" class="hex__label">{{ label }}</span>
    </span>
  </span>
</template>

<style scoped>
.hex {
  display: inline-flex;
  flex: none;
  width: var(--_size);
  height: calc(var(--_size) * var(--hex-ratio));
  transition:
    transform var(--motion),
    filter var(--motion);
}

.hex__shape {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 9%;
  background: var(--_color);
  color: var(--hex-fg);
  clip-path: var(--hex-shape);
  font-weight: var(--fw-bold);
  font-size: calc(var(--_size) * 0.15 * var(--_label-scale));
  line-height: 1.1;
  text-align: center;
}

.hex--selected {
  transform: scale(var(--hex-selected-scale));
  filter: var(--hex-selected-filter);
  outline: var(--hex-selected-outline);
}

.hex__label {
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}
</style>
