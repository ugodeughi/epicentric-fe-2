import { z } from 'zod'
import { KeySchema, KeyTreeSchema } from '~/schemas/key'

/** @param {ReturnType<typeof import('./client').createApiClient>} api */
export function createMapsApi(api) {
  return {
    /**
     * The user's Maps (root Epikeys). The backend creates "My first map" when there is none,
     * so the list is never empty.
     */
    list() {
      return api('maps/load', { schema: z.array(KeySchema) })
    },

    /**
     * A Map (or any Epikey) with its whole subtree, children sorted by `Order`.
     * With an id the user cannot access, the backend answers with their first Map.
     * @param {string} keyId
     */
    tree(keyId) {
      return api(`maps/key/${encodeURIComponent(keyId)}/loadrecursive`, { schema: KeyTreeSchema })
    },

    /**
     * Creates an Epikey under a parent.
     * @param {{ parentId: string, text: string, color?: string | null, order?: number }} input
     *   `color` as `#RRGGBB`, `order` as the position among the siblings
     */
    createKey({ parentId, text, color = null, order }) {
      return api('maps/key/save', {
        method: 'POST',
        body: { Text: text.trim(), ParentId: parentId, IsRoot: false, Color: color, Order: order },
        schema: KeySchema,
      })
    },
  }
}
