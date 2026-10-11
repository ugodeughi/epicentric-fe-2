// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createApiClient } from '../../app/services/api/client'
import { ApiError, INVALID_RESPONSE, NETWORK_ERROR } from '../../app/services/api/errors'

const baseURL = 'http://api.test/api/'
const respond = (status, _data) => vi.fn().mockResolvedValue({ status, _data })

describe('createApiClient', () => {
  it('returns the envelope Data on success', async () => {
    const fetchRaw = respond(200, { Success: true, Result: 'OK', ResultText: 'OK', Data: { Id: '1' } })
    const api = createApiClient({ baseURL, fetchRaw })

    await expect(api('items')).resolves.toEqual({ Id: '1' })
    expect(fetchRaw).toHaveBeenCalledWith('items', expect.objectContaining({ baseURL, method: 'GET' }))
  })

  it('sends the token as Bearer only when there is one', async () => {
    const fetchRaw = respond(200, { Result: 'OK' })
    let token = null
    const api = createApiClient({ baseURL, fetchRaw, getToken: () => token })

    await api('a')
    expect(fetchRaw.mock.calls[0][1].headers).toBeUndefined()

    token = 'jwt'
    await api('a')
    expect(fetchRaw.mock.calls[1][1].headers).toEqual({ Authorization: 'Bearer jwt' })
  })

  it('turns a KO envelope with HTTP 200 into an ApiError carrying the backend code', async () => {
    const fetchRaw = respond(200, { Success: false, Result: 'KO', ResultText: 'KO_PASSWORD_INVALID' })
    const api = createApiClient({ baseURL, fetchRaw })

    const error = await api('users/login', { method: 'POST' }).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'KO_PASSWORD_INVALID', status: 200 })
  })

  it('calls onUnauthorized and throws on HTTP 401', async () => {
    const fetchRaw = respond(401, { Success: false, Result: 'KO', ResultText: 'KO_JWT_TOKEN_EXPIRED' })
    const onUnauthorized = vi.fn()
    const api = createApiClient({ baseURL, fetchRaw, onUnauthorized })

    await expect(api('users/current/details')).rejects.toMatchObject({
      code: 'KO_JWT_TOKEN_EXPIRED',
      status: 401,
    })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('reports a request without response as a network error', async () => {
    const api = createApiClient({
      baseURL,
      fetchRaw: vi.fn().mockRejectedValue(new TypeError('fetch failed')),
    })

    await expect(api('a')).rejects.toMatchObject({ code: NETWORK_ERROR })
  })

  it('rejects answers that are not an envelope', async () => {
    const api = createApiClient({ baseURL, fetchRaw: respond(502, '<html>Bad gateway</html>') })

    await expect(api('a')).rejects.toMatchObject({ code: INVALID_RESPONSE, status: 502 })
  })

  it('validates Data with the schema and strips unknown fields', async () => {
    const schema = z.object({ Id: z.string() })
    const ok = createApiClient({
      baseURL,
      fetchRaw: respond(200, { Result: 'OK', Data: { Id: '1', Password: 'hash' } }),
    })
    const bad = createApiClient({ baseURL, fetchRaw: respond(200, { Result: 'OK', Data: { Id: 1 } }) })

    await expect(ok('a', { schema })).resolves.toEqual({ Id: '1' })
    await expect(bad('a', { schema })).rejects.toMatchObject({ code: INVALID_RESPONSE })
  })
})

describe('routes that answer without the envelope', () => {
  it('returns the bare body, validated by the schema', async () => {
    const fetchRaw = respond(200, [{ mediaItem: { Id: 'i1', Secret: 'x' } }])
    const api = createApiClient({ baseURL, fetchRaw })
    const schema = z.array(z.object({ mediaItem: z.object({ Id: z.string() }) }))

    await expect(api('items/upload', { method: 'POST', schema, envelope: false })).resolves.toEqual([
      { mediaItem: { Id: 'i1' } },
    ])
  })

  it('still understands a refusal sent as an envelope', async () => {
    const api = createApiClient({
      baseURL,
      fetchRaw: respond(200, { Success: false, Result: 'KO', ResultText: 'KO_MISSING_File' }),
    })
    await expect(api('items/upload', { envelope: false })).rejects.toMatchObject({ code: 'KO_MISSING_File' })
  })

  it('turns an error status into an ApiError: the text when there is one, else the status', async () => {
    const withText = createApiClient({ baseURL, fetchRaw: respond(409, 'QUOTA_EXCEEDED') })
    await expect(withText('items/upload', { envelope: false })).rejects.toMatchObject({
      code: 'QUOTA_EXCEEDED',
      status: 409,
    })

    const empty = createApiClient({ baseURL, fetchRaw: respond(409, undefined) })
    await expect(empty('items/upload', { envelope: false })).rejects.toMatchObject({
      code: 'HTTP_409',
      status: 409,
    })
  })

  it('reports a body that does not match the schema', async () => {
    const api = createApiClient({ baseURL, fetchRaw: respond(200, { nope: true }) })
    const schema = z.array(z.object({ Id: z.string() }))
    await expect(api('items/upload', { schema, envelope: false })).rejects.toMatchObject({
      code: INVALID_RESPONSE,
    })
  })

  it('still drops the session on HTTP 401', async () => {
    const onUnauthorized = vi.fn()
    const api = createApiClient({
      baseURL,
      onUnauthorized,
      fetchRaw: respond(401, { Result: 'KO', ResultText: 'KO_JWT_TOKEN_EXPIRED' }),
    })
    await expect(api('items/upload', { envelope: false })).rejects.toMatchObject({
      code: 'KO_JWT_TOKEN_EXPIRED',
    })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })
})
