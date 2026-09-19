'use client'

import { useState } from 'react'

/**
 * Toggles the follow relationship for one user. Optimistic: the label flips at
 * once and only reverts if the request fails.
 */
export function FollowButton({
  userId,
  initialFollowing,
}: {
  userId: string
  initialFollowing: boolean
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    if (busy) return
    setBusy(true)
    const response = await fetch(`/api/follows/${encodeURIComponent(userId)}`, {
      method: following ? 'DELETE' : 'POST',
    }).catch(() => null)
    setBusy(false)
    if (!response?.ok) return
    setFollowing((value) => !value)
  }

  return (
    <button
      type="button"
      className={`follow-btn${following ? ' is-following' : ''}`}
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
