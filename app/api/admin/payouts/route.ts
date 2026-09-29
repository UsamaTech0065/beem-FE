import { forwardToApi } from '@/lib/server-api'

/** Admin: payout requests waiting to be paid, with full details, and recent settlements. */
export function GET() {
  return forwardToApi('/payouts/queue', { auth: 'required', method: 'GET' })
}
