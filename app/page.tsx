import { ActionRail } from '@/components/beem/action-rail'
import { FollowingSection, StreamGrid } from '@/components/beem/following-section'
import { HomeHighlights } from '@/components/beem/home-highlights'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { getCurrentUser, getLatestPosts, getLiveFollowed, getLiveStreams, getNewMembers } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const accessToken = await getAccessToken()

  // One round of parallel requests rather than a waterfall: the panels do not
  // depend on each other.
  const [user, followed, live, members, posts] = await Promise.all([
    getCurrentUser(accessToken),
    getLiveFollowed(accessToken),
    getLiveStreams({ limit: 48 }),
    getNewMembers(),
    getLatestPosts(),
  ])

  return (
    <div className="beem-app">
      <TopNav user={user} />
      <main className="tg-main tg-main-feed">
        {/* Your own face in "New on beem" tells you nothing. */}
        <HomeHighlights members={members.filter((member) => member.id !== user?.id)} posts={posts} />
        <FollowingSection entries={followed} />
        <StreamGrid streams={live.items} />
      </main>
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
