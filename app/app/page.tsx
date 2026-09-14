import { QrCode, Smartphone } from 'lucide-react'
import { AccountShell } from '@/components/beem/account-shell'
import { getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function GetAppPage() {
  const user = await getCurrentUser(await getAccessToken())

  return (
    <AccountShell
      user={user}
      eyebrow="Settings"
      title="Get beem App"
      subtitle="Stay connected with your friends anywhere and anytime."
    >
      <section className="acct-hero">
        <Smartphone size={40} strokeWidth={1.6} />
        <div>
          <h2>Go live from your phone</h2>
          <p>Notifications when creators you follow start, and one-tap streaming from anywhere.</p>
          <div className="acct-store-badges">
            <button type="button" className="acct-btn acct-btn--dark" disabled title="Not published yet">
              App Store
            </button>
            <button type="button" className="acct-btn acct-btn--dark" disabled title="Not published yet">
              Google Play
            </button>
          </div>
        </div>
        <div className="acct-qr" aria-label="QR code placeholder">
          <QrCode size={96} strokeWidth={1.2} />
          <span>Scan to download</span>
        </div>
      </section>

      <p className="acct-note">The mobile apps are not in the stores yet. This page will link to them the day they are.</p>
    </AccountShell>
  )
}
