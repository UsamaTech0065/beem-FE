import { Diamond, Eye, Radio, UserPlus, Users, Video } from 'lucide-react'
import { AccountShell } from '@/components/beem/account-shell'
import { compactNumber } from '@/components/beem/account-nav'
import { getCreatorStats, getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function StatisticsPage() {
  const accessToken = await getAccessToken()
  const [user, stats] = await Promise.all([getCurrentUser(accessToken), getCreatorStats(accessToken)])

  const tiles = [
    { label: 'Followers', value: stats?.followerCount ?? 0, icon: Users },
    { label: 'Following', value: stats?.followingCount ?? 0, icon: UserPlus },
    { label: 'Diamonds earned', value: stats?.diamondsTotal ?? '0', icon: Diamond },
    { label: 'Streams hosted', value: stats?.streamCount ?? 0, icon: Video },
    { label: 'Live right now', value: stats?.liveStreams ?? 0, icon: Radio },
    { label: 'Viewers now', value: stats?.viewersNow ?? 0, icon: Eye },
  ]

  return (
    <AccountShell
      user={user}
      eyebrow="Creator Tools"
      title="Statistics"
      subtitle={user ? `Lifetime numbers for @${user.handle}.` : undefined}
    >
      <div className="acct-tiles">
        {tiles.map(({ label, value, icon: Icon }) => (
          <div className="acct-tile" key={label}>
            <span className="acct-tile-icon">
              <Icon size={20} strokeWidth={2} />
            </span>
            <strong>{compactNumber(value)}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <p className="acct-note">
        Daily and weekly breakdowns arrive once streams record their history. Today every figure is a lifetime total.
      </p>
    </AccountShell>
  )
}
