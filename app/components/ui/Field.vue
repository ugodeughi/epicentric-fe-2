<script setup>
const model = defineModel({ type: String, default: '' })

defineProps({
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  autocomplete: { type: String, default: 'off' },
  required: { type: Boolean, default: false },
})

const id = useId()
</script>

<template>
  <div class="field">
    <label class="field__label" :for="id">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      class="field__input"
      :type="type"
      :autocomplete="autocomplete"
      :required="required"
    >
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.field__label {
  font-size: var(--fs-small);
  font-weight: var(--fw-semibold);
  color: var(--fg-soft);
}

.field__input {
  min-height: var(--tap);
  padding: 0 var(--s-4);
  border: 1px solid var(--field-border);
  border-radius: var(--field-radius);
  background: var(--field-bg);
  color: var(--field-fg);
}
</style>
