import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ActionRail } from '@/components/beem/action-rail'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { CoinIcon } from '@/components/beem/icons'
import { BuyCoinsButton } from '@/components/beem/buy-coins-button'
import { getCurrentUser, getWallet } from '@/lib/api'
import { getAccessToken } from '@/lib/session'
import type { WalletTxnType } from '@/lib/api-types'

export const dynamic = 'force-dynamic'

const dateFormat = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
})

const TXN_LABEL: Record<WalletTxnType, string> = {
  WELCOME_BONUS: 'Welcome bonus',
  PURCHASE: 'Coins purchased',
  GIFT_SENT: 'Gift sent',
  ADJUSTMENT: 'Adjustment',
}

export default async function WalletPage({ searchParams }: { searchParams: Promise<{ purchase?: string }> }) {
  const accessToken = await getAccessToken()
  const [user, wallet, { purchase }] = await Promise.all([
    getCurrentUser(accessToken),
    getWallet(accessToken),
    searchParams,
  ])

  return (
    <div className="beem-app">
      <TopNav user={user} />
      <main className="tg-main follow-page">
        <div className="follow-head">
          <Link href="/" className="follow-back" aria-label="Back">
            <ArrowLeft size={24} />
          </Link>
          <h1>My Coins</h1>
        </div>

        {purchase === 'success' && <p className="wallet-note is-good">Payment received — your coins are on their way.</p>}
        {purchase === 'cancelled' && <p className="wallet-note">Purchase cancelled. No charge was made.</p>}

        <div className="wallet-card">
          <span className="wallet-label">Balance</span>
          <span className="wallet-balance">
            <CoinIcon size={30} /> {wallet.coins.toLocaleString()}
          </span>
          <BuyCoinsButton signedIn={Boolean(user)} />
        </div>

        <h2 className="wallet-history-title">History</h2>
        {wallet.transactions.length > 0 ? (
          <ul className="wallet-list">
            {wallet.transactions.map((txn) => (
              <li key={txn.id} className="wallet-row">
                <div className="wallet-row-main">
                  <strong>{TXN_LABEL[txn.type]}</strong>
                  {txn.memo && <small>{txn.memo}</small>}
                  <small>{dateFormat.format(new Date(txn.createdAt))}</small>
                </div>
                <span className={`wallet-amount${txn.amount < 0 ? ' is-debit' : ''}`}>
                  {txn.amount < 0 ? '' : '+'}
                  {txn.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="wallet-empty">No transactions yet.</p>
        )}
      </main>
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
