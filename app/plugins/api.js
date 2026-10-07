import { createApiClient } from '~/services/api/client'
import { createUsersApi } from '~/services/api/users'

export default defineNuxtPlugin(() => {
  const { clearSession, token } = useSession()

  const client = createApiClient({
    baseURL: useRuntimeConfig().public.apiBase,
    getToken: () => token.value,
    // Any 401 means the token is missing, expired or revoked: drop the session.
    onUnauthorized: () => {
      const wasLoggedIn = Boolean(token.value)
      clearSession()
      if (wasLoggedIn && import.meta.client) navigateTo('/login')
    },
  })

  return {
    provide: {
      api: {
        users: createUsersApi(client),
      },
    },
  }
})
