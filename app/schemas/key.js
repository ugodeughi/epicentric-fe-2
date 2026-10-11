import { z } from 'zod'

/**
 * Epikey as kept by the client. Maps are Epikeys with `IsRoot: true`.
 * Field names follow the backend model `Key` (PascalCase); only the fields the app
 * reads are kept.
 */
export const KeySchema = z.object({
  Id: z.string(),
  Text: z.string().nullish(),
  Description: z.string().nullish(),
  ParentId: z.string().nullish(),
  IsRoot: z.boolean().nullish(),
  Order: z.number().nullish(),
  /** Free `#RRGGBB` colour (see utils/epikeyPalette.js). */
  Color: z.string().nullish(),
  LinksCount: z.number().nullish(),
  /** File name of the image behind the Map (a Catalog image), as the legacy frontend saves it. */
  BackgroundImage: z.string().nullish(),
  /** How much the background image is darkened, 0 to 1. */
  Opacity: z.number().nullish(),
  /** Map orientation, read on the root: tree growing left to right instead of top down. */
  Horizontal: z.boolean().nullish(),
})

/** Epikey with its whole subtree, as returned by `maps/key/:id/loadrecursive`. */
export const KeyTreeSchema = KeySchema.extend({
  get Children() {
    return z.array(KeyTreeSchema).nullish()
  },
})

/** @typedef {z.infer<typeof KeySchema>} Key */
/** @typedef {Key & { Children?: KeyTree[] | null }} KeyTree */
