import { NextResponse } from 'next/server'
import { forwardToApi } from '@/lib/server-api'

type Body = { texts?: unknown; target?: unknown }

/** Translate up to 20 chat lines. Signed-in only, like the API behind it. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null
  const texts = Array.isArray(body?.texts) ? body.texts.filter((text): text is string => typeof text === 'string') : []
  if (texts.length === 0 || typeof body?.target !== 'string') {
    return NextResponse.json({ message: 'Nothing to translate.' }, { status: 400 })
  }
  return forwardToApi('/translate', { auth: 'required', body: { texts: texts.slice(0, 20), target: body.target } })
}
