'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Mic, MicOff, PhoneOff, SwitchCamera, Video, VideoOff } from 'lucide-react'
import type { Call, CurrentUser, PublicUser } from '@/lib/api-types'
import { useCallRoom } from '@/lib/use-call-room'
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

  // Leaving the page hangs up, so the other person is not left talking to nobody.
  useEffect(() => {
    const onUnload = () => {
      navigator.sendBeacon?.(`/api/calls/${encodeURIComponent(call.id)}/end`)
    }
    window.addEventListener('pagehide', onUnload)
    return () => window.removeEventListener('pagehide', onUnload)
  }, [call.id])

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
    </div>
  )
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}
