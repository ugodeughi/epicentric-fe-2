<script setup>
const model = defineModel({ type: Boolean, default: false })

defineProps({
  label: { type: String, required: true },
})
</script>

<template>
  <button type="button" role="switch" class="switch" :aria-checked="model" @click="model = !model">
    <span class="switch__track"><span class="switch__thumb" /></span>
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.switch {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  min-height: var(--tap);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.switch__track {
  display: inline-flex;
  flex: none;
  width: 48px;
  height: 28px;
  padding: 3px;
  border-radius: var(--switch-radius);
  background: var(--switch-off-bg);
  transition: background var(--motion);
}

.switch__thumb {
  width: 22px;
  height: 22px;
  border-radius: var(--switch-radius);
  background: var(--switch-thumb);
  transition: transform var(--motion);
}

.switch[aria-checked='true'] .switch__track {
  background: var(--switch-on-bg);
}

.switch[aria-checked='true'] .switch__thumb {
  transform: translateX(20px);
}
</style>
