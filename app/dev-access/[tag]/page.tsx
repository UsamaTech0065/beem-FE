import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DevAccessForm } from '@/components/beem/dev-access-form'
import { maintenanceDevTag } from '@/lib/maintenance'
import '../../maintenance/maintenance.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Developer access · beem', robots: { index: false, follow: false } }

type Props = { params: Promise<{ tag: string }> }

/**
 * The developer door during maintenance: only exists at the secret tag from
 * MAINTENANCE_DEV_TAG; any other address is a plain 404. The password sets the
 * bypass cookie and the whole site works for that browser.
 */
export default async function DevAccessPage({ params }: Props) {
  const { tag } = await params
  const expected = maintenanceDevTag()
  if (!expected || tag !== expected) notFound()

  return (
    <main className="devgate">
      <img src="/beem-logo.svg" alt="" className="maint-logo" />
      <h1>Developer access</h1>
      <p>Enter the maintenance password to use the site while it is closed to everyone else.</p>
      <DevAccessForm tag={tag} />
      <small>Access lasts 12 hours in this browser.</small>
    </main>
  )
}
