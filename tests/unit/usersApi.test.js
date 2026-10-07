// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createApiClient } from '../../app/services/api/client'
import { createUsersApi } from '../../app/services/api/users'
import { authErrorKey, safeRedirect } from '../../app/utils/authErrors'

const user = { Id: 'u1', Email: 'a@b.c', Password: '$2a$10$hash', ThrowAwayCode: 'x', resetToken: 'y' }

function usersWith(data) {
  const fetchRaw = vi.fn().mockResolvedValue({ status: 200, _data: { Result: 'OK', Data: data } })
  return { fetchRaw, users: createUsersApi(createApiClient({ baseURL: 'http://api.test/api/', fetchRaw })) }
}

describe('users API', () => {
  it('logs in with the backend field names and never keeps secrets of the user record', async () => {
    const { fetchRaw, users } = usersWith({ Auth: 'jwt', User: user, Operations: {} })

    const result = await users.login({ email: 'a@b.c', password: 'pw' })

    expect(fetchRaw).toHaveBeenCalledWith(
      'users/login',
      expect.objectContaining({ method: 'POST', body: { Email: 'a@b.c', Password: 'pw' } }),
    )
    expect(result).toEqual({ Auth: 'jwt', User: { Id: 'u1', Email: 'a@b.c' } })
  })

  it('loads the current user', async () => {
    const { users } = usersWith(user)
    await expect(users.current()).resolves.toEqual({ Id: 'u1', Email: 'a@b.c' })
  })
})

describe('password recovery', () => {
  it('asks for the reset link with the lowercased email', async () => {
    const { fetchRaw, users } = usersWith('OK')
    await users.recoverPassword('  Someone@Example.COM ')

    expect(fetchRaw).toHaveBeenCalledWith(
      'users/password/recover',
      expect.objectContaining({ method: 'POST', body: { Email: 'someone@example.com' } }),
    )
  })

  it('sends the new password to the token endpoint', async () => {
    const { fetchRaw, users } = usersWith('OK')
    await users.resetPassword({ token: 'abc/1', password: 'new-secret' })

    expect(fetchRaw).toHaveBeenCalledWith(
      'users/password/reset/abc%2F1',
      expect.objectContaining({ method: 'POST', body: { NewPassword: 'new-secret' } }),
    )
  })

  it('treats the "successful" invalid-token answer of the backend as an error', async () => {
    const { users } = usersWith('KO_INVALID_TOKEN')
    await expect(users.resetPassword({ token: 't', password: 'p' })).rejects.toMatchObject({
      code: 'KO_INVALID_TOKEN',
    })
  })
})

describe('auth helpers', () => {
  it('maps backend codes to messages, with a generic fallback', () => {
    expect(authErrorKey({ code: 'KO_PASSWORD_INVALID' })).toBe('auth.errors.invalid')
    expect(authErrorKey({ code: 'NETWORK_ERROR' })).toBe('auth.errors.network')
    expect(authErrorKey({ code: 'KO_INVALID_TOKEN' })).toBe('auth.errors.resetLinkInvalid')
    expect(authErrorKey(new Error('boom'))).toBe('auth.errors.generic')
  })

  it('accepts only in-app paths as redirect target', () => {
    expect(safeRedirect('/app/keys')).toBe('/app/keys')
    expect(safeRedirect('https://evil.example')).toBe('/app')
    expect(safeRedirect('//evil.example')).toBe('/app')
    expect(safeRedirect('/application')).toBe('/app')
    expect(safeRedirect(undefined)).toBe('/app')
  })
})
