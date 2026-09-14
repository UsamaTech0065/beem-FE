import { notFound } from 'next/navigation'
import { ActionRail } from '@/components/beem/action-rail'
import { LeaderControls, isPeriod } from '@/components/beem/leader-controls'
import { LeaderRow } from '@/components/beem/leader-row'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { getCurrentUser, getLiveStreams } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** Creator rankings. Families live under /leaders/family/<period>. */
export default async function LeadersPage({ params }: { params: Promise<{ period: string }> }) {
  const { period } = await params
  if (!isPeriod(period)) notFound()

  const accessToken = await getAccessToken()
  const [user, live] = await Promise.all([getCurrentUser(accessToken), getLiveStreams({ limit: 48 })])

  // No leaderboard endpoint yet, so the ranking is derived from the lifetime
  // diamond totals the streams API already returns. Every period therefore
  // shows the same order — a real board needs windowed totals from the server.
  const ranked = [...live.items].sort((a, b) => Number(b.diamondsTotal) - Number(a.diamondsTotal))

  return (
    <div className="beem-app">
      <TopNav user={user} />
      <main className="tg-main leader-main">
        <LeaderControls board="creators" period={period} />

        {ranked.length > 0 ? (
          <ol className="leader-list">
            {ranked.map((stream, index) => (
              <LeaderRow
                key={stream.id}
                rank={index + 1}
                name={stream.host.displayName}
                avatarUrl={stream.host.avatarUrl}
                score={Number(stream.diamondsTotal)}
                metric="diamonds"
                href="/live/nearby"
              />
            ))}
          </ol>
        ) : (
          <p className="feed-empty">No rankings to show yet.</p>
        )}
      </main>
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
