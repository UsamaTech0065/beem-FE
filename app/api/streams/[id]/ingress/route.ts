import { forwardToApi } from '@/lib/server-api'

/** RTMP server and key for the host's encoder. The API refuses anyone but the host. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return forwardToApi(`/streams/${encodeURIComponent(id)}/ingress`, { auth: 'required' })
}
