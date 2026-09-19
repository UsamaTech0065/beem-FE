import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { ActionRail } from '@/components/beem/action-rail'
import { FollowButton } from '@/components/beem/follow-button'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { UserAvatar } from '@/components/beem/user-avatar'
import { getCurrentUser, getFans } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function MyFollowersPage() {
  const accessToken = await getAccessToken()
  const [user, fans] = await Promise.all([getCurrentUser(accessToken), getFans(accessToken)])

  return (
    <div className="beem-app">
      <TopNav user={user} />
      <main className="tg-main follow-page">
        <div className="follow-head">
          <Link href="/" className="follow-back" aria-label="Back">
            <ArrowLeft size={24} />
          </Link>
          <h1>Followers</h1>
        </div>

        {fans.length > 0 ? (
          <ul className="follow-list">
            {fans.map((fan) => (
              <li key={fan.id} className="follow-row">
                <Link href={`/${fan.handle}`} className="follow-row-user">
                  <UserAvatar src={fan.avatarUrl} name={fan.displayName} size={48} />
                  <strong>{fan.displayName}</strong>
                </Link>
                <FollowButton userId={fan.id} initialFollowing={fan.followsBack} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="follow-blank">
            <Users size={40} strokeWidth={1.6} />
            <p>No one follows you yet.</p>
          </div>
        )}
      </main>
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
