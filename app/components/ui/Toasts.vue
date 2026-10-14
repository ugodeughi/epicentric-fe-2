<script setup>
const { t } = useI18n()
const { toasts, dismiss } = useToast()
</script>

<template>
  <!-- Always in the page, so screen readers already watch it when a message arrives. -->
  <div class="toasts">
    <div class="toasts__polite" role="status">
      <template v-for="toast in toasts" :key="toast.id">
        <p v-if="toast.tone !== 'error'" class="toast">
          <span>{{ toast.text }}</span>
          <button
            type="button"
            class="toast__close"
            :aria-label="t('dialog.close')"
            @click="dismiss(toast.id)"
          >
            <UiIcon name="close" :size="16" />
          </button>
        </p>
      </template>
    </div>
    <div class="toasts__urgent" role="alert">
      <template v-for="toast in toasts" :key="toast.id">
        <p v-if="toast.tone === 'error'" class="toast toast--error">
          <span>{{ toast.text }}</span>
          <button
            type="button"
            class="toast__close"
            :aria-label="t('dialog.close')"
            @click="dismiss(toast.id)"
          >
            <UiIcon name="close" :size="16" />
          </button>
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  inset-inline-end: var(--s-4);
  bottom: calc(var(--s-4) + var(--player-offset));
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  width: min(380px, calc(100vw - 2 * var(--s-4)));
  pointer-events: none;
}

/* Not display: contents, which drops live regions from the accessibility tree in some browsers. */
.toasts__polite,
.toasts__urgent {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-3) var(--s-3) var(--s-4);
  border-inline-start: 4px solid var(--toast-mark);
  border-radius: var(--toast-radius);
  background: var(--toast-bg);
  box-shadow: var(--toast-shadow);
  color: var(--toast-fg);
  font-size: var(--fs-small);
  font-weight: var(--fw-semibold);
  pointer-events: auto;
}

.toast--error {
  border-inline-start-color: var(--toast-error-mark);
}

.toast span {
  flex: 1;
}

.toast__close {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: var(--r-pill);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

@media (width < 800px) {
  .toasts {
    /* Above the tab bar. */
    bottom: calc(var(--tap) + 2 * var(--s-4) + var(--player-offset));
  }
}
</style>
