import { forwardToApi } from '@/lib/server-api'

/** Connection details for the room. Anonymous visitors may watch, so auth is optional. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return forwardToApi(`/streams/${encodeURIComponent(id)}/token`, { auth: 'optional' })
}
