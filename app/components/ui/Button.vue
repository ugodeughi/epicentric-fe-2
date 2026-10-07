<script setup>
const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost
  to: { type: [String, Object], default: null },
  type: { type: String, default: 'button' },
  block: { type: Boolean, default: false },
})

const NuxtLink = resolveComponent('NuxtLink')
const tag = computed(() => (props.to ? NuxtLink : 'button'))
const attrs = computed(() => (props.to ? { to: props.to } : { type: props.type }))
</script>

<template>
  <component :is="tag" v-bind="attrs" class="btn" :class="[`btn--${variant}`, { 'btn--block': block }]">
    <slot />
  </component>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-2);
  min-height: var(--btn-height);
  padding: 0 var(--btn-pad-x);
  border: 0;
  border-radius: var(--btn-radius);
  font-weight: var(--btn-font-weight);
  text-decoration: none;
  cursor: pointer;
  transition:
    transform var(--motion),
    opacity var(--motion);
}

.btn:active {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.5;
  box-shadow: none;
  cursor: not-allowed;
}

.btn--block {
  display: flex;
  width: 100%;
}

.btn--primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-fg);
  box-shadow: var(--btn-primary-shadow);
}

.btn--secondary {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-fg);
}

.btn--ghost {
  background: transparent;
  color: var(--btn-ghost-fg);
}
</style>
