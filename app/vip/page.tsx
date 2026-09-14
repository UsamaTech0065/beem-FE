import { Crown } from 'lucide-react'
import { AccountShell } from '@/components/beem/account-shell'
import { compactNumber } from '@/components/beem/account-nav'
import { getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

const tiers = [
  { name: 'Bronze', coins: 0, perks: ['Member badge', 'Standard gifts'] },
  { name: 'Silver', coins: 5_000, perks: ['Silver badge', 'Priority in chat'] },
  { name: 'Gold', coins: 25_000, perks: ['Gold badge', 'Exclusive gifts', 'Entrance effect'] },
  { name: 'Platinum', coins: 100_000, perks: ['Platinum badge', 'Private chats with creators', 'Monthly bonus coins'] },
  { name: 'Diamond', coins: 500_000, perks: ['Diamond badge', 'Personal manager', 'Invitations to creator events'] },
]

export default async function VipPage() {
  const user = await getCurrentUser(await getAccessToken())

  // Coins spent is not tracked yet, so everyone starts on the first tier.
  const spent = 0
  const current = [...tiers].reverse().find((tier) => spent >= tier.coins) ?? tiers[0]
  const next = tiers[tiers.indexOf(current) + 1]
  const progress = next ? Math.min(100, Math.round(((spent - current.coins) / (next.coins - current.coins)) * 100)) : 100

  return (
    <AccountShell
      user={user}
      eyebrow="Special Programs"
      title="VIP Loyalty"
      subtitle="Spend coins on the creators you love and unlock a higher status."
    >
      <section className="acct-hero acct-hero--vip">
        <Crown size={40} strokeWidth={1.6} />
        <div>
          <h2>You are {current.name}</h2>
          <p>
            {next
              ? `${compactNumber(next.coins - spent)} more coins to reach ${next.name}.`
              : 'You have reached the highest status.'}
          </p>
          <div className="acct-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <div className="acct-cards acct-cards--tiers">
        {tiers.map((tier) => (
          <div className={`acct-card${tier.name === current.name ? ' is-current' : ''}`} key={tier.name}>
            <h3>{tier.name}</h3>
            <p className="acct-card-meta">{tier.coins === 0 ? 'Everyone starts here' : `${compactNumber(tier.coins)} coins`}</p>
            <ul>
              {tier.perks.map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </AccountShell>
  )
}
