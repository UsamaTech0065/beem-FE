import { NextResponse } from 'next/server'
import { forwardToApi } from '@/lib/server-api'
import type { Gender } from '@/lib/api-types'

type Body = {
  displayName?: unknown
  handle?: unknown
  bio?: unknown
  avatarUrl?: unknown
  gender?: unknown
  birthDate?: unknown
  hideAge?: unknown
}

const GENDERS: readonly Gender[] = ['MALE', 'FEMALE', 'OTHER']

/** Update the caller's own profile. Only the fields that were sent are changed. */
export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body) return NextResponse.json({ message: 'Nothing to update.' }, { status: 400 })

  const update: Record<string, string | boolean | null> = {}
  if (typeof body.displayName === 'string') update.displayName = body.displayName.trim()
  if (typeof body.handle === 'string') update.handle = body.handle.trim().toLowerCase()
  if (typeof body.bio === 'string') update.bio = body.bio.trim()
  if (typeof body.avatarUrl === 'string') update.avatarUrl = body.avatarUrl.trim()
  // Null is a value here: "prefer not to show", or a cleared date.
  if (body.gender === null || GENDERS.includes(body.gender as Gender)) update.gender = body.gender as Gender | null
  if (body.birthDate === null || typeof body.birthDate === 'string') update.birthDate = body.birthDate
  if (typeof body.hideAge === 'boolean') update.hideAge = body.hideAge

  return forwardToApi('/users/me', { auth: 'required', method: 'PATCH', body: update })
}
