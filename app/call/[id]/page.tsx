import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { CallRoom } from '@/components/beem/call-room'
import { getCall, getChat, getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '1:1 call · beem' }

type Props = { params: Promise<{ id: string }> }

/**
 * A private call. The API only answers for the two people on it, so anyone
 * else, signed in or not, sees a 404 rather than a locked door.
 */
export default async function CallPage({ params }: Props) {
  const { id } = await params
  const accessToken = await getAccessToken()
  const user = await getCurrentUser(accessToken)
  if (!user) redirect('/chats')

  const call = await getCall(id, accessToken)
  if (!call) notFound()

  // The other person is the conversation's peer.
  const chat = await getChat(call.conversationId, accessToken)
  if (!chat) notFound()

  return <CallRoom call={call} peer={chat.peer} user={user} />
}
