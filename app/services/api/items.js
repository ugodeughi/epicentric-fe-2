import { z } from 'zod'
import { ItemSchema, ItemsPageSchema, UploadedSchema } from '~/schemas/item'
import { ApiError } from './errors'

/** The file is already in the user's Catalog (same content). */
export const DUPLICATED = 'KO_DUPLICATED'
/** The file does not fit in the storage space of the user's plan. */
export const QUOTA_EXCEEDED = 'QUOTA_EXCEEDED'

/** @param {ReturnType<typeof import('./client').createApiClient>} api */
export function createItemsApi(api) {
  return {
    /**
     * Uploads one file to the Catalog. One file per request: the backend fails the whole
     * request when any of its files fails.
     * @param {File} file
     * @returns {Promise<import('~/schemas/item').Item>}
     */
    async upload(file) {
      const body = new FormData()
      body.append('fileUpload', file)

      try {
        const [{ mediaItem }] = await api('items/upload', {
          method: 'POST',
          body,
          schema: UploadedSchema,
          envelope: false,
        })
        return mediaItem
      } catch (error) {
        // A file already in the Catalog is refused with 409 and no body at all.
        if (error?.code === 'HTTP_409') throw new ApiError(DUPLICATED, { status: 409, cause: error })
        throw error
      }
    },

    /**
     * A page of a Catalog section.
     * @param {{ type: 'Audio' | 'Video' | 'File' | 'Bookmark', search?: string, order?: string, page?: number, pageSize?: number }} input
     *   `search`: words are matched in OR against name, file name, collection and artist
     * @returns {Promise<{ items: import('~/schemas/item').Item[], count: number, more: boolean }>}
     */
    async load({ type, search = '', order = 'ImportDate desc', page = 0, pageSize = 50 }) {
      const data = await api('items/load', {
        method: 'POST',
        body: {
          Type: type,
          Search: search.trim() || '*',
          Order: order,
          Group: '',
          Page: page,
          PageSize: pageSize,
        },
        schema: ItemsPageSchema,
      })
      const items = data.Items.flatMap((group) => group.Items ?? [])
      return { items, count: data.Count ?? items.length, more: Boolean(data.More) }
    },

    /**
     * Changes some fields of a content.
     * @param {string} id
     * @param {Record<string, unknown>} fields backend field names, e.g. `{ IsFreezed: true }`
     * @returns {Promise<import('~/schemas/item').Item>}
     */
    async save(id, fields) {
      const [saved] = await api('items/save', {
        method: 'POST',
        body: { Item: { Id: id, ...fields } },
        schema: z.array(ItemSchema).min(1),
      })
      return saved
    },
  }
}
