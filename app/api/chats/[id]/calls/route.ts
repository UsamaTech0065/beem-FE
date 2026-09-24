import { forwardToApi } from '@/lib/server-api'

type Context = { params: Promise<{ id: string }> }

/** Start a 1:1 call in this conversation (or rejoin the one already ringing). */
export async function POST(_request: Request, { params }: Context) {
  const { id } = await params
  return forwardToApi(`/chats/${encodeURIComponent(id)}/calls`, { auth: 'required' })
}
