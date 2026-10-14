import { PlaylistSchema } from '~/schemas/playlist'

/** @param {ReturnType<typeof import('./client').createApiClient>} api */
export function createPlaybackApi(api) {
  return {
    /**
     * Makes the user's playlist out of Catalog contents, as the Play of the legacy Catalog.
     * It replaces whatever the user was listening to: the backend keeps one playlist.
     * @param {string[]} itemIds
     */
    fromItems(itemIds) {
      return api('items/playlist', { method: 'POST', body: { Items: itemIds }, schema: PlaylistSchema })
    },
  }
}
