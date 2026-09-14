import { NextResponse, type NextRequest } from 'next/server'
import { accessTokenExpiresWithin, refreshSession } from '@/lib/refresh'
import { ACCESS_COOKIE, REFRESH_COOKIE, clearSession, writeSession } from '@/lib/session-cookies'

/**
 * Refreshes an access token that has expired, or is about to, so that the page
 * renders signed in. Access tokens last 15 minutes and refresh tokens 30 days;
 * without this, a signed-in visitor looked signed out after a quarter of an hour.
 *
 * Server components can read cookies but cannot write them, so this has to
 * happen before the render. Cookies set here are visible to `cookies()` in the
 * same request, so the page sees the new access token straight away.
 */
const LEEWAY_SECONDS = 60

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  if (!refreshToken) return NextResponse.next()

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  if (accessToken && !accessTokenExpiresWithin(accessToken, LEEWAY_SECONDS)) {
    return NextResponse.next()
  }

  const outcome = await refreshSession(refreshToken)
  const response = NextResponse.next()

  if (outcome.ok) {
    writeSession(response.cookies, outcome.tokens)
  } else if (outcome.kind === 'rejected') {
    // Rotated already, expired, or revoked: the session is over.
    clearSession(response.cookies)
  }
  // 'unavailable' leaves the cookies alone. This render is anonymous, and the
  // next request tries again.

  return response
}

export const config = {
  // Pages and their RSC requests only. Auth route handlers manage the cookies
  // themselves, and static assets have no use for a session.
  matcher: ['/((?!api/|_next/static|_next/image|.*\\.[\\w]+$).*)'],
}
