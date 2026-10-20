'use client'

import { useEffect, useState } from 'react'

/**
 * A small pill for developers browsing during maintenance, so nobody forgets
 * the public is seeing the maintenance screen. Driven by the readable flag
 * cookie; the proof itself stays httpOnly.
 */
export function MaintenanceBadge() {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    setShown(document.cookie.split('; ').some((part) => part.startsWith('beem_maint_dev=')))
  }, [])

  if (!shown) return null

  async function leave() {
    await fetch('/api/maintenance/unlock', { method: 'DELETE' }).catch(() => null)
    window.location.assign('/')
  }

  return (
    <div className="maint-badge" role="status">
      Maintenance mode: developer view
      <button type="button" onClick={leave}>
        Exit
      </button>
    </div>
  )
}
