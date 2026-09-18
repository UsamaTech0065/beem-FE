import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { API_URL } from './api'
import { accessTokenExpiresWithin, refreshSession } from './refresh'
import { ACCESS_COOKIE, REFRESH_COOKIE, clearSession, writeSession } from './session-cookies'

const LEEWAY_SECONDS = 60

/**
 * The caller's access token, for use inside a route handler.
 *
 * `proxy.ts` refreshes tokens for page requests only; it skips /api. A handler
 * reached 20 minutes into a visit would otherwise see an expired token, so it
 * refreshes here. Route handlers, unlike server components, may write cookies.
 */
export async function resolveAccessToken(): Promise<string | null> {
  const store = await cookies()
  const accessToken = store.get(ACCESS_COOKIE)?.value ?? null
  if (accessToken && !accessTokenExpiresWithin(accessToken, LEEWAY_SECONDS)) return accessToken

  const refreshToken = store.get(REFRESH_COOKIE)?.value
  if (!refreshToken) return null

  const outcome = await refreshSession(refreshToken)
  if (outcome.ok) {
    writeSession(store, outcome.tokens)
    return outcome.tokens.accessToken
  }
  if (outcome.kind === 'rejected') clearSession(store)
  return null
}

type ForwardOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  /** 'required' answers 401 without a session; 'optional' forwards anonymously. */
  auth: 'required' | 'optional'
}

/**
 * Forwards a browser request to the API with the session attached, and relays
 * the API's status and JSON. The browser cannot call the API itself for these:
 * the tokens live in httpOnly cookies it cannot read.
 */
export async function forwardToApi(path: string, options: ForwardOptions): Promise<NextResponse> {
  const accessToken = await resolveAccessToken()
  if (!accessToken && options.auth === 'required') {
    return NextResponse.json({ message: 'Sign in to continue.' }, { status: 401 })
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'POST',
      headers: {
        ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ message: 'Cannot reach the server. Try again in a moment.' }, { status: 503 })
  }

  if (response.status === 204) return new NextResponse(null, { status: 204 })

  const payload = (await response.json().catch(() => null)) as { message?: string | string[] } | null
  if (!response.ok) {
    // Validation errors arrive as a list; the UI shows one line.
    const raw = payload?.message
    const message = (Array.isArray(raw) ? raw.join(', ') : raw) ?? response.statusText
    return NextResponse.json({ message }, { status: response.status })
  }

  return NextResponse.json(payload)
}
