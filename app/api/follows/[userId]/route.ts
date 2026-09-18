import { forwardToApi } from '@/lib/server-api'

type Context = { params: Promise<{ userId: string }> }

/** Follow. */
export async function POST(_request: Request, { params }: Context) {
  const { userId } = await params
  return forwardToApi(`/follows/${encodeURIComponent(userId)}`, { auth: 'required' })
}

/** Unfollow. */
export async function DELETE(_request: Request, { params }: Context) {
  const { userId } = await params
  return forwardToApi(`/follows/${encodeURIComponent(userId)}`, { auth: 'required', method: 'DELETE' })
}
