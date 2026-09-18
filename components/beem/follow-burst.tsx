'use client'

import { useEffect, useId, useState } from 'react'
import type { FollowBurst as Burst } from '@/lib/use-live-room'

/** Long enough to read, short enough that a second follow soon after still gets its moment. */
const SHOW_MS = 2_800

/**
 * The big FOLLOW heart that pops over the picture when someone follows the
 * host. Everyone in the room sees it. A new burst replaces the current one and
 * restarts the animation, which the `key` on the wrapper takes care of.
 */
export function FollowBurst({ burst }: { burst: Burst | null }) {
  const [shown, setShown] = useState<Burst | null>(null)
  const gradient = useId()

  useEffect(() => {
    if (!burst) return
    setShown(burst)
    const timer = setTimeout(() => setShown(null), SHOW_MS)
    return () => clearTimeout(timer)
  }, [burst])

  if (!shown) return null

  return (
    <div key={shown.id} className="follow-burst" role="status">
      <div className="follow-burst-heart">
        <svg viewBox="0 0 200 180" aria-hidden="true">
          <defs>
            <radialGradient id={gradient} cx="38%" cy="30%" r="85%">
              <stop offset="0" stopColor="#ff8ac6" />
              <stop offset=".5" stopColor="#ff3d9a" />
              <stop offset="1" stopColor="#e0148a" />
            </radialGradient>
          </defs>
          <path
            fill={`url(#${gradient})`}
            d="M100 172C60 140 12 108 12 62 12 32 34 12 60 12c17 0 31 9 40 23 9-14 23-23 40-23 26 0 48 20 48 50 0 46-48 78-88 110Z"
          />
          <ellipse cx="62" cy="50" rx="26" ry="16" fill="#fff" opacity=".28" transform="rotate(-28 62 50)" />
        </svg>
        <span className="follow-burst-word">FOLLOW</span>
      </div>
      <p className="follow-burst-name">{shown.name} followed</p>
    </div>
  )
}
