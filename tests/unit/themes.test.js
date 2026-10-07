// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '../../app')
const themesDir = join(root, 'assets/themes')

/** Names of the custom properties declared in a CSS source. */
function declared(css) {
  return new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]))
}

/** Names of the custom properties read through var(). */
function used(source) {
  return new Set([...source.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const themes = readdirSync(themesDir).filter((name) => statSync(join(themesDir, name)).isDirectory())
const tokensOf = (theme) => declared(readFileSync(join(themesDir, theme, 'tokens.css'), 'utf8'))
const reference = tokensOf('epicentric')

describe('themes', () => {
  it.each(themes)('%s defines exactly the tokens of the reference theme', (theme) => {
    expect([...tokensOf(theme)].sort()).toEqual([...reference].sort())
  })

  it('every variable read by the app is defined by the theme contract', () => {
    const contract = new Set([
      ...reference,
      ...declared(readFileSync(join(root, 'assets/css/component-tokens.css'), 'utf8')),
    ])
    const sources = walk(root).filter((p) => /\.(vue|css)$/.test(p) && !p.startsWith(themesDir))

    const missing = sources.flatMap((path) =>
      [...used(readFileSync(path, 'utf8'))]
        // `--_name` is a private, component-local variable.
        .filter((name) => !name.startsWith('--_') && !contract.has(name))
        .map((name) => `${path.slice(root.length + 1)}: ${name}`),
    )

    expect(missing).toEqual([])
  })
})
