'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Gift, Mic, MicOff, PhoneOff, SwitchCamera, Video, VideoOff } from 'lucide-react'
import type { Call, CurrentUser, PublicUser } from '@/lib/api-types'
import { useCallRoom } from '@/lib/use-call-room'
import { GiftBurstView } from './gift-burst'
import { GiftPanel, type GiftItem } from './gift-panel'
import { TrackAudio, TrackVideo } from './track-media'
import { UserAvatar } from './user-avatar'

type Props = {
  call: Call
  /** The person on the other end. */
  peer: PublicUser
  user: CurrentUser
}

/** Full-screen private call: the other person large, yourself small, controls below. */
export function CallRoom({ call, peer, user }: Props) {
  const room = useCallRoom(call.id)
  const backHref = `/chats?c=${encodeURIComponent(call.conversationId)}`
  const iAmCaller = call.callerId === user.id
  const [giftsOpen, setGiftsOpen] = useState(false)
  const [coins, setCoins] = useState(user.coins)
  const [giftBusy, setGiftBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Leaving the page hangs up, so the other person is not left talking to nobody.
  useEffect(() => {
    const onUnload = () => {
      navigator.sendBeacon?.(`/api/calls/${encodeURIComponent(call.id)}/end`)
    }
    window.addEventListener('pagehide', onUnload)
    return () => window.removeEventListener('pagehide', onUnload)
  }, [call.id])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  async function pickGift(gift: GiftItem) {
    if (giftBusy) return
    if (coins < gift.coins) return setToast(`Not enough coins for ${gift.name}. Top up from your balance.`)

    setGiftBusy(true)
    const response = await fetch(`/api/calls/${encodeURIComponent(call.id)}/gift`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ giftId: gift.id }),
    }).catch(() => null)
    setGiftBusy(false)

    if (!response?.ok) {
      const body = (await response?.json().catch(() => null)) as { message?: string } | null
      return setToast(body?.message ?? 'Could not send the gift.')
    }
    const data = (await response.json()) as { coins: number }
    setCoins(data.coins)
    setGiftsOpen(false)
    void room.sendGift({
      id: `${user.id}:${Date.now()}`,
      giftId: gift.id,
      emoji: gift.emoji,
      giftName: gift.name,
      senderName: user.displayName,
      coins: gift.coins,
    })
  }

  const over = room.phase === 'ended' || room.phase === 'error'

  return (
    <div className="call">
      <TrackAudio track={room.remoteAudio} muted={false} />

      <div className="call-stage">
        {room.remoteVideo ? (
          <TrackVideo track={room.remoteVideo} className="call-video" />
        ) : (
          <div className="call-idle">
            <UserAvatar src={peer.avatarUrl} name={peer.displayName} size={128} className="call-idle-avatar" />
            <strong>{peer.displayName}</strong>
            <span>
              {room.phase === 'connecting' && 'Connecting...'}
              {room.phase === 'waiting' && (iAmCaller ? 'Calling...' : 'Joining...')}
              {room.phase === 'active' && 'Camera is off'}
              {room.phase === 'ended' && (room.endedAs === 'MISSED' ? 'No answer' : 'Call ended')}
              {room.phase === 'error' && room.error}
            </span>
          </div>
        )}
        <GiftBurstView burst={room.giftBurst} />
      </div>

      {!over && (
        <div className={`call-self${room.facingUser ? ' is-mirrored' : ''}`}>
          {room.localVideo && room.cameraOn ? (
            <TrackVideo track={room.localVideo} className="call-self-video" />
          ) : (
            <UserAvatar src={user.avatarUrl} name={user.displayName} size={56} />
          )}
        </div>
      )}

      <header className="call-top">
        <UserAvatar src={peer.avatarUrl} name={peer.displayName} size={36} />
        <div>
          <strong>{peer.displayName}</strong>
          <span>{room.phase === 'active' ? formatElapsed(room.elapsed) : '1:1 call'}</span>
        </div>
      </header>

      {over ? (
        <div className="call-over">
          <strong>{room.endedAs === 'MISSED' ? 'No answer' : room.phase === 'error' ? 'Could not connect' : 'Call ended'}</strong>
          {room.phase === 'ended' && room.elapsed > 0 && <span>{formatElapsed(room.elapsed)}</span>}
          <Link href={backHref} className="call-back">
            Back to chat
          </Link>
        </div>
      ) : (
        <div className="call-controls">
          <button type="button" className={`live-round live-round--lg${room.micOn ? '' : ' is-off'}`} onClick={room.toggleMic} aria-label={room.micOn ? 'Mute microphone' : 'Unmute microphone'}>
            {room.micOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          <button type="button" className="live-round live-round--lg live-round--coin" onClick={() => setGiftsOpen((open) => !open)} aria-label="Send a gift" aria-expanded={giftsOpen}>
            <Gift size={22} />
          </button>
          <button type="button" className="live-round live-round--lg call-hangup" onClick={room.hangUp} aria-label="End call">
            <PhoneOff size={24} />
          </button>
          <button type="button" className={`live-round live-round--lg${room.cameraOn ? '' : ' is-off'}`} onClick={room.toggleCamera} aria-label={room.cameraOn ? 'Turn camera off' : 'Turn camera on'}>
            {room.cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
          {room.canFlipCamera && (
            <button type="button" className="live-round live-round--lg" onClick={room.flipCamera} aria-label="Switch camera">
              <SwitchCamera size={22} />
            </button>
          )}
        </div>
      )}

      {giftsOpen && !over && <GiftPanel balance={coins} onClose={() => setGiftsOpen(false)} onPick={pickGift} />}

      {toast && (
        <div className="live-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}
