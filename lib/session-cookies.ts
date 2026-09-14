/**
 * Cookie names and writers for the session, kept free of `next/headers` so
 * they can be used from the proxy as well as from route handlers.
 *
 * Tokens live in httpOnly cookies rather than localStorage: server components
 * need to read them to render personalised feeds, and script on the page must
 * not be able to.
 */
export const ACCESS_COOKIE = 'beem_at'
export const REFRESH_COOKIE = 'beem_rt'

const REFRESH_MAX_AGE_DAYS = 30

export type CookieWriter = {
  set(options: {
    name: string
    value: string
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'lax' | 'strict' | 'none'
    path?: string
    maxAge?: number
  }): unknown
  delete(name: string): unknown
}

export function writeSession(
  store: CookieWriter,
  tokens: { accessToken: string; refreshToken: string; expiresIn: number },
): void {
  const secure = process.env.NODE_ENV === 'production'

  store.set({
    name: ACCESS_COOKIE,
    value: tokens.accessToken,
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: tokens.expiresIn,
  })

  store.set({
    name: REFRESH_COOKIE,
    value: tokens.refreshToken,
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE_DAYS * 24 * 60 * 60,
  })
}

export function clearSession(store: CookieWriter): void {
  store.delete(ACCESS_COOKIE)
  store.delete(REFRESH_COOKIE)
}
