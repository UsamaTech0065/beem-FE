import { NextResponse } from 'next/server'
import { API_URL } from '@/lib/api'
import { resolveAccessToken } from '@/lib/server-api'

/** Matches the API's limit; checked here too so an oversized file is refused before it is sent on. */
const MAX_BYTES = 4 * 1024 * 1024

/** Upload one image. Answers { id, url }, where url is a /media/<id> path usable as an <img src>. */
export async function POST(request: Request) {
  const accessToken = await resolveAccessToken()
  if (!accessToken) return NextResponse.json({ message: 'Sign in to continue.' }, { status: 401 })

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: 'Choose an image to upload.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: 'That image is too large. The limit is 4 MB.' }, { status: 413 })
  }

  const upload = new FormData()
  upload.set('file', file, 'upload')

  let response: Response
  try {
    response = await fetch(`${API_URL}/media`, {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}` },
      body: upload,
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ message: 'Cannot reach the server. Try again in a moment.' }, { status: 503 })
  }

  const payload = (await response.json().catch(() => null)) as { message?: string | string[] } | null
  if (!response.ok) {
    const raw = payload?.message
    const message = (Array.isArray(raw) ? raw.join(', ') : raw) ?? response.statusText
    return NextResponse.json({ message }, { status: response.status })
  }
  return NextResponse.json(payload)
}
