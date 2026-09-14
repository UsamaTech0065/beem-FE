import { ActionRail } from '@/components/beem/action-rail'
import { PromoBanners } from '@/components/beem/following-section'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * Placeholder. The nav needs a destination, and a 404 behind a primary tab is
 * worse than an honest empty state — but the real layout is not built yet,
 * because there is no reference for this screen and no games API behind it.
 */
export default async function GamesPage() {
  const user = await getCurrentUser(await getAccessToken())

  return (
    <div className="beem-app">
      <TopNav user={user} />
      <main className="tg-main tg-main-feed">
        <PromoBanners />
        <p className="feed-empty">Games are not available yet.</p>
      </main>
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
