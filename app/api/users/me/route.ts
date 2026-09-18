import { NextResponse } from 'next/server'
import { forwardToApi } from '@/lib/server-api'

type Body = { displayName?: string; handle?: string; bio?: string; avatarUrl?: string }

/** Update the caller's own profile. Only the fields that were sent are changed. */
export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body) return NextResponse.json({ message: 'Nothing to update.' }, { status: 400 })

  const update: Body = {}
  if (typeof body.displayName === 'string') update.displayName = body.displayName.trim()
  if (typeof body.handle === 'string') update.handle = body.handle.trim().toLowerCase()
  if (typeof body.bio === 'string') update.bio = body.bio.trim()
  if (typeof body.avatarUrl === 'string') update.avatarUrl = body.avatarUrl.trim()

  return forwardToApi('/users/me', { auth: 'required', method: 'PATCH', body: update })
}
