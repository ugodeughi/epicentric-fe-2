<script setup>
definePageMeta({ layout: 'auth' })

const { t, locale } = useI18n()
const route = useRoute()
const { signup } = useAuth()
useHead({ title: () => `${t('auth.signup.submit')} · Epicentric` })

const MIN_LENGTH = 8
const TERMS_URL = 'https://www.epicentric.world/terms-of-use.html'
const PRIVACY_URL = 'https://www.epicentric.world/privacy-policy.html'

const email = ref('')
const password = ref('')
const confirmation = ref('')
const birthday = ref('')
const terms = ref(false)
// Asked like in the legacy form, which never sent it: the backend has no field for it yet
// (see docs/richieste-be.md).
const newsletter = ref(false)
const ageConfirmed = ref(false)
const pending = ref(false)
const errorKey = ref(null)
const hydrated = useHydrated()
const today = isoDay()

// Same rule as the legacy form: the button stays disabled until every mandatory field is
// filled, both declarations are ticked and the date of birth says 18 or more.
const underage = computed(() => ageOn(birthday.value) !== null && !isAdult(birthday.value))
const canSubmit = computed(
  () =>
    Boolean(email.value.trim() && password.value && confirmation.value) &&
    terms.value &&
    ageConfirmed.value &&
    isAdult(birthday.value),
)

async function onSubmit() {
  if (pending.value) return
  errorKey.value = null

  if (password.value !== confirmation.value) {
    errorKey.value = 'auth.errors.passwordMismatch'
    return
  }
  if (!isAdult(birthday.value)) {
    errorKey.value = 'auth.errors.underage'
    return
  }

  pending.value = true
  try {
    await signup({
      email: email.value,
      password: password.value,
      birthday: birthday.value,
      language: backendLanguage(locale.value),
      campaign: typeof route.query.campaign === 'string' ? route.query.campaign : undefined,
    })
    await navigateTo('/app')
  } catch (error) {
    errorKey.value = authErrorKey(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form class="stack" method="post" @submit.prevent="onSubmit">
    <i18n-t keypath="auth.signup.title" tag="h1" scope="global">
      <template #strong>
        <strong>{{ t('auth.signup.titleStrong') }}</strong>
      </template>
    </i18n-t>
    <UiField v-model="email" :label="t('auth.email')" type="email" autocomplete="email" required />
    <UiField
      v-model="password"
      :label="t('auth.password')"
      type="password"
      autocomplete="new-password"
      required
      :minlength="MIN_LENGTH"
      :hint="t('auth.reset.rule', { min: MIN_LENGTH })"
    />
    <UiField
      v-model="confirmation"
      :label="t('auth.signup.confirmPassword')"
      type="password"
      autocomplete="new-password"
      required
      :minlength="MIN_LENGTH"
    />
    <UiField
      v-model="birthday"
      :label="t('auth.signup.birthday')"
      type="date"
      autocomplete="bday"
      required
      :max="today"
      :hint="t('auth.signup.birthdayHint', { age: LEGAL_AGE })"
    />
    <div class="stack-tight">
      <UiCheckbox v-model="terms" required>
        <i18n-t keypath="auth.signup.terms" scope="global">
          <template #terms>
            <a :href="TERMS_URL" target="_blank" rel="noopener">{{ t('auth.signup.termsLink') }}</a>
          </template>
          <template #privacy>
            <a :href="PRIVACY_URL" target="_blank" rel="noopener">{{ t('auth.signup.privacyLink') }}</a>
          </template>
        </i18n-t>
      </UiCheckbox>
      <UiCheckbox v-model="newsletter">{{ t('auth.signup.newsletter') }}</UiCheckbox>
      <UiCheckbox v-model="ageConfirmed" required>{{ t('auth.signup.ageConfirmed') }}</UiCheckbox>
    </div>
    <UiAlert v-if="underage">{{ t('auth.errors.underage', { age: LEGAL_AGE }) }}</UiAlert>
    <UiAlert v-else-if="errorKey">{{ t(errorKey, { age: LEGAL_AGE }) }}</UiAlert>
    <UiButton type="submit" block :disabled="!hydrated || pending || !canSubmit">
      {{ pending ? t('auth.signup.submitting') : t('auth.signup.submit') }}
    </UiButton>
    <p>
      <NuxtLink to="/login">{{ t('auth.signup.haveAccount') }}</NuxtLink>
    </p>
  </form>
</template>
