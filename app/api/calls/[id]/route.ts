import { forwardToApi } from '@/lib/server-api'

type Context = { params: Promise<{ id: string }> }

/** The call's current state, for one of its two parties. */
export async function GET(_request: Request, { params }: Context) {
  const { id } = await params
  return forwardToApi(`/calls/${encodeURIComponent(id)}`, { auth: 'required', method: 'GET' })
}
