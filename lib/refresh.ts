import { API_URL } from './api'

export type RefreshedTokens = { accessToken: string; refreshToken: string; expiresIn: number }

export type RefreshOutcome =
  | { ok: true; tokens: RefreshedTokens }
  /** The API rejected the token. The session is finished and the cookies should go. */
  | { ok: false; kind: 'rejected'; status: number; message: string }
  /** The API could not be reached or failed. Keep the cookies and try again next request. */
  | { ok: false; kind: 'unavailable'; message: string }

/**
 * How long a completed rotation is remembered. The API rotates the refresh
 * token on every use and treats a second use as theft, revoking every session
 * for the user. A browser, though, can fire several requests carrying the same
 * old cookie before the first response's Set-Cookie lands: a page load plus
 * the prefetches for the links on it. Those must all be answered with the one
 * rotation, not each attempt their own.
 */
const REUSE_WINDOW_MS = 30_000

const inflight = new Map<string, Promise<RefreshOutcome>>()
const recent = new Map<string, { outcome: RefreshOutcome; until: number }>()

/**
 * Exchanges a refresh token for a new pair, exactly once per token.
 *
 * The de-duplication is per process. Behind a load balancer with several
 * instances of the web app, requests carrying the same old token can reach
 * different processes; sticky sessions, or a shared store for this map, are
 * needed there.
 */
export function refreshSession(refreshToken: string): Promise<RefreshOutcome> {
  const remembered = recent.get(refreshToken)
  if (remembered && remembered.until > Date.now()) {
    return Promise.resolve(remembered.outcome)
  }

  const pending = inflight.get(refreshToken)
  if (pending) return pending

  const promise = callRefresh(refreshToken)
    .then((outcome) => {
      // A failure to reach the API is not remembered: the next request should try again.
      if (outcome.ok || outcome.kind === 'rejected') {
        recent.set(refreshToken, { outcome, until: Date.now() + REUSE_WINDOW_MS })
      }
      return outcome
    })
    .finally(() => {
      inflight.delete(refreshToken)
      sweep()
    })

  inflight.set(refreshToken, promise)
  return promise
}

async function callRefresh(refreshToken: string): Promise<RefreshOutcome> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    })
  } catch {
    return { ok: false, kind: 'unavailable', message: 'Cannot reach the server. Is the API running?' }
  }

  if (response.ok) {
    return { ok: true, tokens: (await response.json()) as RefreshedTokens }
  }

  const message = await readMessage(response)
  if (response.status >= 500) {
    return { ok: false, kind: 'unavailable', message }
  }
  return { ok: false, kind: 'rejected', status: response.status, message }
}

async function readMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] }
    const raw = Array.isArray(body.message) ? body.message.join(', ') : body.message
    return raw ?? response.statusText
  } catch {
    return response.statusText
  }
}

function sweep(): void {
  const now = Date.now()
  for (const [token, entry] of recent) {
    if (entry.until <= now) recent.delete(token)
  }
}

/**
 * True when the access token has expired or will within `leewaySeconds`. The
 * payload is decoded, not verified. The API verifies; this only decides whether
 * it is worth asking for a new one. An unreadable token counts as expired so
 * that it gets replaced.
 */
export function accessTokenExpiresWithin(token: string, leewaySeconds: number): boolean {
  const exp = readExpiry(token)
  if (exp === null) return true
  return exp - Date.now() / 1000 <= leewaySeconds
}

function readExpiry(token: string): number | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded)) as { exp?: unknown }
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}
