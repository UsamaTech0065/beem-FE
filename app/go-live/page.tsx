import { AccountShell } from '@/components/beem/account-shell'
import { BroadcastStudio } from '@/components/beem/broadcast-studio'
import { LiveNowCard } from '@/components/beem/live-now-card'
import { getCategories, getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** Nearby, New and Popular are feeds over every stream, not genres a stream belongs to. */
const FEED_SLUGS = new Set(['nearby', 'new', 'popular'])

/**
 * Signed in and not live: the full-screen studio. Already live: the running
 * stream with a way back. Signed out: the usual sign-in wall.
 */
export default async function GoLivePage() {
  const [user, categories] = await Promise.all([getCurrentUser(await getAccessToken()), getCategories()])

  if (user && !user.liveStream) {
    return <BroadcastStudio user={user} categories={categories.filter((category) => !FEED_SLUGS.has(category.slug))} />
  }

  return (
    <AccountShell user={user} eyebrow="Creator Tools" title="Go live" subtitle="Check your camera, name your stream, and start.">
      {user?.liveStream && <LiveNowCard stream={user.liveStream} />}
    </AccountShell>
  )
}
