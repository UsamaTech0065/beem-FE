import { NextResponse } from 'next/server'
import { forwardToApi } from '@/lib/server-api'

type Body = { text?: unknown; mediaUrl?: unknown; fansOnly?: unknown }

/** Publish a post on the caller's profile. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body) return NextResponse.json({ message: 'Nothing to post.' }, { status: 400 })

  return forwardToApi('/posts', {
    auth: 'required',
    body: {
      ...(typeof body.text === 'string' ? { text: body.text.trim() } : {}),
      ...(typeof body.mediaUrl === 'string' ? { mediaUrl: body.mediaUrl } : {}),
      fansOnly: body.fansOnly === true,
    },
  })
}
