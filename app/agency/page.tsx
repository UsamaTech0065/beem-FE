import Link from 'next/link'
import { Handshake, ShieldCheck, Sparkles, Trophy } from 'lucide-react'
import { AccountShell } from '@/components/beem/account-shell'
import { getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

const benefits = [
  { icon: Trophy, title: 'Earn on every creator', text: 'Agencies keep a share of the diamonds their creators earn, paid monthly.' },
  { icon: Sparkles, title: 'Grow with tools', text: 'Recruit, coach and track a roster from one dashboard.' },
  { icon: ShieldCheck, title: 'Dedicated support', text: 'A partner manager for payouts, disputes and promotion.' },
]

const steps = [
  'Tell us about your agency and the creators you work with.',
  'We review the application and get back to you within a few days.',
  'Add your creators and start earning from their streams.',
]

export default async function AgencyPage() {
  const user = await getCurrentUser(await getAccessToken())

  return (
    <AccountShell
      user={user}
      eyebrow="Special Programs"
      title="Agency Program"
      subtitle="Manage creators, grow their audience and share in what they earn."
    >
      <section className="acct-hero">
        <Handshake size={40} strokeWidth={1.6} />
        <div>
          <h2>Bring your creators to beem</h2>
          <p>Agencies run the day-to-day for their creators and are rewarded for the audiences they build.</p>
        </div>
        <Link href="/support" className="acct-btn acct-btn--primary">
          Apply now
        </Link>
      </section>

      <div className="acct-cards">
        {benefits.map(({ icon: Icon, title, text }) => (
          <div className="acct-card" key={title}>
            <span className="acct-tile-icon">
              <Icon size={20} strokeWidth={2} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
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
