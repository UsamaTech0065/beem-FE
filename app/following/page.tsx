import { Users } from 'lucide-react'
import { ActionRail } from '@/components/beem/action-rail'
import { StreamGrid } from '@/components/beem/following-section'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { getCurrentUser, getFollowingStreams, getLiveStreams } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function FollowingPage() {
  const accessToken = await getAccessToken()

  const [user, streams, discover] = await Promise.all([
    getCurrentUser(accessToken),
    getFollowingStreams(accessToken),
    getLiveStreams({ limit: 48 }),
  ])

  // Suggestions are everyone live who is not already in the feed above, so the
  // same face never appears twice on one screen.
  const alreadyShown = new Set(streams.items.map((stream) => stream.host.id))
  const suggestions = discover.items.filter((stream) => !alreadyShown.has(stream.host.id))

  return (
    <div className="beem-app">
      <TopNav user={user} />
      <main className="tg-main tg-main-feed">
        {streams.items.length > 0 ? (
          <StreamGrid streams={streams.items} />
        ) : (
          <div className="follow-empty">
            <Users size={56} strokeWidth={1.5} />
            <p>No one you&apos;re following is live</p>
          </div>
        )}

        {suggestions.length > 0 && (
          <section className="suggest-section" aria-labelledby="suggest-heading">
            <h2 id="suggest-heading">You may also like</h2>
            <StreamGrid streams={suggestions} />
          </section>
        )}
      </main>
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
