import { forwardToApi } from '@/lib/server-api'

/** A link to the creator's Stripe dashboard. */
export function GET() {
  return forwardToApi('/payouts/stripe/dashboard', { auth: 'required', method: 'GET' })
}
