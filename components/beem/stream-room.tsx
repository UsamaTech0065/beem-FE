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
import { ObsGuide } from './broadcast-studio'
import { FollowBurst } from './follow-burst'
import { GIFTS, GiftPanel } from './gift-panel'
import { LiveChat } from './live-chat'
import { LiveEnded } from './live-ended'
import { useLiveSession } from './live-session'
import { SignInDialog } from './sign-in-dialog'
import { TrackVideo } from './track-media'
import { CoinIcon, EyeFilled } from './icons'
import { UserAvatar } from './user-avatar'

/** The cheapest gifts, in price order, for the rail down the right edge. */
const RAIL_GIFTS = [...GIFTS].sort((a, b) => a.coins - b.coins).slice(0, 8)

type Props = {
  stream: StreamDetail
  user: CurrentUser | null
  /** Host arrived from OBS Live: monitor the encoder feed rather than publish. */
  studio: boolean
}

/**
 * The watch and broadcast surface for one stream. The connection itself lives
 * in LiveSessionProvider: leaving this page keeps it running in the mini
 * player, and only Close there, or End here, actually leaves the room.
 */
export function StreamRoom({ stream, user, studio }: Props) {
  const router = useRouter()
  const { session, room, open, close } = useLiveSession()

  const [uiHidden, setUiHidden] = useState(false)
  const [giftsOpen, setGiftsOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [following, setFollowing] = useState(Boolean(stream.isFollowing))
  const [followBusy, setFollowBusy] = useState(false)
  const [ending, setEnding] = useState(false)
  const [shared, setShared] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [ingress, setIngress] = useState<RtmpIngress | null>(null)

  // Join (or re-attach to) the room. Runs again if the visitor signs in, so chat carries their name.
  useEffect(() => {
    open(stream, studio, user ? { name: user.displayName, avatarUrl: user.avatarUrl } : null)
  }, [open, stream, studio, user])

  const attached = session?.stream.id === stream.id
  const isHost = attached && room.role === 'host'
  const publishes = isHost && !studio
  const phase = attached ? room.phase : 'connecting'
  const over = phase === 'ended' || phase === 'error'

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
    if (!response?.ok) return setToast('Could not update follow. Try again.')

    setFollowing(!following)
    // Only a new follow is celebrated, and only once it is actually saved.
    if (!following) void room.announceFollow()
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

  /** Back keeps watching in the mini player; the provider notices the route change. */
  function minimise() {
    if (over) close()
    router.push('/')
  }

  async function endStream() {
    if (!window.confirm('End your live stream for everyone?')) return
    setEnding(true)
    await fetch(`/api/streams/${encodeURIComponent(stream.id)}/end`, { method: 'POST' }).catch(() => null)
    close()
    setEnding(false)
    router.refresh()
  }

  function pickGift(gift: { name: string; coins: number }) {
    if (!user) return setSignInOpen(true)
    setToast(`${gift.name} needs ${gift.coins} coins. Coins and gifting arrive in the next update.`)
  }

  const showPoster = stream.thumbnailUrl && phase !== 'live'

  return (
    <div className={`live${uiHidden ? ' is-ui-hidden' : ''}${isHost ? ' is-host' : ''}`}>
      {/* The same picture twice: blurred across the whole page, sharp in the middle. */}
      <TrackVideo track={attached ? room.videoTrack : null} className="live-bg" aria-hidden="true" />
      {showPoster && <img src={stream.thumbnailUrl!} alt="" className="live-bg live-bg--image" aria-hidden="true" />}

      <div className="live-stage" onClick={() => uiHidden && setUiHidden(false)}>
        <TrackVideo
          track={attached ? room.videoTrack : null}
          className={`live-video${publishes && room.facingUser ? ' is-mirrored' : ''}`}
          hidden={phase !== 'live'}
        />

        {/* Host chip over the picture, with follow for everyone but the host. */}
        {!over && (
          <div className="live-chip">
            <UserAvatar src={stream.host.avatarUrl} name={stream.host.displayName} size={44} />
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
          {phase === 'connecting' && (
            <>
              <Loader2 size={34} className="auth-spin" />
              <p>{isHost ? (studio ? 'Waiting for OBS' : 'Starting your live') : 'Joining'}</p>
            </>
          )}
          {phase === 'waiting' && (
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
          {phase === 'ended' &&
            (isHost ? (
              <LiveEnded peakViewers={room.peakViewers} diamonds={formatDiamonds(stream.diamondsTotal)} />
            ) : (
              <>
                <h2>This live has ended</h2>
                <Link href="/" className="acct-btn acct-btn--primary" onClick={close}>
                  Find another live
                </Link>
              </>
            ))}
          {phase === 'error' && (
            <>
              <h2>Something went wrong</h2>
              <p>{room.error}</p>
              <button type="button" className="acct-btn acct-btn--primary" onClick={() => window.location.reload()}>
                Try again
              </button>
            </>
          )}
        </div>

        <FollowBurst burst={attached ? room.followBurst : null} />

        {room.audioBlocked && phase === 'live' && (
          <button type="button" className="live-unmute" onClick={room.unblockAudio}>
            <Volume2 size={18} /> Tap for sound
          </button>
        )}
      </div>

      {/* ---- overlays ---- */}
      <button type="button" className="live-round live-back" onClick={minimise} aria-label="Back, keep watching in the mini player">
        <ArrowLeft size={22} />
      </button>

      {isHost && !over && (
        <div className="live-stats" title="Watching now and diamonds this live">
          <span>
            <EyeFilled size={15} /> {room.viewerCount}
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
              <span className={`live-state${phase === 'live' ? ' is-live' : ''}`}>
                <span className="live-dot" aria-hidden="true" />
                {phase === 'live' ? 'LIVE' : 'Starting live...'}
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
              <EyeFilled size={16} /> {room.viewerCount}
            </span>
            <button type="button" className="live-round live-round--coin" onClick={() => setGiftsOpen(true)} aria-label="Send a gift">
              <CoinIcon size={26} />
            </button>
            <button type="button" className="live-round" onClick={room.toggleMuted} aria-label={room.muted ? 'Unmute' : 'Mute'}>
              {room.muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button
              type="button"
              className={`live-round live-eye${uiHidden ? ' is-on' : ''}`}
              onClick={() => setUiHidden((hidden) => !hidden)}
              aria-pressed={uiHidden}
              aria-label={uiHidden ? 'Show chat and controls' : 'Hide chat and controls'}
            >
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
            messages={attached ? room.messages : []}
            me={user ? { avatarUrl: user.avatarUrl, name: user.displayName } : null}
            onSend={room.sendChat}
            onSignIn={() => setSignInOpen(true)}
            disabled={phase === 'connecting'}
          />
        </div>
      )}

      {publishes && !over && (
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
            // The quick-gift rail: one tap to send the common gifts, with the
            // full catalogue a tap away at the bottom.
            <div className="gift-rail" aria-label="Quick gifts">
              <div className="gift-rail-list">
                {!following && (
                  <button type="button" className="gift-rail-item" onClick={toggleFollow} disabled={followBusy}>
                    <span className="gift-rail-follow" aria-hidden="true">
                      Follow
                    </span>
                    <span className="gift-rail-price">Free</span>
                  </button>
                )}
                {RAIL_GIFTS.map((gift) => (
                  <button
                    type="button"
                    key={gift.name}
                    className="gift-rail-item"
                    onClick={() => pickGift(gift)}
                    aria-label={`Send ${gift.name} for ${gift.coins} coins`}
                  >
                    <span className="gift-rail-emoji" aria-hidden="true">
                      {gift.emoji}
                    </span>
                    <span className="gift-rail-price">
                      <CoinIcon /> {gift.coins.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
              <button type="button" className="live-round live-round--lg gift-rail-more" onClick={() => setGiftsOpen(true)} aria-label="All gifts">
                <Gift size={24} />
              </button>
            </div>
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
