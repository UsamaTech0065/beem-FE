import { Gem } from 'lucide-react'
import { AccountShell } from '@/components/beem/account-shell'
import { compactNumber } from '@/components/beem/account-nav'
import { getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

const items = [
  { name: 'Profile frame', coins: 1_500, text: 'A glowing ring around your avatar everywhere on beem.' },
  { name: 'Entrance effect', coins: 3_000, text: 'An animation when you join a live room.' },
  { name: 'Exclusive gift pack', coins: 5_000, text: 'Five animated gifts only VIP members can send.' },
  { name: 'Name colour', coins: 800, text: 'Stand out in chat with a coloured display name.' },
  { name: 'Priority support', coins: 2_000, text: 'Skip the queue when you contact support for 30 days.' },
  { name: 'Custom badge', coins: 10_000, text: 'A badge with your own text next to your name.' },
]

export default async function StorePage() {
  const user = await getCurrentUser(await getAccessToken())

  return (
    <AccountShell
      user={user}
      eyebrow="Special Programs"
      title="MyVIP Store"
      subtitle="Perks you buy with coins. Purchases open once payments are connected."
    >
      <div className="acct-cards acct-cards--store">
        {items.map((item) => (
          <div className="acct-card" key={item.name}>
            <span className="acct-tile-icon">
              <Gem size={20} strokeWidth={2} />
            </span>
            <h3>{item.name}</h3>
            <p>{item.text}</p>
            <div className="acct-card-foot">
              <span className="acct-price">
                <span className="tg-coin" aria-hidden="true" />
                {compactNumber(item.coins)}
              </span>
              <button type="button" className="acct-btn" disabled title="Payments are not connected yet">
                Coming soon
              </button>
            </div>
          </div>
        ))}
      </div>
    </AccountShell>
  )
}
