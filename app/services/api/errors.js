/**
 * Error thrown by the API layer. `code` is the backend `ResultText` (e.g. "KO_PASSWORD_INVALID")
 * or one of the client-side codes below.
 */
export class ApiError extends Error {
  /**
   * @param {string} code
   * @param {{ status?: number, cause?: unknown }} [options]
   */
  constructor(code, { status = 0, cause } = {}) {
    super(code, { cause })
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

/** The request never got a response (offline, DNS, CORS, backend down). */
export const NETWORK_ERROR = 'NETWORK_ERROR'
/** The response is not the expected envelope or does not match its schema. */
export const INVALID_RESPONSE = 'INVALID_RESPONSE'

/** Backend codes meaning the session is no longer valid. */
export const SESSION_CODES = Object.freeze(['KO_INVALID_OR_MISSING_TOKEN', 'KO_JWT_TOKEN_EXPIRED'])
