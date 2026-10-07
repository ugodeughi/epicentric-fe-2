import { NETWORK_ERROR } from '~/services/api/errors'

const KEYS = {
  KO_PASSWORD_INVALID: 'auth.errors.invalid',
  KO_INVALID_LOGIN: 'auth.errors.invalid',
  KO_LOCKED: 'auth.errors.locked',
  KO_NOT_FOUND_DELETE_PENDING: 'auth.errors.deletePending',
  KO_EMAIL_ALREADY_USED: 'auth.errors.emailUsed',
  KO_ALREADY_EXIST: 'auth.errors.emailUsed',
  KO_INVALID_EMAIL: 'auth.errors.emailInvalid',
  KO_INVALID_TOKEN: 'auth.errors.resetLinkInvalid',
  KO_PSW_MUST_BE_DIFFERENT: 'auth.errors.samePassword',
  [NETWORK_ERROR]: 'auth.errors.network',
}

/** i18n key of the message to show for a failed authentication request. */
export function authErrorKey(error) {
  return KEYS[error?.code] ?? 'auth.errors.generic'
}

/** Only in-app paths are accepted as a post-login destination (no open redirect). */
export function safeRedirect(target, fallback = '/app') {
  return typeof target === 'string' && /^\/app(\/|$)/.test(target) ? target : fallback
}
