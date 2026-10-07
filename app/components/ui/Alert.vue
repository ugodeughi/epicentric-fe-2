<script setup>
defineProps({
  /** `alert` interrupts screen readers (errors); `status` is announced politely (confirmations). */
  role: { type: String, default: 'alert' },
})
</script>

<template>
  <p class="alert" :role="role"><slot /></p>
</template>

<style scoped>
.alert {
  padding: var(--s-3) var(--s-4);
  border-inline-start: 4px solid var(--alert-mark);
  border-radius: var(--alert-radius);
  background: var(--alert-bg);
  color: var(--alert-fg);
  font-size: var(--fs-small);
  font-weight: var(--fw-semibold);
}
</style>
