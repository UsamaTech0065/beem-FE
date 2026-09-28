import type { Metadata } from 'next'
import { ActionRail } from '@/components/beem/action-rail'
import { GetMoney } from '@/components/beem/get-money'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { SignInPrompt } from '@/components/beem/sign-in-prompt'
import { TopNav } from '@/components/beem/top-nav'
import { getCurrentUser, getPayoutSummary } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Get Money · beem' }

/** Diamonds to dollars: progress to the minimum, a withdrawal method, and the request itself. */
export default async function GetMoneyPage() {
  const accessToken = await getAccessToken()
  const [user, summary] = await Promise.all([getCurrentUser(accessToken), getPayoutSummary(accessToken)])

  return (
    <div className="beem-app">
      <TopNav user={user} />
      {user && summary ? (
        <GetMoney initial={summary} />
      ) : (
        <main className="fp">
          {user ? <p className="feed-empty">Payouts are not available right now. Try again in a moment.</p> : <SignInPrompt title="Get Money" />}
        </main>
      )}
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
