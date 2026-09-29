'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Phone, PhoneOff } from 'lucide-react'
import type { IncomingCall } from '@/lib/api-types'
import { UserAvatar } from './user-avatar'

/** How often to ask whether somebody is calling. A call rings for 60 s, so this catches it early. */
const POLL_MS = 4_000

/**
 * A banner on every page when somebody starts a 1:1 call with you: who it is,
 * with Answer and Decline. Answering opens the call page; declining ends it
 * as missed, the same as letting it ring out.
 */
export function IncomingCallAlert() {
  const pathname = usePathname()
  const router = useRouter()
  const [incoming, setIncoming] = useState<IncomingCall | null>(null)
  const [busy, setBusy] = useState(false)
  // Calls declined here stay hidden even if the poll sees them once more.
  const dismissed = useRef<string | null>(null)
  const onCallPage = pathname?.startsWith('/call/') ?? false

  useEffect(() => {
    if (onCallPage) {
      setIncoming(null)
      return
    }
    let cancelled = false

    async function check() {
      const response = await fetch('/api/calls/incoming').catch(() => null)
      if (cancelled) return
      // 401 means nobody is signed in any more; anything else, try again next tick.
      const next = response?.ok ? ((await response.json().catch(() => null)) as IncomingCall | null) : null
      setIncoming(next && next.call.id !== dismissed.current ? next : null)
    }

    void check()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void check()
    }, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [onCallPage])

  // Ring while the banner is up: a vibration on phones, a soft tone where the
  // browser lets a page make sound.
  useEffect(() => {
    if (!incoming) return
    const stopVibrate = vibrate()
    const stopTone = ring()
    return () => {
      stopVibrate()
      stopTone()
    }
  }, [incoming])

  if (!incoming) return null
  const { call, caller } = incoming

  function answer() {
    dismissed.current = call.id
    setIncoming(null)
    router.push(`/call/${encodeURIComponent(call.id)}`)
  }

  async function decline() {
    if (busy) return
    setBusy(true)
    dismissed.current = call.id
    // Hide it at once; closing the room on the server can take a moment.
    setIncoming(null)
    await fetch(`/api/calls/${encodeURIComponent(call.id)}/end`, { method: 'POST' }).catch(() => null)
    setBusy(false)
  }

  return (
    <div className="call-alert" role="alertdialog" aria-live="assertive" aria-label={`${caller.displayName} is calling you`}>
      <UserAvatar src={caller.avatarUrl} name={caller.displayName} size={48} className="call-alert-avatar" />
      <div className="call-alert-text">
        <strong>{caller.displayName}</strong>
        <span>Incoming 1:1 call...</span>
      </div>
      <div className="call-alert-actions">
        <button type="button" className="call-alert-btn call-alert-btn--decline" onClick={decline} disabled={busy} aria-label="Decline call">
          <PhoneOff size={20} />
        </button>
        <button type="button" className="call-alert-btn call-alert-btn--answer" onClick={answer} aria-label="Answer call">
          <Phone size={20} />
        </button>
      </div>
    </div>
  )
}

function vibrate(): () => void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return () => {}
  const pattern = [400, 300, 400, 1400]
  navigator.vibrate(pattern)
  const timer = setInterval(() => navigator.vibrate(pattern), 2_500)
  return () => {
    clearInterval(timer)
    navigator.vibrate(0)
  }
}

/** Two short beeps every two seconds. Silently does nothing when autoplay is blocked. */
function ring(): () => void {
  let context: AudioContext | null = null
  try {
    context = new AudioContext()
  } catch {
    return () => {}
  }
  const beep = () => {
    if (!context || context.state !== 'running') {
      void context?.resume().catch(() => {})
      return
    }
    for (const offset of [0, 0.35]) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, context.currentTime + offset)
      gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + offset + 0.25)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(context.currentTime + offset)
      oscillator.stop(context.currentTime + offset + 0.3)
    }
  }
  beep()
  const timer = setInterval(beep, 2_000)
  return () => {
    clearInterval(timer)
    void context?.close().catch(() => {})
  }
}
