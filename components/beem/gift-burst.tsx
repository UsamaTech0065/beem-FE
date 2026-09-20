'use client'

import { useEffect, useRef, useState } from 'react'
import type { GiftBurst } from '@/lib/use-live-room'

/** How long a gift stays on screen; the hook clears the source shortly after. */
const SHOW_MS = 3_600

/**
 * The gift that floats up over the picture when someone sends one. Everyone in
 * the room sees it. Each burst plays once, keyed by its id.
 */
export function GiftBurstView({ burst }: { burst: GiftBurst | null }) {
  const [shown, setShown] = useState<GiftBurst | null>(null)
  const lastId = useRef<string | null>(null)

  useEffect(() => {
    if (!burst || burst.id === lastId.current) return
    lastId.current = burst.id
    setShown(burst)
    const timer = setTimeout(() => setShown(null), SHOW_MS)
    return () => clearTimeout(timer)
  }, [burst])

  if (!shown) return null

  return (
    <div key={shown.id} className="gift-burst" role="status">
      <span className="gift-burst-emoji" aria-hidden="true">
        {shown.emoji}
      </span>
      <span className="gift-burst-label">
        <strong>{shown.senderName}</strong> sent {shown.giftName}
      </span>
    </div>
  )
}
