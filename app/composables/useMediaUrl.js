/**
 * Addresses of the user's files for native elements (`<img>`, `<audio>`, CSS backgrounds).
 * Those cannot send the Authorization header, so the token travels in the address.
 */
export function useMediaUrl() {
  const { token, user } = useSession()
  const base = useRuntimeConfig().public.apiBase

  /**
   * An image resized by the backend to fit a square of `size` px.
   * @param {string | null | undefined} file content id, or file name as saved on an Epikey
   * @param {number} size
   * @returns {string | null} null without a file or outside a session
   */
  function image(file, size) {
    if (!file || !user.value?.Id || !token.value) return null
    const path = [user.value.Id, file, size, size].map(encodeURIComponent).join('/')
    return `${base}items/src/${path}?token=${encodeURIComponent(token.value)}`
  }

  /**
   * The thumbnail of a content.
   * @param {string | null | undefined} itemId
   * @returns {string | null}
   */
  function thumb(itemId) {
    if (!itemId || !user.value?.Id || !token.value) return null
    const path = [user.value.Id, itemId].map(encodeURIComponent).join('/')
    return `${base}items/thumb/${path}?token=${encodeURIComponent(token.value)}`
  }

  return { image, thumb }
}
