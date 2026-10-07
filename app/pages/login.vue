<script setup>
definePageMeta({ layout: 'auth' })

const { t } = useI18n()
useHead({ title: () => `${t('auth.login.submit')} · Epicentric` })

const email = ref('')
const password = ref('')
const notWired = ref(false)

// Authentication is connected in phase 1.6 (useAuth + API client).
function onSubmit() {
  notWired.value = true
}
</script>

<template>
  <form class="login" @submit.prevent="onSubmit">
    <i18n-t keypath="auth.login.title" tag="h1" scope="global">
      <template #strong>
        <strong>{{ t('auth.login.titleStrong') }}</strong>
      </template>
    </i18n-t>
    <UiField v-model="email" :label="t('auth.email')" type="email" autocomplete="email" required />
    <UiField
      v-model="password"
      :label="t('auth.password')"
      type="password"
      autocomplete="current-password"
      required
    />
    <UiButton type="submit" block>{{ t('auth.login.submit') }}</UiButton>
    <p v-if="notWired" class="muted" role="status">{{ t('auth.notWired') }}</p>
  </form>
</template>

<style scoped>
.login {
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
}
</style>
