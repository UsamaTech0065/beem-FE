import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StreamRoom } from '@/components/beem/stream-room'
import { TopNav } from '@/components/beem/top-nav'
import { getCurrentUser, getStream } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stream = await getStream((await params).id)
  return { title: stream ? `${stream.host.displayName} is live on beem` : 'beem' }
}

/**
 * One page for watching and for broadcasting. Whether this visitor is the host
 * is decided by the API when it issues the room token, never by the URL.
 */
export default async function StreamPage({ params }: Props) {
  const { id } = await params
  const [stream, user] = await Promise.all([getStream(id), getCurrentUser(await getAccessToken())])
  if (!stream) notFound()

  return (
    <div className="beem-app">
      <TopNav user={user} />
      <StreamRoom stream={stream} />
    </div>
  )
}
