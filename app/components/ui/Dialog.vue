<script setup>
/**
 * Modal dialog on the native <dialog>: the browser traps the focus, closes it with Esc and
 * gives the focus back to what opened it.
 */
const open = defineModel('open', { type: Boolean, default: false })

defineProps({
  title: { type: String, required: true },
  /** Shorter dialogs for confirmations, wider ones for choices. */
  wide: { type: Boolean, default: false },
})

const { t } = useI18n()
const dialog = ref(null)
const titleId = useId()

watch(
  [open, dialog],
  ([value, element]) => {
    if (!element) return
    if (value && !element.open) element.showModal()
    if (!value && element.open) element.close()
  },
  { immediate: true },
)

// Esc, the close button and a click on the backdrop all end here.
function onClose() {
  open.value = false
}

function onClick(event) {
  if (event.target === dialog.value) dialog.value.close()
}
</script>

<template>
  <dialog
    ref="dialog"
    class="dialog"
    :class="{ 'dialog--wide': wide }"
    :aria-labelledby="titleId"
    @close="onClose"
    @click="onClick"
  >
    <div class="dialog__box">
      <header class="dialog__head">
        <h2 :id="titleId" class="dialog__title">{{ title }}</h2>
        <button type="button" class="dialog__close" :aria-label="t('dialog.close')" @click="dialog.close()">
          <UiIcon name="close" />
        </button>
      </header>
      <div class="dialog__body">
        <slot />
      </div>
      <footer v-if="$slots.actions" class="dialog__actions">
        <slot name="actions" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(440px, calc(100vw - 2 * var(--s-4)));
  max-height: calc(100dvh - 2 * var(--s-4));
  padding: 0;
  border: 0;
  border-radius: var(--dialog-radius);
  background: var(--dialog-bg);
  box-shadow: var(--dialog-shadow);
  color: var(--fg);
}

.dialog--wide {
  width: min(720px, calc(100vw - 2 * var(--s-4)));
}

.dialog::backdrop {
  background: var(--dialog-backdrop);
  opacity: 0.85;
}

.dialog__box {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding: var(--s-6);
}

.dialog__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-4);
}

.dialog__title {
  font-size: var(--fs-h2);
  font-weight: var(--fw-bold);
}

.dialog__close {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: var(--tap);
  height: var(--tap);
  margin: calc(-1 * var(--s-2));
  padding: 0;
  border: 0;
  border-radius: var(--r-pill);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.dialog__close:hover {
  background: var(--inset-bg);
}

.dialog__body {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.dialog__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--s-2);
}
</style>
