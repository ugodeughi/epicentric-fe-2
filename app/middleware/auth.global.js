import { NETWORK_ERROR } from '~/services/api/errors'

/** Pages that make no sense once signed in. */
const GUEST_ONLY = ['/login', '/signup']

export default defineNuxtRouteMiddleware(async (to) => {
  const { token, clearSession } = useSession()
  const inApp = to.path === '/app' || to.path.startsWith('/app/')

  if (!token.value) {
    if (!inApp) return
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  // The cookie is readable on the server: no flash of the login page for signed-in users.
  if (GUEST_ONLY.includes(to.path)) return navigateTo('/app')

  // The app is client-only (see routeRules): validate the token by loading the user once.
  if (inApp && import.meta.client) {
    try {
      await useAuth().ensureUser()
    } catch (error) {
      // Backend unreachable: keep the session and let the app render its offline state.
      if (error?.code === NETWORK_ERROR) return
      // Rejected token, deleted user, unexpected answer: the session cannot be trusted.
      clearSession()
      return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
    }
  }
})
