import Link from 'next/link'
import { GraduationCap, Mail, MessageCircle } from 'lucide-react'
import { AccountShell } from '@/components/beem/account-shell'
import { getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

const SUPPORT_EMAIL = 'support@beem.app'

export default async function SupportPage() {
  const user = await getCurrentUser(await getAccessToken())

  return (
    <AccountShell user={user} eyebrow="Settings" title="Customer Support" subtitle="We usually answer within one business day.">
      <div className="acct-cards">
        <a className="acct-card acct-card--link" href={`mailto:${SUPPORT_EMAIL}?subject=beem support${user ? ` (@${user.handle})` : ''}`}>
          <span className="acct-tile-icon">
            <Mail size={20} strokeWidth={2} />
          </span>
          <h3>Email us</h3>
          <p>{SUPPORT_EMAIL}</p>
          <p className="acct-card-meta">Include your handle so we can find your account.</p>
        </a>
        <Link className="acct-card acct-card--link" href="/chats">
          <span className="acct-tile-icon">
            <MessageCircle size={20} strokeWidth={2} />
          </span>
          <h3>Chat with us</h3>
          <p>Message the beem team from your chats.</p>
        </Link>
        <Link className="acct-card acct-card--link" href="/help">
          <span className="acct-tile-icon">
            <GraduationCap size={20} strokeWidth={2} />
          </span>
          <h3>Read the guide</h3>
          <p>Answers to the most common questions.</p>
        </Link>
      </div>

      {user && (
        <p className="acct-note">
          Signed in as <strong>@{user.handle}</strong>. Account deletion and payout questions are handled by email.
        </p>
      )}
    </AccountShell>
  )
}
