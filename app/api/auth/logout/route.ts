import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { REFRESH_COOKIE, clearSession } from '@/lib/session'
import { callApi } from '../route-helpers'

export async function POST() {
  const store = await cookies()
  const refreshToken = store.get(REFRESH_COOKIE)?.value

  // Revoke server-side first, but clear the cookies regardless — a failed
  // revoke must not leave the browser looking signed in.
  if (refreshToken) {
    await callApi('/auth/logout', { refreshToken })
  }

  clearSession(store)
  return new NextResponse(null, { status: 204 })
}
