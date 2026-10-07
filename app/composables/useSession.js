const THIRTY_DAYS = 60 * 60 * 24 * 30

/**
 * Raw session storage: the JWT in a cookie (readable by the server too, so public pages
 * can redirect signed-in users without a flash) and the current user in shared state.
 * Use `useAuth` for anything that talks to the backend.
 */
export function useSession() {
  const token = useCookie('ec_token', {
    maxAge: THIRTY_DAYS,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
  })
  /** @type {import('vue').Ref<import('~/schemas/user').User | null>} */
  const user = useState('session:user', () => null)

  function clearSession() {
    token.value = null
    user.value = null
  }

  return { token, user, clearSession }
}
