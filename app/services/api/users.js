import { LoginResponseSchema, UserSchema } from '~/schemas/user'
import { ApiError } from './errors'

/** @param {ReturnType<typeof import('./client').createApiClient>} api */
export function createUsersApi(api) {
  return {
    /** @param {{ email: string, password: string }} credentials */
    login({ email, password }) {
      return api('users/login', {
        method: 'POST',
        body: { Email: email, Password: password },
        schema: LoginResponseSchema,
      })
    },

    /** Invalidates the current token on the backend. */
    logout() {
      return api('users/logout', { method: 'POST' })
    },

    /**
     * Asks the backend to email a reset link. The lookup is case-sensitive while accounts
     * are stored lowercase, hence the normalisation.
     * @param {string} email
     */
    recoverPassword(email) {
      return api('users/password/recover', { method: 'POST', body: { Email: email.trim().toLowerCase() } })
    },

    /**
     * Sets a new password with the token received by email.
     * @param {{ token: string, password: string }} input
     */
    async resetPassword({ token, password }) {
      const data = await api(`users/password/reset/${encodeURIComponent(token)}`, {
        method: 'POST',
        body: { NewPassword: password },
      })
      // The backend reports an unknown or expired token as a *successful* envelope
      // whose Data is the error code.
      if (data === 'KO_INVALID_TOKEN') throw new ApiError(data, { status: 200 })
    },

    /** The user the current token belongs to. */
    current() {
      return api('users/current/details', { schema: UserSchema })
    },
  }
}
