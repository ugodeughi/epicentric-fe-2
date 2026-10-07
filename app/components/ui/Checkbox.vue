<script setup>
const model = defineModel({ type: Boolean, default: false })

defineProps({
  required: { type: Boolean, default: false },
})

const id = useId()

// Same care as UiField: a box ticked before Vue owns the page must survive hydration.
const input = ref(null)
let checkedBeforeHydration = false
onBeforeMount(() => {
  checkedBeforeHydration = Boolean(document.getElementById(id)?.checked)
})
onMounted(() => {
  if (!checkedBeforeHydration && !model.value) return
  model.value = true
  if (input.value) input.value.checked = true
})
</script>

<template>
  <label class="checkbox">
    <span class="checkbox__control">
      <input
        :id="id"
        ref="input"
        v-model="model"
        class="checkbox__input"
        type="checkbox"
        :required="required"
      />
      <UiIcon class="checkbox__mark" name="check" :size="14" />
    </span>
    <span class="checkbox__label"><slot /></span>
  </label>
</template>

<style scoped>
.checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  padding-block: var(--s-1);
  cursor: pointer;
}

.checkbox__control {
  position: relative;
  display: inline-flex;
  flex: none;
}

.checkbox__input {
  width: var(--check-size);
  height: var(--check-size);
  margin: 0;
  border: 1px solid var(--check-border);
  border-radius: var(--check-radius);
  background: var(--check-bg);
  appearance: none;
  cursor: pointer;
  transition: background var(--motion);
}

.checkbox__input:checked {
  border-color: var(--check-on-bg);
  background: var(--check-on-bg);
}

.checkbox__mark {
  position: absolute;
  inset: 0;
  margin: auto;
  color: var(--check-on-fg);
  opacity: 0;
  pointer-events: none;
}

.checkbox__input:checked + .checkbox__mark {
  opacity: 1;
}

.checkbox__label {
  font-size: var(--fs-small);
  line-height: var(--check-size);
}
</style>
