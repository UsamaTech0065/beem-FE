import { AccountShell } from '@/components/beem/account-shell'
import { getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

const faqs = [
  {
    q: 'How do I go live?',
    a: 'Tap the pink camera button on the right of any page. Pick a title and a category, then start. Viewers who follow you get a notification.',
  },
  {
    q: 'What are coins and diamonds?',
    a: 'Viewers buy coins and spend them on gifts. Creators receive gifts as diamonds, which can be cashed out once the balance reaches the minimum.',
  },
  {
    q: 'How do I follow a creator?',
    a: 'Open their live room or profile and tap Follow. Everyone you follow appears under Following, and their live rooms appear at the top of your feed.',
  },
  {
    q: 'How does VIP status work?',
    a: 'Coins you spend on gifts count toward your VIP tier. Each tier unlocks badges, effects and perks. See VIP Loyalty in your account menu.',
  },
  {
    q: 'Can I sign in with my phone and my email?',
    a: 'Each sign-in method creates its own account. Pick one and keep using it, so your followers and diamonds stay together.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Contact Customer Support from your account menu. Deletion is permanent and removes your streams, followers and balance.',
  },
]

export default async function HelpPage() {
  const user = await getCurrentUser(await getAccessToken())

  return (
    <AccountShell user={user} eyebrow="Special Programs" title="How to beem" subtitle="Short answers to the questions people ask most.">
      <div className="acct-faq">
        {faqs.map((faq) => (
          <details key={faq.q}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </div>
    </AccountShell>
  )
}
