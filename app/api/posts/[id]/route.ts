import { forwardToApi } from '@/lib/server-api'

type Context = { params: Promise<{ id: string }> }

/** Delete one of the caller's own posts. */
export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params
  return forwardToApi(`/posts/${encodeURIComponent(id)}`, { auth: 'required', method: 'DELETE' })
}
