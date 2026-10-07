<template>
  <div class="auth">
    <header class="auth__header">
      <AppLogo />
      <AppLocaleSwitch />
    </header>
    <main class="auth__panel" data-surface="paper">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.auth {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-10);
  min-height: 100dvh;
  padding: var(--s-6) var(--s-4) var(--s-12);
}

.auth__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 960px;
}

.auth__panel {
  width: 100%;
  max-width: 440px;
  padding: var(--s-10) var(--s-8);
  border-radius: var(--panel-radius);
  box-shadow: var(--shadow-float);
}
</style>
