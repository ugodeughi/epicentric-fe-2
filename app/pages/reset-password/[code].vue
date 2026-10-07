<script setup>
definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const route = useRoute()
const { resetPassword } = useAuth()
useHead({ title: () => `${t('auth.reset.titleStrong')} · Epicentric` })

const MIN_LENGTH = 8

const password = ref('')
const confirmation = ref('')
const pending = ref(false)
const done = ref(false)
const errorKey = ref(null)
const hydrated = useHydrated()

// The link can no longer be used: offer to request a new one.
const linkExpired = computed(() => errorKey.value === 'auth.errors.resetLinkInvalid')

async function onSubmit() {
  if (pending.value) return
  errorKey.value = null

  if (password.value !== confirmation.value) {
    errorKey.value = 'auth.errors.passwordMismatch'
    return
  }

  pending.value = true
  try {
    await resetPassword({ token: String(route.params.code), password: password.value })
    done.value = true
  } catch (error) {
    errorKey.value = authErrorKey(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div v-if="done" class="stack">
    <h1>
      <strong>{{ t('auth.reset.doneTitle') }}</strong>
    </h1>
    <UiAlert role="status">{{ t('auth.reset.doneBody') }}</UiAlert>
    <UiButton to="/login" block>{{ t('auth.login.submit') }}</UiButton>
  </div>

  <form v-else class="stack" method="post" @submit.prevent="onSubmit">
    <i18n-t keypath="auth.reset.title" tag="h1" scope="global">
      <template #strong>
        <strong>{{ t('auth.reset.titleStrong') }}</strong>
      </template>
    </i18n-t>
    <UiField
      v-model="password"
      :label="t('auth.reset.newPassword')"
      type="password"
      autocomplete="new-password"
      required
      :minlength="MIN_LENGTH"
      :hint="t('auth.reset.rule', { min: MIN_LENGTH })"
    />
    <UiField
      v-model="confirmation"
      :label="t('auth.reset.confirmPassword')"
      type="password"
      autocomplete="new-password"
      required
      :minlength="MIN_LENGTH"
    />
    <UiAlert v-if="errorKey">{{ t(errorKey) }}</UiAlert>
    <UiButton v-if="linkExpired" to="/forgot-password" block>{{ t('auth.reset.requestNew') }}</UiButton>
    <UiButton v-else type="submit" block :disabled="!hydrated || pending">
      {{ pending ? t('auth.reset.submitting') : t('auth.reset.submit') }}
    </UiButton>
  </form>
</template>
