<template>
  <AppShell>
    <slot />
    <template #player>
      <ClientOnly>
        <AppPlayer />
      </ClientOnly>
    </template>
  </AppShell>
</template>
