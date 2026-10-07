<script setup>
defineProps({
  active: { type: Boolean, default: false },
  /** Epikey palette id: shows the mini hexagon before the label. */
  epikey: { type: String, default: null },
  /** Render as a toggle button instead of a static label. */
  clickable: { type: Boolean, default: false },
})
</script>

<template>
  <component
    :is="clickable ? 'button' : 'span'"
    class="chip"
    :class="{ 'chip--active': active, 'chip--clickable': clickable }"
    :type="clickable ? 'button' : undefined"
    :aria-pressed="clickable ? active : undefined"
  >
    <EpikeyHex v-if="epikey" :color="epikey" :size="14" />
    <slot />
  </component>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-1) var(--s-3);
  border: 0;
  border-radius: var(--chip-radius);
  background: var(--chip-bg);
  color: var(--chip-fg);
  font-size: var(--fs-small);
  font-weight: var(--fw-semibold);
  white-space: nowrap;
}

.chip--clickable {
  min-height: var(--tap);
  padding: 0 var(--s-4);
  cursor: pointer;
  transition: background var(--motion);
}

.chip--active {
  background: var(--chip-active-bg);
  color: var(--chip-active-fg);
}
</style>
