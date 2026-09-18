import { forwardToApi } from '@/lib/server-api'

/** Connection details for the room. Anonymous visitors may watch, so auth is optional. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = (await request.json().catch(() => null)) as { studio?: boolean } | null
  return forwardToApi(`/streams/${encodeURIComponent(id)}/token`, {
    auth: 'optional',
    body: { studio: body?.studio === true },
  })
}
