/**
 * Fixed palette the user picks an Epikey colour from. Each id maps to the CSS token
 * `--epikey-<id>` defined by the active theme.
 */
export const EPIKEY_COLORS = Object.freeze([
  'teal',
  'yellow',
  'pink',
  'blue',
  'violet',
  'coral',
  'lime',
  'sky',
  'orange',
  'sand',
])

/** @param {string} id */
export function epikeyColorVar(id) {
  return EPIKEY_COLORS.includes(id) ? `var(--epikey-${id})` : 'var(--inset-bg)'
}
