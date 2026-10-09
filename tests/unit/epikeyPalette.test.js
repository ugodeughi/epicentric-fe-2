// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EPIKEY_COLORS, EPIKEY_HEX, epikeyColorHex, epikeyColorId } from '../../app/utils/epikeyPalette'

const tokens = readFileSync(
  join(import.meta.dirname, '../../app/assets/themes/epicentric/tokens.css'),
  'utf8',
)

describe('Epikey palette', () => {
  it('saves for each palette id the same colour the theme shows', () => {
    for (const id of EPIKEY_COLORS) {
      const token = new RegExp(`--epikey-${id}:\\s*(#[0-9a-f]{6})`, 'i').exec(tokens)?.[1]
      expect(EPIKEY_HEX[id].toLowerCase(), id).toBe(token?.toLowerCase())
    }
  })

  it('goes from a palette id to the saved colour and back', () => {
    for (const id of EPIKEY_COLORS) expect(epikeyColorId(epikeyColorHex(id))).toBe(id)
    expect(epikeyColorHex('nope')).toBeNull()
    expect(epikeyColorHex(null)).toBeNull()
  })

  it('maps a colour picked freely in the legacy app to the closest palette colour', () => {
    expect(epikeyColorId('#ff0000')).toBe('coral')
    expect(epikeyColorId('#0000FF')).toBe('blue')
    expect(epikeyColorId('#4fc')).toBe('teal')
    expect(epikeyColorId('teal')).toBe('teal')
  })

  it('treats no colour, the legacy default white and garbage as no colour', () => {
    expect(epikeyColorId(null)).toBeNull()
    expect(epikeyColorId('')).toBeNull()
    expect(epikeyColorId('#FFFFFF')).toBeNull()
    expect(epikeyColorId('#fff')).toBeNull()
    expect(epikeyColorId('rgb(1, 2, 3)')).toBeNull()
  })
})
