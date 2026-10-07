<script setup>
const model = defineModel({ type: String, default: '' })

const props = defineProps({
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  autocomplete: { type: String, default: 'off' },
  required: { type: Boolean, default: false },
  minlength: { type: Number, default: undefined },
  hint: { type: String, default: '' },
})

const { t } = useI18n()
const id = useId()

// Password fields get a show/hide toggle.
const isPassword = computed(() => props.type === 'password')
const revealed = ref(false)
const inputType = computed(() => (isPassword.value && revealed.value ? 'text' : props.type))

// On server-rendered pages the user (or the browser autofill) can type before Vue fully
// owns the input. Hydration then resets the element to the model it rendered with, losing
// the text or leaving model and element out of sync. Keep what was typed: read the element
// just before hydration, then realign both once mounted.
const input = ref(null)
let typedBeforeHydration = ''
onBeforeMount(() => {
  typedBeforeHydration = document.getElementById(id)?.value ?? ''
})
onMounted(() => {
  const value = model.value || typedBeforeHydration
  if (!value) return
  model.value = value
  if (input.value && input.value.value !== value) input.value.value = value
})
</script>

<template>
  <div class="field">
    <label class="field__label" :for="id">{{ label }}</label>
    <div class="field__control">
      <input
        :id="id"
        ref="input"
        v-model="model"
        class="field__input"
        :class="{ 'field__input--with-action': isPassword }"
        :type="inputType"
        :autocomplete="autocomplete"
        :required="required"
        :minlength="minlength"
        :aria-describedby="hint ? `${id}-hint` : undefined"
      />
      <button
        v-if="isPassword"
        type="button"
        class="field__action"
        :aria-label="revealed ? t('ui.hidePassword') : t('ui.showPassword')"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      >
        <UiIcon :name="revealed ? 'view-off' : 'view'" />
      </button>
    </div>
    <p v-if="hint" :id="`${id}-hint`" class="field__hint">{{ hint }}</p>
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

.field__hint {
  color: var(--fg-muted);
  font-size: var(--fs-caption);
}

.field__control {
  position: relative;
  display: flex;
}

.field__input {
  flex: 1;
  min-width: 0;
  min-height: var(--tap);
  padding: 0 var(--s-4);
  border: 1px solid var(--field-border);
  border-radius: var(--field-radius);
  background: var(--field-bg);
  color: var(--field-fg);
}

.field__input--with-action {
  padding-inline-end: var(--tap);
}

.field__action {
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--tap);
  padding: 0;
  border: 0;
  border-radius: var(--field-radius);
  background: transparent;
  color: var(--fg-muted);
  cursor: pointer;
}

.field__action:hover,
.field__action[aria-pressed='true'] {
  color: var(--field-fg);
}
</style>
