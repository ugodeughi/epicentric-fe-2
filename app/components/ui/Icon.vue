<script setup>
import { ICONS } from './icons'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 20 },
})

const markup = computed(() => ICONS[props.name] ?? '')
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- static markup from ./icons.js, never user input -->
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.9"
    aria-hidden="true"
    v-html="markup"
  />
</template>
