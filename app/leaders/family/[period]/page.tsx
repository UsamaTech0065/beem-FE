import { notFound } from 'next/navigation'
import { ActionRail } from '@/components/beem/action-rail'
import { LeaderControls, isPeriod } from '@/components/beem/leader-controls'
import { LeaderRow } from '@/components/beem/leader-row'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { families } from '@/components/beem/leader-data'
import { getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * Family rankings, ranked on views rather than diamonds.
 *
 * Rendering fixtures: the API has no family concept at all, so nothing here is
 * real data. See components/beem/leader-data.ts.
 */
export default async function FamilyLeadersPage({
  params,
}: {
  params: Promise<{ period: string }>
}) {
  const { period } = await params
  if (!isPeriod(period)) notFound()

  const user = await getCurrentUser(await getAccessToken())
  const ranked = [...families].sort((a, b) => b.views - a.views)

  return (
    <div className="beem-app">
      <TopNav user={user} />
      <main className="tg-main leader-main">
        <LeaderControls board="family" period={period} />

        <ol className="leader-list">
          {ranked.map((family, index) => (
            <LeaderRow
              key={family.id}
              rank={index + 1}
              name={family.name}
              avatarUrl={family.crest}
              score={family.views}
              metric="views"
            />
          ))}
        </ol>
      </main>
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
