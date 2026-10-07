<script setup>
const model = defineModel({ type: [String, Number], default: null })

const props = defineProps({
  /** @type {import('vue').PropType<{ value: string | number, label: string, count?: number }[]>} */
  options: { type: Array, required: true },
  label: { type: String, required: true },
})

const root = ref(null)

function move(step) {
  const index = props.options.findIndex((o) => o.value === model.value)
  const next = props.options[(index + step + props.options.length) % props.options.length]
  model.value = next.value
  nextTick(() => root.value?.querySelector('[aria-checked="true"]')?.focus())
}
</script>

<template>
  <div
    ref="root"
    class="segmented"
    role="radiogroup"
    :aria-label="label"
    @keydown.right.prevent="move(1)"
    @keydown.down.prevent="move(1)"
    @keydown.left.prevent="move(-1)"
    @keydown.up.prevent="move(-1)"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      class="segmented__option"
      :aria-checked="option.value === model"
      :tabindex="option.value === model ? 0 : -1"
      @click="model = option.value"
    >
      {{ option.label }}
      <span v-if="option.count !== undefined" class="segmented__count tabular">{{ option.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.segmented {
  display: inline-flex;
  flex-wrap: wrap;
  max-width: 100%;
  gap: var(--s-1);
  padding: var(--s-1);
  border-radius: var(--segmented-radius);
  background: var(--segmented-bg);
}

.segmented__option {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  min-height: calc(var(--tap) - var(--s-2));
  padding: 0 var(--s-4);
  border: 0;
  border-radius: var(--segmented-radius);
  background: transparent;
  color: var(--segmented-fg);
  font-weight: var(--fw-semibold);
  cursor: pointer;
  transition: background var(--motion);
}

.segmented__option[aria-checked='true'] {
  background: var(--segmented-active-bg);
  color: var(--segmented-active-fg);
}

.segmented__count {
  font-size: var(--fs-caption);
  opacity: 0.7;
}
</style>
