<script setup>
definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const route = useRoute()
const { login } = useAuth()
useHead({ title: () => `${t('auth.login.submit')} · Epicentric` })

const email = ref('')
const password = ref('')
const pending = ref(false)
const errorKey = ref(null)

// method="post" on the form keeps credentials out of the URL should a native submit happen.
const hydrated = useHydrated()

async function onSubmit() {
  if (pending.value) return
  pending.value = true
  errorKey.value = null

  try {
    await login({ email: email.value.trim(), password: password.value })
    await navigateTo(safeRedirect(route.query.redirect))
  } catch (error) {
    errorKey.value = authErrorKey(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form class="stack" method="post" @submit.prevent="onSubmit">
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
    <UiAlert v-if="errorKey">{{ t(errorKey) }}</UiAlert>
    <UiButton type="submit" block :disabled="!hydrated || pending">
      {{ pending ? t('auth.login.submitting') : t('auth.login.submit') }}
    </UiButton>
    <p>
      <NuxtLink to="/forgot-password">{{ t('auth.login.forgot') }}</NuxtLink>
    </p>
  </form>
</template>
