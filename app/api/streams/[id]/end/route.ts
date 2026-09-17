import { forwardToApi } from '@/lib/server-api'

/** Ends the stream. The API rejects anyone but the host. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return forwardToApi(`/streams/${encodeURIComponent(id)}/end`, { auth: 'required' })
}
