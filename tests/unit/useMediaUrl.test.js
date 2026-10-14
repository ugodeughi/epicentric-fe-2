import { beforeEach, describe, expect, it } from 'vitest'
import { useMediaUrl } from '../../app/composables/useMediaUrl'
import { useSession } from '../../app/composables/useSession'

beforeEach(() => {
  const { token, user } = useSession()
  token.value = 'jwt.with+odd/chars'
  user.value = { Id: 'user-1', Email: 'a@b.c' }
})

describe('useMediaUrl', () => {
  it('builds the address of a resized image, with the token for native elements', () => {
    const base = useRuntimeConfig().public.apiBase
    expect(useMediaUrl().image('abc.png', 320)).toBe(
      `${base}items/src/user-1/abc.png/320/320?token=jwt.with%2Bodd%2Fchars`,
    )
  })

  it('escapes a file name so it stays one path segment', () => {
    expect(useMediaUrl().image('my photo/../x.jpg', 100)).toContain(
      '/user-1/my%20photo%2F..%2Fx.jpg/100/100?',
    )
  })

  it('builds the address of the thumbnail of a content', () => {
    const base = useRuntimeConfig().public.apiBase
    expect(useMediaUrl().thumb('item-9')).toBe(
      `${base}items/thumb/user-1/item-9?token=jwt.with%2Bodd%2Fchars`,
    )
    expect(useMediaUrl().thumb(null)).toBeNull()
  })

  it('builds the address of the audio stream of a playlist track, from a whole second', () => {
    const base = useRuntimeConfig().public.apiBase
    expect(useMediaUrl().stream('lfh6vn')).toBe(
      `${base}streaming/user-1/audio/0/lfh6vn?token=jwt.with%2Bodd%2Fchars`,
    )
    expect(useMediaUrl().stream('lfh6vn', 41.6)).toContain('/audio/42/lfh6vn?')
    expect(useMediaUrl().stream(null)).toBeNull()
  })

  it('gives nothing without a file or outside a session', () => {
    expect(useMediaUrl().image(null, 100)).toBeNull()
    useSession().clearSession()
    expect(useMediaUrl().image('abc.png', 100)).toBeNull()
  })
})
