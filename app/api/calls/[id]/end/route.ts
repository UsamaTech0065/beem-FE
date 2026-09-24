import { forwardToApi } from '@/lib/server-api'

type Context = { params: Promise<{ id: string }> }

/** Hang up. Also hit by sendBeacon when the call page is closed. */
export async function POST(_request: Request, { params }: Context) {
  const { id } = await params
  return forwardToApi(`/calls/${encodeURIComponent(id)}/end`, { auth: 'required' })
}
