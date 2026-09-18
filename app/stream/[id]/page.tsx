import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StreamRoom } from '@/components/beem/stream-room'
import { getCurrentUser, getStream } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ source?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stream = await getStream((await params).id)
  return { title: stream ? `${stream.host.displayName} is live on beem` : 'beem' }
}

/**
 * One full-screen page for watching and for broadcasting. Whether this
 * visitor is the host is decided by the API when it issues the room token,
 * never by the URL. `?source=obs` only tells a host's browser to monitor the
 * encoder feed instead of publishing its own camera.
 */
export default async function StreamPage({ params, searchParams }: Props) {
  const [{ id }, { source }] = await Promise.all([params, searchParams])
  const accessToken = await getAccessToken()
  const [stream, user] = await Promise.all([getStream(id, accessToken), getCurrentUser(accessToken)])
  if (!stream) notFound()

  return <StreamRoom stream={stream} user={user} studio={source === 'obs'} />
}
