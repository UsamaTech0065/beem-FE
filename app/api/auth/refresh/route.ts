import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { refreshSession } from '@/lib/refresh'
import { REFRESH_COOKIE, clearSession, writeSession } from '@/lib/session'
import { errorResponse } from '../route-helpers'

/**
 * Explicit refresh for client code. Page loads do not need it, because
 * `proxy.ts` refreshes on the way in, but a long-lived client-side fetch loop
 * can call this when it gets a 401.
 */
export async function POST() {
  const store = await cookies()
  const refreshToken = store.get(REFRESH_COOKIE)?.value

  if (!refreshToken) {
    return errorResponse(401, 'No session to refresh.')
  }

  const outcome = await refreshSession(refreshToken)

  if (outcome.ok) {
    writeSession(store, outcome.tokens)
    return new NextResponse(null, { status: 204 })
  }

  if (outcome.kind === 'rejected') {
    // The API rotates on every use and revokes the family on reuse, so a
    // rejection here means the session is genuinely finished.
    clearSession(store)
    return errorResponse(outcome.status, outcome.message)
  }

  return errorResponse(503, outcome.message)
}
