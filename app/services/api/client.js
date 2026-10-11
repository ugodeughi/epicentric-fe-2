import { ApiError, INVALID_RESPONSE, NETWORK_ERROR } from './errors'

/**
 * Builds the single HTTP client used by every API module.
 *
 * The backend answers with an envelope `{ Success, Result: "OK" | "KO", ResultText, Data }`
 * and reports most application errors with HTTP 200: the envelope, not the status, decides.
 *
 * @param {object} options
 * @param {string} options.baseURL
 * @param {() => string | null | undefined} [options.getToken] current JWT, sent as Bearer
 * @param {(error: ApiError) => void} [options.onUnauthorized] called on HTTP 401
 * @param {typeof globalThis.$fetch.raw} [options.fetchRaw] injectable for tests
 */
export function createApiClient({ baseURL, getToken, onUnauthorized, fetchRaw = globalThis.$fetch?.raw }) {
  /**
   * @template T
   * @param {string} path relative to baseURL, without leading slash
   * @param {{ method?: string, body?: unknown, query?: Record<string, unknown>, schema?: { parse: (data: unknown) => T }, signal?: AbortSignal, envelope?: boolean }} [options]
   *   `envelope: false` for the few routes that answer with bare JSON (file upload, bookmarks):
   *   the body itself is returned, and an error status becomes an ApiError.
   * @returns {Promise<T>} the envelope `Data`, validated when a schema is given
   */
  return async function api(
    path,
    { method = 'GET', body, query, schema, signal, envelope: wrapped = true } = {},
  ) {
    const token = getToken?.()
    let response

    try {
      response = await fetchRaw(path, {
        baseURL,
        method,
        body,
        query,
        signal,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        // Error statuses still carry the envelope with the reason: read it instead of throwing.
        ignoreResponseError: true,
      })
    } catch (cause) {
      throw new ApiError(NETWORK_ERROR, { cause })
    }

    const { status, _data: envelope } = response

    if (status === 401) {
      const error = new ApiError(codeOf(envelope) ?? 'KO_INVALID_OR_MISSING_TOKEN', { status })
      onUnauthorized?.(error)
      throw error
    }

    if (!wrapped) {
      // These routes still use the envelope to refuse a request, and plain text or nothing
      // at all with an error status.
      const refused = envelope && typeof envelope === 'object' && envelope.Result === 'KO'
      if (refused || status >= 400) {
        const code = refused ? codeOf(envelope) : typeof envelope === 'string' && envelope ? envelope : null
        throw new ApiError(code ?? `HTTP_${status}`, { status })
      }
    } else if (!envelope || typeof envelope !== 'object') {
      throw new ApiError(INVALID_RESPONSE, { status })
    } else if (envelope.Result !== 'OK') {
      throw new ApiError(codeOf(envelope) ?? INVALID_RESPONSE, { status })
    }

    const data = wrapped ? envelope.Data : envelope
    if (!schema) return data

    try {
      return schema.parse(data)
    } catch (cause) {
      throw new ApiError(INVALID_RESPONSE, { status, cause })
    }
  }
}

/** Failure code of an envelope: `ResultText` when it is a string, otherwise `Result`. */
function codeOf(envelope) {
  if (!envelope || typeof envelope !== 'object') return null
  if (typeof envelope.ResultText === 'string' && envelope.ResultText) return envelope.ResultText
  return typeof envelope.Result === 'string' ? envelope.Result : null
}
