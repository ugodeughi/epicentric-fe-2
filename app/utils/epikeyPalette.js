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

/**
 * Value saved in the backend (`Key.Color`) for each palette id. The legacy frontend reads
 * that field as a free `#RRGGBB` colour, and both frontends share the data.
 * Must match the `--epikey-<id>` tokens (checked by tests/unit/epikeyPalette.test.js).
 */
export const EPIKEY_HEX = Object.freeze({
  teal: '#4FC1A6',
  yellow: '#F2C14E',
  pink: '#E86A92',
  blue: '#6C9CF0',
  violet: '#B49CF0',
  coral: '#F08A5D',
  lime: '#A8D672',
  sky: '#7FD1E8',
  orange: '#FFB84D',
  sand: '#D5CFBD',
})

/** @param {string} id */
export function epikeyColorVar(id) {
  return EPIKEY_COLORS.includes(id) ? `var(--epikey-${id})` : 'var(--hex-empty-bg)'
}

/** @param {string | null | undefined} id palette id */
export function epikeyColorHex(id) {
  return EPIKEY_HEX[id] ?? null
}

/**
 * Palette id for a colour saved in the backend. A colour outside the palette (picked
 * freely in the legacy frontend) maps to the closest palette colour; no colour, or the
 * legacy default white, maps to none.
 * @param {string | null | undefined} color `#RRGGBB`, `#RGB` or a palette id
 * @returns {string | null}
 */
export function epikeyColorId(color) {
  if (!color) return null
  if (EPIKEY_COLORS.includes(color)) return color

  const rgb = parseHex(color)
  if (!rgb || rgb.every((channel) => channel === 255)) return null

  let closest = null
  let shortest = Infinity
  for (const id of EPIKEY_COLORS) {
    const distance = parseHex(EPIKEY_HEX[id]).reduce((sum, channel, i) => sum + (channel - rgb[i]) ** 2, 0)
    if (distance < shortest) {
      shortest = distance
      closest = id
    }
  }
  return closest
}

/** @returns {[number, number, number] | null} */
function parseHex(value) {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value).trim())
  if (!match) return null
  const hex = match[1].length === 3 ? [...match[1]].map((c) => c + c).join('') : match[1]
  return [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
}
