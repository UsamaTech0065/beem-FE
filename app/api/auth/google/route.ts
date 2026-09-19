import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { writeSession } from '@/lib/session'
import { callApi, errorResponse } from '../route-helpers'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { accessToken?: string } | null

  if (!body?.accessToken?.trim()) {
    return errorResponse(400, 'Google sign-in failed. Try again.')
  }

  const result = await callApi('/auth/google', { accessToken: body.accessToken.trim() })

  if (!result.ok) {
    return errorResponse(result.status, result.message)
  }

  const { accessToken, refreshToken, expiresIn, user } = result.data
  writeSession(await cookies(), { accessToken, refreshToken, expiresIn })

  // The tokens stay in the cookies; only the profile crosses back to the page.
  return NextResponse.json({ user })
}
