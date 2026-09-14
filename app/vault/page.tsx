import { Lock, Upload } from 'lucide-react'
import { AccountShell } from '@/components/beem/account-shell'
import { getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * Private media a creator sells or gifts to fans. There is no media storage
 * behind this yet, so the page is an honest empty state rather than a mock grid.
 */
export default async function VaultPage() {
  const user = await getCurrentUser(await getAccessToken())

  return (
    <AccountShell
      user={user}
      eyebrow="Creator Tools"
      title="My Vault"
      subtitle="Photos and videos only your paying fans can unlock."
      actions={
        <button type="button" className="acct-btn acct-btn--primary" disabled title="Uploads are not available yet">
          <Upload size={18} strokeWidth={2.2} />
          Upload
        </button>
      }
    >
      <div className="acct-empty">
        <span className="acct-empty-icon">
          <Lock size={30} strokeWidth={1.8} />
        </span>
        <h2>Your vault is empty</h2>
        <p>Uploads open once media storage is connected. Anything you add here stays hidden until a fan unlocks it.</p>
      </div>
    </AccountShell>
  )
}
