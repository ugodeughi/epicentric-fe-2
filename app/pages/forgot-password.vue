<script setup>
definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const { requestPasswordReset } = useAuth()
useHead({ title: () => `${t('auth.forgot.titleStrong')} · Epicentric` })

const email = ref('')
const pending = ref(false)
const sent = ref(false)
const errorKey = ref(null)
const hydrated = useHydrated()

async function onSubmit() {
  if (pending.value) return
  pending.value = true
  errorKey.value = null

  try {
    await requestPasswordReset(email.value)
    sent.value = true
  } catch (error) {
    errorKey.value = authErrorKey(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div v-if="sent" class="stack">
    <h1>
      <strong>{{ t('auth.forgot.sentTitle') }}</strong>
    </h1>
    <UiAlert role="status">{{ t('auth.forgot.sentBody', { email: email.trim() }) }}</UiAlert>
    <p class="muted">{{ t('auth.forgot.sentHint') }}</p>
    <UiButton to="/login" variant="secondary" block>{{ t('auth.backToLogin') }}</UiButton>
  </div>

  <form v-else class="stack" method="post" @submit.prevent="onSubmit">
    <i18n-t keypath="auth.forgot.title" tag="h1" scope="global">
      <template #strong>
        <strong>{{ t('auth.forgot.titleStrong') }}</strong>
      </template>
    </i18n-t>
    <p class="muted">{{ t('auth.forgot.intro') }}</p>
    <UiField v-model="email" :label="t('auth.email')" type="email" autocomplete="email" required />
    <UiAlert v-if="errorKey">{{ t(errorKey) }}</UiAlert>
    <UiButton type="submit" block :disabled="!hydrated || pending">
      {{ pending ? t('auth.forgot.submitting') : t('auth.forgot.submit') }}
    </UiButton>
    <p>
      <NuxtLink to="/login">{{ t('auth.backToLogin') }}</NuxtLink>
    </p>
  </form>
</template>
