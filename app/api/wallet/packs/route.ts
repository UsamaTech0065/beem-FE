import { forwardToApi } from '@/lib/server-api'

/** The coin packs, for the buy-coins panel. */
export function GET() {
  return forwardToApi('/wallet/packs', { auth: 'required', method: 'GET' })
}
