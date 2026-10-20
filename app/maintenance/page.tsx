import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { maintenanceEnabled } from '@/lib/maintenance'
import './maintenance.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Back soon · beem',
  robots: { index: false, follow: false },
}

/** What everyone sees while MAINTENANCE_MODE is on. The proxy rewrites every page here with a 503. */
export default function MaintenancePage() {
  // Reached directly while the site is up: nothing to see.
  if (!maintenanceEnabled()) redirect('/')

  return (
    <main className="maint">
      <img src="/beem-logo.svg" alt="" className="maint-logo" />
      <h1>We&apos;ll be right back</h1>
      <p>beem is getting a quick upgrade. Live rooms, chats and your coins will all be here when we return.</p>
      <p className="maint-sub">Thanks for your patience. Try again in a little while.</p>
    </main>
  )
}
