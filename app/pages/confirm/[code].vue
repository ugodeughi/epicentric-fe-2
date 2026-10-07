<script setup>
definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const route = useRoute()
const { confirmEmail, isLoggedIn } = useAuth()
useHead({ title: () => `${t('auth.confirm.title')} · Epicentric` })

/** @type {import('vue').Ref<'pending' | 'done' | 'invalid' | 'error'>} */
const state = ref('pending')

// The code works once: confirm from the browser only, never during server rendering.
onMounted(async () => {
  try {
    await confirmEmail(String(route.params.code))
    state.value = 'done'
  } catch (error) {
    state.value = error?.code === 'KO_NOT_FOUND' ? 'invalid' : 'error'
  }
})
</script>

<template>
  <div class="stack">
    <h1>
      <strong>{{ t('auth.confirm.title') }}</strong>
    </h1>
    <p v-if="state === 'pending'" class="muted" role="status">{{ t('auth.confirm.pending') }}</p>
    <UiAlert v-else-if="state === 'done'" role="status">{{ t('auth.confirm.done') }}</UiAlert>
    <UiAlert v-else-if="state === 'invalid'">{{ t('auth.confirm.invalid') }}</UiAlert>
    <UiAlert v-else>{{ t('auth.errors.network') }}</UiAlert>
    <UiButton v-if="state !== 'pending'" :to="isLoggedIn ? '/app' : '/login'" block>
      {{ isLoggedIn ? t('auth.confirm.openApp') : t('auth.login.submit') }}
    </UiButton>
  </div>
</template>
