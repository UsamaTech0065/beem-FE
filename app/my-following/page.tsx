import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { ActionRail } from '@/components/beem/action-rail'
import { FollowButton } from '@/components/beem/follow-button'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { UserAvatar } from '@/components/beem/user-avatar'
import { getCurrentUser, getFollowing } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function MyFollowingPage() {
  const accessToken = await getAccessToken()
  const [user, following] = await Promise.all([getCurrentUser(accessToken), getFollowing(accessToken)])

  return (
    <div className="beem-app">
      <TopNav user={user} />
      <main className="tg-main follow-page">
        <div className="follow-head">
          <Link href="/" className="follow-back" aria-label="Back">
            <ArrowLeft size={24} />
          </Link>
          <h1>Following</h1>
        </div>

        {following.length > 0 ? (
          <ul className="follow-list">
            {following.map((person) => (
              <li key={person.id} className="follow-row">
                <Link href={`/${person.handle}`} className="follow-row-user">
                  <UserAvatar src={person.avatarUrl} name={person.displayName} size={48} />
                  <strong>{person.displayName}</strong>
                </Link>
                <FollowButton userId={person.id} initialFollowing />
              </li>
            ))}
          </ul>
        ) : (
          <div className="follow-blank">
            <Users size={40} strokeWidth={1.6} />
            <p>You&apos;re not following anyone yet.</p>
          </div>
        )}
      </main>
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
