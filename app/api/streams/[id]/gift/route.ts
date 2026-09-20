import { forwardToApi } from '@/lib/server-api'

type Context = { params: Promise<{ id: string }> }

/** Sends a gift in a stream; relays the API's new balance or error. */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params
  const body = (await request.json().catch(() => null)) as { giftId?: string } | null
  return forwardToApi(`/streams/${encodeURIComponent(id)}/gift`, {
    method: 'POST',
    auth: 'required',
    body: { giftId: body?.giftId },
  })
}
