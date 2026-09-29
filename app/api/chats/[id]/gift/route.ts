import { forwardToApi } from '@/lib/server-api'

type Context = { params: Promise<{ id: string }> }

/** Send a gift to the other person in this conversation; relays the new balance or the error. */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params
  const body = (await request.json().catch(() => null)) as { giftId?: string } | null
  return forwardToApi(`/chats/${encodeURIComponent(id)}/gift`, { auth: 'required', body: { giftId: body?.giftId } })
}
