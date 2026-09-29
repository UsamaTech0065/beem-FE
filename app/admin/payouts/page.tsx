import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminPayouts } from '@/components/beem/admin-payouts'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { TopNav } from '@/components/beem/top-nav'
import { getCurrentUser, getPayoutQueue } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Payout requests · beem' }

/** Admin only: pay creators and mark their requests. Anyone else gets a 404, as if it did not exist. */
export default async function AdminPayoutsPage() {
  const accessToken = await getAccessToken()
  const user = await getCurrentUser(accessToken)
  if (user?.role !== 'ADMIN') notFound()
  const queue = await getPayoutQueue(accessToken)

  return (
    <div className="beem-app">
      <TopNav user={user} />
      {queue ? (
        <AdminPayouts initial={queue} />
      ) : (
        <main className="fp">
          <p className="feed-empty">The payout queue is not available right now. Try again in a moment.</p>
        </main>
      )}
      <MobileBottomNav />
    </div>
  )
}
