import { forwardToApi } from '@/lib/server-api'

/** Back from Stripe: record whether onboarding is complete. */
export function POST() {
  return forwardToApi('/payouts/stripe/sync', { auth: 'required' })
}
