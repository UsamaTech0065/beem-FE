import { forwardToApi } from '@/lib/server-api'

type Context = { params: Promise<{ id: string }> }

/** Admin: mark a payout paid, or return the coins. Body: { status: 'PAID' | 'REJECTED', note? }. */
export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params
  const body = (await request.json().catch(() => null)) as unknown
  return forwardToApi(`/payouts/${encodeURIComponent(id)}`, { auth: 'required', method: 'PATCH', body })
}
