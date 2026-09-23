import { forwardToApi } from '@/lib/server-api'

/** How many conversations have unread messages. 401 when nobody is signed in. */
export function GET() {
  return forwardToApi('/chats/unread', { auth: 'required', method: 'GET' })
}
