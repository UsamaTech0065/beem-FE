import Link from 'next/link'
import { Users } from 'lucide-react'
import { AccountShell } from '@/components/beem/account-shell'
import { getCurrentUser, getFans } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })

export default async function FansPage() {
  const accessToken = await getAccessToken()
  const [user, fans] = await Promise.all([getCurrentUser(accessToken), getFans(accessToken)])

  return (
    <AccountShell
      user={user}
      eyebrow="Creator Tools"
      title="My Fans"
      subtitle={fans.length > 0 ? `${fans.length} ${fans.length === 1 ? 'person follows' : 'people follow'} you.` : undefined}
    >
      {fans.length > 0 ? (
        <ul className="acct-list">
          {fans.map((fan) => (
            <li key={fan.id} className="acct-row">
              <img src={fan.avatarUrl ?? '/placeholder-user.jpg'} alt="" className="acct-row-avatar" />
              <div className="acct-row-body">
                <strong>{fan.displayName}</strong>
                <span>@{fan.handle} · since {dateFormat.format(new Date(fan.followedAt))}</span>
              </div>
              <span className={`acct-badge${fan.followsBack ? ' is-on' : ''}`}>
                {fan.followsBack ? 'Following each other' : 'Follows you'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="acct-empty">
          <span className="acct-empty-icon">
            <Users size={30} strokeWidth={1.8} />
          </span>
          <h2>No fans yet</h2>
          <p>Go live and people who follow you will show up here.</p>
          <Link href="/live/nearby" className="acct-btn acct-btn--primary">
            Explore live rooms
          </Link>
        </div>
      )}
    </AccountShell>
  )
}
