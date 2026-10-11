import { z } from 'zod'

/**
 * Catalog content as kept by the client. Field names follow the backend model
 * `MediaItem` (PascalCase); only the fields the app reads are kept.
 */
export const ItemSchema = z.object({
  Id: z.string(),
  /** Name of the file in the user's storage: `<Id>.<extension>`. */
  FileName: z.string().nullish(),
  /** Name shown to the user; for an upload, the original file name. */
  ItemName: z.string().nullish(),
  /** 0 Audio, 1 Video (images, MP4, embeds), 2 File, 3 Bookmark. */
  MediaType: z.number().nullish(),
  /** For MediaType 1: 0 Image, 1 Video, 2 Embed. */
  MediaSubType: z.number().nullish(),
  ImportDate: z.string().nullish(),
})

/** One uploaded file, as answered by `items/upload`. */
export const UploadedSchema = z.array(z.object({ mediaItem: ItemSchema })).min(1)

/** A page of a Catalog section: the backend always answers with groups of items. */
export const ItemsPageSchema = z.object({
  Items: z.array(z.object({ Items: z.array(ItemSchema).nullish() })),
  Count: z.number().nullish(),
  More: z.boolean().nullish(),
})

/** @typedef {z.infer<typeof ItemSchema>} Item */
