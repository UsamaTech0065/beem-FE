import { ActionRail } from '@/components/beem/action-rail'
import { StreamGrid } from '@/components/beem/following-section'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { getCurrentUser, getFollowingStreams, getLiveStreams } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const accessToken = await getAccessToken()

  // Like Tango's For You: live streams from people you follow show first as
  // full-size cards under "You follow LIVE", then everyone else below.
  const [user, following, live] = await Promise.all([
    getCurrentUser(accessToken),
    getFollowingStreams(accessToken),
    getLiveStreams({ limit: 48 }),
  ])

  // Don't repeat a followed host in the grid below the "You follow" row.
  const followedHostIds = new Set(following.items.map((stream) => stream.host.id))
  const recommended = live.items.filter((stream) => !followedHostIds.has(stream.host.id))

  return (
    <div className="beem-app">
      <TopNav user={user} />
      <main className="tg-main tg-main-feed tg-home-feed">
        {following.items.length > 0 && (
          <section className="content-section" aria-labelledby="you-follow-heading">
            <div className="section-heading">
              <div className="flex items-center gap-3">
                <h1 id="you-follow-heading">You follow</h1>
                <span className="live-pill">LIVE</span>
              </div>
            </div>
            <StreamGrid streams={following.items} />
          </section>
        )}
        <StreamGrid streams={recommended} />
      </main>
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
