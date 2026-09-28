import { forwardToApi } from '@/lib/server-api'

/** The signed-in creator's payout summary. */
export function GET() {
  return forwardToApi('/payouts/summary', { auth: 'required', method: 'GET' })
}

/** Request a withdrawal of everything available. */
export function POST() {
  return forwardToApi('/payouts', { auth: 'required' })
}
