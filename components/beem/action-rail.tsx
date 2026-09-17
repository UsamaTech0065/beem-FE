import Link from 'next/link'
import { CircleStar, Globe, Video } from 'lucide-react'

export function ActionRail() {
  return (
    <aside className="action-rail" aria-label="Quick actions">
      <button type="button" className="coins-action" aria-label="Get more coins">
        <CircleStar size={30} strokeWidth={1.8} />
        <span>
          Get more
          <br />
          Coins now
        </span>
      </button>
      {/* Signed-out visitors land on a sign-in prompt there, so no auth check is needed here. */}
      <Link href="/go-live" className="video-fab" aria-label="Start live video">
        <Video size={26} strokeWidth={2.4} fill="currentColor" />
      </Link>

      <button type="button" className="rail-language" aria-label="Change language">
        <Globe size={20} strokeWidth={2} />
      </button>
    </aside>
  )
}
