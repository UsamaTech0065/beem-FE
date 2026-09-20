import { forwardToApi } from '@/lib/server-api'

/** Client secret for the embedded Stripe card form. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { packId?: string } | null
  return forwardToApi('/wallet/payment-intent', {
    method: 'POST',
    auth: 'required',
    body: { packId: body?.packId },
  })
}
