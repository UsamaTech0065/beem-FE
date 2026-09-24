import { forwardToApi } from '@/lib/server-api'

type Context = { params: Promise<{ id: string }> }

/** A room token for this call. The callee taking one answers it. */
export async function POST(_request: Request, { params }: Context) {
  const { id } = await params
  return forwardToApi(`/calls/${encodeURIComponent(id)}/token`, { auth: 'required' })
}
