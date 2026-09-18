import { forwardToApi } from '@/lib/server-api'

export async function GET() {
  return forwardToApi('/chats/suggested', { auth: 'required', method: 'GET' })
}
