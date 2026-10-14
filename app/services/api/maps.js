import { z } from 'zod'
import { KeySchema, KeyTreeSchema, TemplateSchema } from '~/schemas/key'

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

    /**
     * Changes some fields of an Epikey. The backend refuses a save that says neither who
     * the parent is nor that the Epikey is a Map, so both travel with every change.
     * @param {import('~/schemas/key').Key} key the Epikey as loaded
     * @param {Record<string, unknown>} fields backend field names
     */
    updateKey(key, fields) {
      return api('maps/key/save', {
        method: 'POST',
        body: { Id: key.Id, ParentId: key.ParentId ?? null, IsRoot: Boolean(key.IsRoot), ...fields },
        schema: KeySchema,
      })
    },

    /**
     * Creates an empty Map.
     * @param {{ text: string, order?: number }} input
     */
    createMap({ text, order }) {
      return api('maps/key/save', {
        method: 'POST',
        body: { Text: text.trim(), ParentId: null, IsRoot: true, Order: order },
        schema: KeySchema,
      })
    },

    /**
     * Deletes an Epikey or a Map with everything under it, Links included.
     * @param {string} keyId
     */
    deleteKey(keyId) {
      return api(`maps/key/${encodeURIComponent(keyId)}/delete`, { method: 'DELETE' })
    },

    /**
     * Puts an Epikey (with its subtree) under another parent. The backend keeps the old
     * `Order`: follow with `setOrder` to place it among the new siblings.
     * @param {string} keyId
     * @param {string} parentId
     */
    moveKey(keyId, parentId) {
      return api('maps/key/move', {
        method: 'POST',
        body: { Item: { SourceId: keyId, DestinationId: parentId } },
      })
    },

    /**
     * Orders siblings as listed (the backend numbers them from 0).
     * @param {string[]} keyIds
     */
    setOrder(keyIds) {
      return api('maps/key/setorder', { method: 'POST', body: { Items: keyIds } })
    },

    /** Ready-made Maps, grouped by theme, in the language of the account. */
    templates() {
      return api('maps/templates', { schema: z.array(TemplateSchema) })
    },

    /**
     * Copies a template Map into a new Map of the user. The template's Links are not
     * copied: they point at contents of the template account.
     * @param {string} templateMapId
     */
    importTemplate(templateMapId) {
      return api('maps/templates/import', {
        method: 'POST',
        body: { Item: { Id: templateMapId }, ImportMedia: false },
        schema: KeySchema,
      })
    },

    /**
     * Copies a template Epikey, with its subtree, under a parent of the user.
     * @param {{ parentId: string, templateKeyId: string }} input
     */
    addTemplateKey({ parentId, templateKeyId }) {
      return api('maps/key/template/add', {
        method: 'POST',
        body: { ParentId: parentId, Item: templateKeyId },
        schema: KeySchema,
      })
    },
  }
}
