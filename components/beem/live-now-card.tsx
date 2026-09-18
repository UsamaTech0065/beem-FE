'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Radio } from 'lucide-react'
import type { CurrentUser } from '@/lib/api-types'
import { EyeFilled } from './icons'

type LiveStream = NonNullable<CurrentUser['liveStream']>

/**
 * Shown on the Go live page in place of the form while a stream is running.
 * Starting another would silently end this one, so the choice is made explicit.
 */
export function LiveNowCard({ stream }: { stream: LiveStream }) {
  const router = useRouter()
  const [ending, setEnding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function end() {
    if (!window.confirm('End your live stream for everyone?')) return
    setEnding(true)
    setError(null)

    const response = await fetch(`/api/streams/${encodeURIComponent(stream.id)}/end`, { method: 'POST' }).catch(() => null)
    if (!response?.ok) {
      setEnding(false)
      setError('Could not end the stream. Try again.')
      return
    }
    // Re-render the server tree: the header pill disappears and the form returns.
    router.refresh()
  }

  return (
    <section className="livenow">
      <span className="livenow-icon">
        <Radio size={28} strokeWidth={2} />
      </span>
      <div className="livenow-body">
        <p className="livenow-eyebrow">
          <span className="tg-live-dot" aria-hidden="true" /> You&apos;re live now
        </p>
        <h2>{stream.title}</h2>
        <p className="livenow-meta">
          <EyeFilled size={15} /> {stream.viewerCount} watching · started{' '}
          {/* The server formats this in its own time zone; the browser's value is the right one. */}
          <time dateTime={stream.startedAt} suppressHydrationWarning>
            {new Date(stream.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </time>
        </p>
        {error && <span className="auth-error">{error}</span>}
      </div>
      <div className="livenow-actions">
        <Link href={`/stream/${stream.id}`} className="acct-btn acct-btn--primary">
          Return to stream
        </Link>
        <button type="button" className="acct-btn" onClick={end} disabled={ending}>
          {ending ? 'Ending' : 'End stream'}
        </button>
      </div>
    </section>
  )
}
