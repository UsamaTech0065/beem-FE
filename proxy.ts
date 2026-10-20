import { NextResponse, type NextRequest } from 'next/server'
import { MAINTENANCE_COOKIE, bypassDigest, maintenanceAllows, maintenanceEnabled, safeEqual } from '@/lib/maintenance'
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
  const { pathname } = request.nextUrl

  // Maintenance mode: everyone sees the maintenance screen, and the API routes
  // answer 503, unless this browser holds the developer cookie.
  if (maintenanceEnabled() && !maintenanceAllows(pathname)) {
    const proof = request.cookies.get(MAINTENANCE_COOKIE)?.value
    const expected = await bypassDigest()
    const developer = Boolean(proof && expected && safeEqual(proof, expected))
    if (!developer) {
      const headers = { 'retry-after': '600', 'cache-control': 'no-store' }
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'beem is down for maintenance. Please try again shortly.' }, { status: 503, headers })
      }
      return NextResponse.rewrite(new URL('/maintenance', request.url), { status: 503, headers })
    }
  }

  // Route handlers manage their own cookies; only pages need the refresh below.
  if (pathname.startsWith('/api/')) return NextResponse.next()

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
  // Pages, their RSC requests and the API routes (for maintenance mode).
  // Static assets have no use for a session and stay reachable regardless.
  matcher: ['/((?!_next/static|_next/image|.*\\.[\\w]+$).*)'],
}
