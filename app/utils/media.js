const IMAGE_EXTENSIONS = /^(jpe?g|png|gif|webp|bmp|avif)$/i

/** Catalog sections: address segment → backend `Type` of `items/load`. */
export const CATALOG_SECTIONS = Object.freeze({
  audio: 'Audio',
  visual: 'Video',
  files: 'File',
  bookmarks: 'Bookmark',
})

/**
 * What a content is, for its icon and its viewer.
 * Older images have no `MediaSubType`: their extension says it.
 * @param {import('~/schemas/item').Item} item
 * @returns {'audio' | 'image' | 'video' | 'embed' | 'file' | 'bookmark'}
 */
export function itemKind(item) {
  switch (item?.MediaType) {
    case 0:
      return 'audio'
    case 1:
      if (item.MediaSubType === 1) return 'video'
      if (item.MediaSubType === 2) return 'embed'
      if (item.MediaSubType === 0 || IMAGE_EXTENSIONS.test(item.FileExtension ?? '')) return 'image'
      return 'video'
    case 3:
      return 'bookmark'
    default:
      return 'file'
  }
}

/** @param {import('~/schemas/item').Item} item */
export function isImage(item) {
  return itemKind(item) === 'image' && Boolean(item.FileName)
}

/**
 * `m:ss`, or `h:mm:ss` from one hour; empty without a length.
 * @param {number | null | undefined} seconds
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return ''
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

/**
 * Name to show: the name the content has in the Catalog, as in the legacy app, without
 * the extension of the uploaded file. The title read from the file comes second: in
 * older contents it can be a technical leftover such as `BodyPart_…`.
 * @param {import('~/schemas/item').Item} item
 */
export function itemTitle(item) {
  const name = item?.ItemName?.trim().replace(/\.[a-z0-9]{2,5}$/i, '')
  return name || item?.Title?.trim() || ''
}
