import { ActionRail } from '@/components/beem/action-rail'
import { FollowingSection, StreamGrid } from '@/components/beem/following-section'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { getCurrentUser, getLiveFollowed, getLiveStreams } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const accessToken = await getAccessToken()

  // For You mirrors Tango's home: a "You follow LIVE" rail when someone you
  // follow is live (it renders nothing otherwise), then "Recommended for you".
  const [user, followed, live] = await Promise.all([
    getCurrentUser(accessToken),
    getLiveFollowed(accessToken),
    getLiveStreams({ limit: 48 }),
  ])

  return (
    <div className="beem-app">
      <TopNav user={user} />
      <main className="tg-main tg-main-feed tg-home-feed">
        <FollowingSection entries={followed} />
        <StreamGrid streams={live.items} />
      </main>
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
