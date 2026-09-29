import { forwardToApi } from '@/lib/server-api'

/** The call ringing for the signed-in person right now, or null. Polled by the incoming-call alert. */
export async function GET() {
  return forwardToApi('/calls/incoming', { auth: 'required', method: 'GET' })
}
