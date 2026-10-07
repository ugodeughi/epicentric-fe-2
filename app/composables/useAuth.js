export function useAuth() {
  const { token, user, clearSession } = useSession()
  const api = useApi()

  const isLoggedIn = computed(() => Boolean(token.value))

  /** @param {{ email: string, password: string }} credentials */
  async function login(credentials) {
    const { Auth, User } = await api.users.login(credentials)
    token.value = Auth
    user.value = User
  }

  /**
   * Creates the account and signs in straight away (the backend does not wait for the
   * email confirmation).
   * @param {{ email: string, password: string, birthday: string, language: string, campaign?: string }} input
   */
  async function signup(input) {
    await api.users.signup(input)
    await login({ email: input.email, password: input.password })
  }

  /** @param {string} code one-time code from the confirmation email */
  function confirmEmail(code) {
    return api.users.confirmEmail(code)
  }

  async function logout() {
    try {
      if (token.value) await api.users.logout()
    } catch {
      // The local session is dropped anyway: the token simply expires on its own.
    } finally {
      clearSession()
    }
    await navigateTo('/login')
  }

  /** Loads the current user once per session; a rejected token clears the session. */
  async function ensureUser() {
    if (!token.value) return null
    if (!user.value) user.value = await api.users.current()
    return user.value
  }

  /**
   * Requests a reset link. Resolves the same way whether or not the address belongs to
   * an account, so the form never reveals who is registered.
   * @param {string} email
   */
  async function requestPasswordReset(email) {
    try {
      await api.users.recoverPassword(email)
    } catch (error) {
      if (error?.code !== 'KO_USER_NOT_FOUND') throw error
    }
  }

  /** @param {{ token: string, password: string }} input */
  function resetPassword(input) {
    return api.users.resetPassword(input)
  }

  return {
    user,
    isLoggedIn,
    login,
    signup,
    confirmEmail,
    logout,
    ensureUser,
    requestPasswordReset,
    resetPassword,
  }
}
