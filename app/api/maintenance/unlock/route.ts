import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  MAINTENANCE_BYPASS_SECONDS,
  MAINTENANCE_COOKIE,
  MAINTENANCE_FLAG_COOKIE,
  bypassDigest,
  maintenanceDevPassword,
  maintenanceDevTag,
  safeEqual,
} from '@/lib/maintenance'

const secure = process.env.NODE_ENV === 'production'

/** Tag + password from the developer door. Right: sets the bypass cookies. Wrong: 401 after a short pause. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { tag?: unknown; password?: unknown } | null
  const tag = typeof body?.tag === 'string' ? body.tag : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  const expectedTag = maintenanceDevTag()
  const expectedPassword = maintenanceDevPassword()
  const digest = await bypassDigest()
  const ok = Boolean(expectedTag && expectedPassword && digest && safeEqual(tag, expectedTag) && safeEqual(password, expectedPassword))

  if (!ok) {
    // Slow down guessing; there is no account lockout behind this door.
    await new Promise((resolve) => setTimeout(resolve, 1200))
    return NextResponse.json({ message: 'Wrong password.' }, { status: 401 })
  }

  const store = await cookies()
  store.set({ name: MAINTENANCE_COOKIE, value: digest!, httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: MAINTENANCE_BYPASS_SECONDS })
  store.set({ name: MAINTENANCE_FLAG_COOKIE, value: '1', httpOnly: false, secure, sameSite: 'lax', path: '/', maxAge: MAINTENANCE_BYPASS_SECONDS })
  return NextResponse.json({ ok: true })
}

/** Leave developer mode: drop the cookies, so the maintenance screen shows again. */
export async function DELETE() {
  const store = await cookies()
  store.delete(MAINTENANCE_COOKIE)
  store.delete(MAINTENANCE_FLAG_COOKIE)
  return NextResponse.json({ ok: true })
}
