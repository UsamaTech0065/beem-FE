'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Gem,
  Gift,
  Loader2,
  Mic,
  MicOff,
  Plus,
  Share2,
  SwitchCamera,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Wand2,
  X,
} from 'lucide-react'
import { formatDiamonds, type CurrentUser, type RtmpIngress, type StreamDetail } from '@/lib/api-types'
import { useLiveRoom } from '@/lib/use-live-room'
import { ObsGuide } from './broadcast-studio'
import { GiftPanel } from './gift-panel'
import { LiveChat } from './live-chat'
import { LiveEnded } from './live-ended'
import { SignInDialog } from './sign-in-dialog'

const FALLBACK_AVATAR = '/placeholder-user.jpg'

type Props = {
  stream: StreamDetail
  user: CurrentUser | null
  /** Host arrived from OBS Live: monitor the encoder feed rather than publish. */
  studio: boolean
}

/** The watch and broadcast surface for one stream. The role comes from the token the API issues. */
export function StreamRoom({ stream, user, studio }: Props) {
  const router = useRouter()
  const room = useLiveRoom(stream.id, user ? { name: user.displayName, avatarUrl: user.avatarUrl } : null, { studio })

  const [uiHidden, setUiHidden] = useState(false)
  const [giftsOpen, setGiftsOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [following, setFollowing] = useState(Boolean(stream.isFollowing))
  const [followBusy, setFollowBusy] = useState(false)
  const [ending, setEnding] = useState(false)
  const [shared, setShared] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [ingress, setIngress] = useState<RtmpIngress | null>(null)

  const isHost = room.role === 'host'
  const over = room.phase === 'ended' || room.phase === 'error'

  // OBS host: fetch the server and key so they can be pasted into the encoder.
  useEffect(() => {
    if (!isHost || !studio) return
    let cancelled = false
    fetch(`/api/streams/${encodeURIComponent(stream.id)}/ingress`, { method: 'POST' })
      .then((response) => (response.ok ? (response.json() as Promise<RtmpIngress>) : null))
      .then((data) => {
        if (!cancelled && data) setIngress(data)
      })
      .catch(() => null)
    return () => {
      cancelled = true
    }
  }, [isHost, studio, stream.id])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  async function toggleFollow() {
    if (!user) return setSignInOpen(true)
    setFollowBusy(true)
    const response = await fetch(`/api/follows/${encodeURIComponent(stream.host.id)}`, {
      method: following ? 'DELETE' : 'POST',
    }).catch(() => null)
    setFollowBusy(false)
    if (response?.ok) setFollowing(!following)
    else setToast('Could not update follow. Try again.')
  }

  async function share() {
    const url = `${location.origin}/stream/${stream.id}`
    try {
      if (navigator.share) await navigator.share({ title: `${stream.host.displayName} is live on beem`, url })
      else await navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 1800)
    } catch {
      // Share sheet dismissed.
    }
  }

  async function endStream() {
    if (!window.confirm('End your live stream for everyone?')) return
    setEnding(true)
    await fetch(`/api/streams/${encodeURIComponent(stream.id)}/end`, { method: 'POST' }).catch(() => null)
    room.leave()
    setEnding(false)
    router.refresh()
  }

  function pickGift(gift: { name: string; coins: number }) {
    if (!user) return setSignInOpen(true)
    setToast(`${gift.name} needs ${gift.coins} coins. Coins and gifting arrive in the next update.`)
  }

  const showBackdrop = stream.thumbnailUrl && room.phase !== 'live'

  return (
    <div className={`live${uiHidden ? ' is-ui-hidden' : ''}${isHost ? ' is-host' : ''}`}>
      {/* The same picture twice: blurred across the whole page, sharp in the middle. */}
      <video ref={room.backdropRef} className="live-bg" autoPlay playsInline muted aria-hidden="true" />
      {showBackdrop && <img src={stream.thumbnailUrl!} alt="" className="live-bg live-bg--image" aria-hidden="true" />}

      <div className="live-stage">
        <video
          ref={room.videoRef}
          className={`live-video${isHost && !studio && room.facingUser ? ' is-mirrored' : ''}`}
          autoPlay
          playsInline
          muted
          hidden={room.phase !== 'live'}
        />
        {!(isHost && !studio) && <audio ref={room.audioRef} autoPlay />}

        {/* Host chip over the picture, with follow for everyone but the host. */}
        {!over && (
          <div className="live-chip">
            <img src={stream.host.avatarUrl ?? FALLBACK_AVATAR} alt="" />
            <div>
              <strong>{stream.host.displayName}</strong>
              <span>
                <Gem size={13} strokeWidth={2.2} /> {formatDiamonds(stream.diamondsTotal)}
              </span>
            </div>
            {!isHost && (
              <button
                type="button"
                className={`live-follow${following ? ' is-on' : ''}`}
                onClick={toggleFollow}
                disabled={followBusy}
                aria-label={following ? `Unfollow ${stream.host.displayName}` : `Follow ${stream.host.displayName}`}
                aria-pressed={following}
              >
                {following ? <Check size={20} strokeWidth={3} /> : <Plus size={22} strokeWidth={3} />}
              </button>
            )}
          </div>
        )}

        <div className="live-status" aria-live="polite">
          {room.phase === 'connecting' && (
            <>
              <Loader2 size={34} className="auth-spin" />
              <p>{isHost ? (studio ? 'Waiting for OBS' : 'Starting your live') : 'Joining'}</p>
            </>
          )}
          {room.phase === 'waiting' && (
            <>
              <VideoOff size={34} strokeWidth={1.6} />
              <p>
                {isHost
                  ? studio
                    ? 'Press Start Streaming in OBS and your picture appears here.'
                    : 'Your camera is off'
                  : `Waiting for ${stream.host.displayName}`}
              </p>
            </>
          )}
          {room.phase === 'ended' &&
            (isHost ? (
              <LiveEnded peakViewers={room.peakViewers} diamonds={formatDiamonds(stream.diamondsTotal)} />
            ) : (
              <>
                <h2>This live has ended</h2>
                <Link href="/" className="acct-btn acct-btn--primary">
                  Find another live
                </Link>
              </>
            ))}
          {room.phase === 'error' && (
            <>
              <h2>Something went wrong</h2>
              <p>{room.error}</p>
              <button type="button" className="acct-btn acct-btn--primary" onClick={() => window.location.reload()}>
                Try again
              </button>
            </>
          )}
        </div>

        {room.audioBlocked && room.phase === 'live' && (
          <button type="button" className="live-unmute" onClick={room.unblockAudio}>
            <Volume2 size={18} /> Tap for sound
          </button>
        )}
      </div>

      {/* ---- overlays ---- */}
      <Link href="/" className="live-round live-back" aria-label="Back">
        <ArrowLeft size={22} />
      </Link>

      {isHost && !over && (
        <div className="live-stats" title="Watching now and diamonds this live">
          <span>
            <Eye size={15} fill="currentColor" strokeWidth={0} /> {room.viewerCount}
          </span>
          <span>
            <Gem size={15} strokeWidth={2.2} /> {formatDiamonds(stream.diamondsTotal)}
          </span>
        </div>
      )}

      <div className="live-actions">
        {isHost ? (
          <>
            {!over && (
              <span className={`live-pill${room.phase === 'live' ? ' is-live' : ''}`}>
                <span className="live-dot" aria-hidden="true" />
                {room.phase === 'live' ? 'LIVE' : 'Starting live...'}
              </span>
            )}
            {room.canFlipCamera && room.cameraOn && !studio && (
              <button type="button" className="live-round" onClick={room.flipCamera} aria-label="Switch camera">
                <SwitchCamera size={20} />
              </button>
            )}
            <button type="button" className="live-round" onClick={share} aria-label="Share">
              {shared ? <Check size={20} /> : <Share2 size={20} />}
            </button>
            {!over && (
              <button type="button" className="live-round live-round--end" onClick={endStream} disabled={ending} aria-label="End live">
                {ending ? <Loader2 size={20} className="auth-spin" /> : <X size={22} />}
              </button>
            )}
          </>
        ) : (
          <>
            <span className="live-viewers">
              <Eye size={16} fill="currentColor" strokeWidth={0} /> {room.viewerCount}
            </span>
            <button type="button" className="live-round live-round--coin" onClick={() => setGiftsOpen(true)} aria-label="Send a gift">
              <span className="tg-coin" aria-hidden="true" />
            </button>
            <button type="button" className="live-round" onClick={room.toggleMuted} aria-label={room.muted ? 'Unmute' : 'Mute'}>
              {room.muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button type="button" className="live-round" onClick={() => setUiHidden((h) => !h)} aria-label={uiHidden ? 'Show controls' : 'Hide controls'}>
              {uiHidden ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
            <button type="button" className="live-round" onClick={share} aria-label="Share">
              {shared ? <Check size={20} /> : <Share2 size={20} />}
            </button>
          </>
        )}
      </div>

      {!over && (
        <div className="live-bottom-left">
          {isHost && room.messages.length === 0 && (
            <p className="live-legal">
              You must be at least 18 years old to broadcast. Broadcasts are reviewed by beem&apos;s moderation
              team. For questions contact Customer Support.
            </p>
          )}
          <LiveChat
            messages={room.messages}
            me={user ? { avatarUrl: user.avatarUrl } : null}
            onSend={room.sendChat}
            onSignIn={() => setSignInOpen(true)}
            disabled={room.phase === 'connecting'}
          />
        </div>
      )}

      {isHost && !studio && !over && (
        <div className="live-controls">
          <button
            type="button"
            className={`live-round live-round--lg${room.micOn ? '' : ' is-off'}`}
            onClick={room.toggleMic}
            aria-pressed={!room.micOn}
            aria-label={room.micOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            {room.micOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          <button
            type="button"
            className={`live-round live-round--lg${room.cameraOn ? '' : ' is-off'}`}
            onClick={room.toggleCamera}
            aria-pressed={!room.cameraOn}
            aria-label={room.cameraOn ? 'Turn camera off' : 'Turn camera on'}
          >
            {room.cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
          <button type="button" className="live-round live-round--lg" disabled title="Masks and filters are coming soon" aria-label="Masks and filters">
            <Wand2 size={22} />
          </button>
        </div>
      )}

      {isHost && studio && !over && (
        <aside className="live-side">
          <ObsGuide ingress={ingress} />
        </aside>
      )}

      {!isHost && !over && (
        <>
          {giftsOpen ? (
            <GiftPanel balance={0} onClose={() => setGiftsOpen(false)} onPick={pickGift} />
          ) : (
            <button type="button" className="live-round live-round--lg live-gift" onClick={() => setGiftsOpen(true)} aria-label="Gifts">
              <Gift size={24} />
            </button>
          )}
        </>
      )}

      {toast && (
        <div className="live-toast" role="status">
          {toast}
        </div>
      )}

      {signInOpen && <SignInDialog onClose={() => setSignInOpen(false)} />}
    </div>
  )
}
