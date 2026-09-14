import { cookies } from 'next/headers'
import { ACCESS_COOKIE, REFRESH_COOKIE } from './session-cookies'

export { ACCESS_COOKIE, REFRESH_COOKIE, clearSession, writeSession } from './session-cookies'

/**
 * Reads the access token for the current request. When the token had expired,
 * `proxy.ts` has already refreshed it before this code runs, and the value read
 * here is the new one: Next merges cookies set by the proxy into the request.
 */
export async function getAccessToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACCESS_COOKIE)?.value ?? null
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(REFRESH_COOKIE)?.value ?? null
}
