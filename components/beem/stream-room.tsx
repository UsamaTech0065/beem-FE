'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, Gem, Loader2, Mic, MicOff, Video, VideoOff, Volume2, X } from 'lucide-react'
import { formatDiamonds, type StreamCard } from '@/lib/api-types'
import { useLiveRoom } from '@/lib/use-live-room'

const FALLBACK_AVATAR = '/placeholder-user.jpg'

/** The watch and broadcast surface for one stream. The role comes from the token the API issues. */
export function StreamRoom({ stream }: { stream: StreamCard }) {
  const router = useRouter()
  const room = useLiveRoom(stream.id)
  const [ending, setEnding] = useState(false)

  const isHost = room.role === 'host'

  async function endStream() {
    if (!window.confirm('End your live stream for everyone?')) return
    setEnding(true)
    await fetch(`/api/streams/${encodeURIComponent(stream.id)}/end`, { method: 'POST' }).catch(() => null)
    room.leave()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="room">
      <div className="room-stage">
        {stream.thumbnailUrl && room.phase !== 'live' && (
          <img src={stream.thumbnailUrl} alt="" className="room-backdrop" aria-hidden="true" />
        )}

        {/* The host sees themselves mirrored and muted; viewers hear the separate <audio>. */}
        <video
          ref={room.videoRef}
          className={`room-video${isHost ? ' is-mirrored' : ''}`}
          autoPlay
          playsInline
          muted
          hidden={room.phase !== 'live'}
        />
        {!isHost && <audio ref={room.audioRef} autoPlay />}

        <header className="room-top">
          <div className="room-host">
            <img src={stream.host.avatarUrl ?? FALLBACK_AVATAR} alt="" />
            <div>
              <strong>{stream.host.displayName}</strong>
              <span>
                <Gem size={13} strokeWidth={2.2} /> {formatDiamonds(stream.diamondsTotal)}
              </span>
            </div>
          </div>

          <div className="room-meta">
            {room.phase === 'live' && <span className="room-live">LIVE</span>}
            <span className="room-viewers" title="Watching now">
              <Eye size={16} fill="currentColor" strokeWidth={0} /> {room.viewerCount}
            </span>
            <Link href="/" className="room-close" aria-label="Leave stream">
              <X size={22} />
            </Link>
          </div>
        </header>

        <div className="room-status" aria-live="polite">
          {room.phase === 'connecting' && (
            <>
              <Loader2 size={34} className="auth-spin" />
              <p>{isHost ? 'Starting your stream' : 'Joining'}</p>
            </>
          )}
          {room.phase === 'waiting' && (
            <>
              <VideoOff size={34} strokeWidth={1.6} />
              <p>{isHost ? 'Your camera is off' : `Waiting for ${stream.host.displayName}`}</p>
            </>
          )}
          {room.phase === 'ended' && (
            <>
              <h2>This stream has ended</h2>
              <Link href="/" className="acct-btn acct-btn--primary">
                Find another stream
              </Link>
            </>
          )}
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
          <button type="button" className="room-unmute" onClick={room.unblockAudio}>
            <Volume2 size={18} /> Tap for sound
          </button>
        )}

        <footer className="room-bottom">
          <h1>{stream.title}</h1>
          {stream.category && <span className="room-category">{stream.category.name}</span>}

          {isHost && room.phase !== 'ended' && room.phase !== 'error' && (
            <div className="room-controls">
              <button
                type="button"
                className={`room-control${room.micOn ? '' : ' is-off'}`}
                onClick={room.toggleMic}
                aria-label={room.micOn ? 'Mute microphone' : 'Unmute microphone'}
                aria-pressed={!room.micOn}
              >
                {room.micOn ? <Mic size={22} /> : <MicOff size={22} />}
              </button>
              <button
                type="button"
                className={`room-control${room.cameraOn ? '' : ' is-off'}`}
                onClick={room.toggleCamera}
                aria-label={room.cameraOn ? 'Turn camera off' : 'Turn camera on'}
                aria-pressed={!room.cameraOn}
              >
                {room.cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
              </button>
              <button type="button" className="room-end" onClick={endStream} disabled={ending}>
                {ending ? 'Ending' : 'End stream'}
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  )
}
