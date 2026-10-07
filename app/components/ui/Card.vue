<template>
  <div class="card"><slot /></div>
</template>

<style scoped>
.card {
  padding: var(--s-6);
  border: var(--card-border);
  border-radius: var(--card-radius);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
}
</style>
