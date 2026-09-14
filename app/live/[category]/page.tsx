import { notFound } from 'next/navigation'
import { ActionRail } from '@/components/beem/action-rail'
import { FEED_SLUGS } from '@/components/beem/data'
import { StreamGrid } from '@/components/beem/following-section'
import { LiveTabs } from '@/components/beem/live-tabs'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { getCategories, getCurrentUser, getLiveStreams } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * /live/nearby, /live/new, /live/popular and the genre tabs. The first three
 * are feeds over every live stream; the genres filter by category.
 */
export default async function LivePage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const isFeed = FEED_SLUGS.has(category)
  const accessToken = await getAccessToken()

  const [user, categories, live] = await Promise.all([
    getCurrentUser(accessToken),
    getCategories(),
    getLiveStreams({ category: isFeed ? undefined : category, limit: 48 }),
  ])

  // Only 404 on a slug the API does not know. If the categories request failed
  // the list is empty, and a 404 then would hide an outage behind a wrong page.
  if (categories.length > 0 && !categories.some((entry) => entry.slug === category)) {
    notFound()
  }

  const streams =
    category === 'popular' ? [...live.items].sort((a, b) => b.viewerCount - a.viewerCount) : live.items

  const label = categories.find((entry) => entry.slug === category)?.name ?? category

  return (
    <div className="beem-app">
      <TopNav user={user} />
      <main className="tg-main">
        <LiveTabs categories={categories} active={category} />
        <StreamGrid streams={streams} emptyMessage={`Nobody is live in ${label} right now.`} />
      </main>
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
