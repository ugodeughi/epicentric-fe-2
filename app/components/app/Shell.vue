<script setup>
const { t } = useI18n()

// Concept names (Catalog, Epikey) are product terms and are not translated.
const items = [
  { to: '/app/catalog', icon: 'catalog', label: 'Catalog' },
  { to: '/app/keys', icon: 'epikey', label: 'Epikey' },
]
</script>

<template>
  <div class="shell">
    <aside class="shell__side">
      <AppLogo class="shell__logo" />
      <nav class="shell__nav" :aria-label="t('shell.navLabel')">
        <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="shell__link">
          <UiIcon :name="item.icon" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </aside>

    <main class="shell__main">
      <slot />
    </main>

    <!-- The persistent player is mounted here by the app layout (phase 2.7). -->
    <slot name="player" />
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100dvh;
}

.shell__side {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: var(--s-8);
  width: 236px;
  padding: var(--s-6) var(--s-3);
  background: var(--nav-bg);
  color: var(--nav-fg);
}

.shell__logo {
  padding: 0 var(--s-3);
}

.shell__nav {
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
}

.shell__link {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-height: var(--tap);
  padding: 0 var(--s-4);
  border-radius: var(--nav-item-radius);
  color: var(--nav-fg);
  text-decoration: none;
  transition: background var(--motion);
}

.shell__link.router-link-active {
  background: var(--nav-active-bg);
  color: var(--nav-active-fg);
  font-weight: var(--nav-active-weight);
}

.shell__main {
  flex: 1;
  min-width: 0;
  padding: var(--s-8);
}

/* Mobile: the sidebar becomes a bottom tab bar. */
@media (width < 800px) {
  .shell__side {
    position: fixed;
    inset: auto 0 0;
    z-index: 10;
    width: auto;
    padding: var(--s-2) var(--s-3) calc(var(--s-2) + env(safe-area-inset-bottom));
  }

  .shell__logo {
    display: none;
  }

  .shell__nav {
    flex-direction: row;
    justify-content: space-around;
  }

  .shell__link {
    flex: 1;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-height: 52px;
    padding: 0 var(--s-2);
    font-size: var(--fs-caption);
  }

  .shell__main {
    padding: var(--s-5) var(--s-4) calc(88px + env(safe-area-inset-bottom));
  }
}
</style>
