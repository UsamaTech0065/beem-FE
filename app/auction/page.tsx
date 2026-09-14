import { Gavel } from 'lucide-react'
import { AccountShell } from '@/components/beem/account-shell'
import { getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

const steps = [
  'Creators mint a limited set of collectible cards from their best moments.',
  'Fans bid with coins while the auction is open. The highest bid when it closes wins.',
  'Cards live in your collection and can be shown on your profile or resold later.',
]

export default async function AuctionPage() {
  const user = await getCurrentUser(await getAccessToken())

  return (
    <AccountShell
      user={user}
      eyebrow="Special Programs"
      title="beem Cards Auction"
      subtitle="Collectible creator cards, sold to the highest bidder."
    >
      <div className="acct-empty">
        <span className="acct-empty-icon">
          <Gavel size={30} strokeWidth={1.8} />
        </span>
        <h2>No auctions are running</h2>
        <p>Cards go on sale when creators mint them. Follow creators to hear about their drops first.</p>
      </div>

      <h2 className="acct-h2">How it works</h2>
      <ol className="acct-steps">
        {steps.map((step, index) => (
          <li key={step}>
            <span>{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </AccountShell>
  )
}
