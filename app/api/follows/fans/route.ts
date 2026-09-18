import { forwardToApi } from '@/lib/server-api'

/** Everyone who follows the caller, newest first. */
export function GET() {
  return forwardToApi('/follows/fans', { auth: 'required', method: 'GET' })
}
