import { ActionRail } from '@/components/beem/action-rail'
import { StreamGrid } from '@/components/beem/following-section'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { getCurrentUser, getLiveStreams } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const accessToken = await getAccessToken()

  // For You mirrors Tango's home: a single "Recommended for you" grid of live
  // streams, nothing above it.
  const [user, live] = await Promise.all([
    getCurrentUser(accessToken),
    getLiveStreams({ limit: 48 }),
  ])

  return (
    <div className="beem-app">
      <TopNav user={user} />
      <main className="tg-main tg-main-feed tg-home-feed">
        <section className="content-section" aria-labelledby="recommended-heading">
          <div className="section-heading">
            <h1 id="recommended-heading">Recommended for you</h1>
          </div>
          <StreamGrid streams={live.items} />
        </section>
      </main>
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
