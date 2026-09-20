import { forwardToApi } from '@/lib/server-api'

/** Starts a coin purchase; relays the API's { status: 'paid' } or { status: 'redirect', url }. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { packId?: string } | null
  return forwardToApi('/wallet/checkout', {
    method: 'POST',
    auth: 'required',
    body: { packId: body?.packId },
  })
}
