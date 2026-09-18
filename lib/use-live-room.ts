'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Participant, RemoteTrack, Room, Track as LkTrack } from 'livekit-client'
import type { StreamConnection } from './api-types'

export type LivePhase =
  /** Fetching a token and connecting. */
  | 'connecting'
  /** In the room, but the host is not sending video (not joined yet, or camera off). */
  | 'waiting'
  | 'live'
  | 'ended'
  | 'error'

/** One line of room chat. Carried over LiveKit data messages, never stored. */
export type ChatMessage = {
  id: string
  identity: string
  name: string
  avatarUrl: string | null
  text: string
  at: number
  /** Marks a line the host wrote. */
  fromHost: boolean
}

export type LiveRoom = {
  phase: LivePhase
  error: string | null
  role: StreamConnection['role'] | null
  /** Everyone in the room except the host. */
  viewerCount: number
  /** The most people watching at once, for the end-of-stream summary. */
  peakViewers: number
  micOn: boolean
  cameraOn: boolean
  /** True when the browser blocked audio until the viewer interacts with the page. */
  audioBlocked: boolean
  /** Viewer's own mute, separate from the browser's autoplay block. */
  muted: boolean
  /** Host only: the device has more than one camera, so switching is possible (phones). */
  canFlipCamera: boolean
  /** Host only: the front camera is in use, so the self-view should be mirrored. */
  facingUser: boolean
  messages: ChatMessage[]
  /** Attach to the <video> that shows the host. */
  videoRef: React.RefObject<HTMLVideoElement | null>
  /** Optional second <video> that receives the same picture, for a blurred backdrop. */
  backdropRef: React.RefObject<HTMLVideoElement | null>
  /** Attach to the <audio> that plays the host. Unused for the host themselves. */
  audioRef: React.RefObject<HTMLAudioElement | null>
  toggleMic: () => Promise<void>
  toggleCamera: () => Promise<void>
  /** Switches between the front and back cameras without dropping the stream. */
  flipCamera: () => Promise<void>
  unblockAudio: () => Promise<void>
  toggleMuted: () => void
  sendChat: (text: string) => Promise<void>
  /** Leaves the room without ending the stream. */
  leave: () => void
}

type ChatSender = { name: string; avatarUrl: string | null }

type Options = {
  /** Host only: watch the encoder's feed (OBS) instead of publishing the browser's camera. */
  studio?: boolean
}

const CHAT_TOPIC = 'chat'
const CHAT_HISTORY = 60
const CHAT_MAX_LENGTH = 200

/**
 * Connects to a stream's LiveKit room and keeps the view state in step with it.
 *
 * livekit-client is imported inside the effect, so its ~300 kB stays out of
 * every bundle except the one that actually opens a room.
 */
export function useLiveRoom(streamId: string, sender: ChatSender | null, options: Options = {}): LiveRoom {
  const studio = Boolean(options.studio)
  const [phase, setPhase] = useState<LivePhase>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<StreamConnection['role'] | null>(null)
  const [viewerCount, setViewerCount] = useState(0)
  const [peakViewers, setPeakViewers] = useState(0)
  const [micOn, setMicOn] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [muted, setMuted] = useState(false)
  const [canFlipCamera, setCanFlipCamera] = useState(false)
  const [facingUser, setFacingUser] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const backdropRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const roomRef = useRef<Room | null>(null)
  const hostIdentityRef = useRef<string | null>(null)
  // The library is imported on demand; callbacks outside the effect reach it here.
  const livekitRef = useRef<typeof import('livekit-client') | null>(null)
  const senderRef = useRef(sender)
  senderRef.current = sender

  useEffect(() => {
    // React runs effects twice in development; `cancelled` makes the first,
    // abandoned run inert instead of fighting the second over the elements.
    let cancelled = false
    let room: Room | null = null

    const fail = (message: string) => {
      if (cancelled) return
      setError(message)
      setPhase('error')
    }

    async function start() {
      const response = await fetch(`/api/streams/${encodeURIComponent(streamId)}/token`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ studio }),
      })
      if (cancelled) return
      if (response.status === 410 || response.status === 404) return setPhase('ended')
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        return fail(body?.message ?? 'Could not join the stream.')
      }
      const connection = (await response.json()) as StreamConnection

      const livekit = await import('livekit-client')
      if (cancelled) return
      livekitRef.current = livekit
      hostIdentityRef.current = connection.hostIdentity
      const { Room, RoomEvent, Track, DisconnectReason, VideoPresets } = livekit

      const isHost = connection.role === 'host'
      // A studio host monitors the encoder's picture like a viewer would.
      const publishes = isHost && !studio
      const fromHost = (participant: Participant) => participant.identity === connection.hostIdentity
      // The host's monitoring browser (identity "<host>#studio") is not an audience member.
      const isAudience = (participant: Participant) =>
        !fromHost(participant) && !participant.identity.startsWith(`${connection.hostIdentity}#`)

      room = new Room({
        // Subscribers only pull the resolution their <video> element can show,
        // and the host stops encoding layers nobody is watching.
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: { resolution: VideoPresets.h720.resolution, facingMode: 'user' },
        publishDefaults: { simulcast: true },
      })
      roomRef.current = room
      setRole(connection.role)

      const recount = () => {
        if (cancelled || !room) return
        const everyone = [room.localParticipant, ...room.remoteParticipants.values()]
        const count = everyone.filter(isAudience).length
        setViewerCount(count)
        setPeakViewers((peak) => Math.max(peak, count))
      }

      const attach = (track: RemoteTrack | LkTrack) => {
        if (track.kind === Track.Kind.Video) {
          if (videoRef.current) track.attach(videoRef.current)
          if (backdropRef.current) track.attach(backdropRef.current)
          setPhase('live')
        } else if (track.kind === Track.Kind.Audio && audioRef.current) {
          track.attach(audioRef.current)
        }
      }

      const decoder = new TextDecoder()

      room
        .on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
          if (!cancelled && fromHost(participant)) attach(track)
        })
        .on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
          track.detach()
          if (!cancelled && fromHost(participant) && track.kind === Track.Kind.Video) setPhase('waiting')
        })
        .on(RoomEvent.TrackMuted, (publication, participant) => {
          if (!cancelled && !publishes && fromHost(participant) && publication.kind === Track.Kind.Video) setPhase('waiting')
        })
        .on(RoomEvent.TrackUnmuted, (publication, participant) => {
          if (!cancelled && !publishes && fromHost(participant) && publication.kind === Track.Kind.Video) setPhase('live')
        })
        .on(RoomEvent.ParticipantConnected, recount)
        .on(RoomEvent.ParticipantDisconnected, recount)
        .on(RoomEvent.AudioPlaybackStatusChanged, () => {
          if (!cancelled && room) setAudioBlocked(!room.canPlaybackAudio)
        })
        .on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
          if (cancelled || topic !== CHAT_TOPIC || !participant) return
          const message = parseChat(decoder.decode(payload), participant.identity, fromHost(participant))
          if (message) setMessages((list) => [...list, message].slice(-CHAT_HISTORY))
        })
        .on(RoomEvent.Disconnected, (reason) => {
          if (cancelled) return
          // The host ended it (room deleted), or the API removed us: it is over.
          if (reason === DisconnectReason.ROOM_DELETED || reason === DisconnectReason.PARTICIPANT_REMOVED) {
            setPhase('ended')
          } else if (reason === DisconnectReason.DUPLICATE_IDENTITY) {
            fail('This stream was opened in another tab.')
          } else if (reason !== DisconnectReason.CLIENT_INITIATED) {
            fail('The connection was lost.')
          }
        })

      await room.connect(connection.url, connection.token)
      if (cancelled) return void room.disconnect()
      recount()

      if (publishes) {
        await room.localParticipant.enableCameraAndMicrophone()
        if (cancelled) return void room.disconnect()
        const camera = room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack
        if (camera) attach(camera)
        setMicOn(room.localParticipant.isMicrophoneEnabled)
        setCameraOn(room.localParticipant.isCameraEnabled)
        // Device labels are only populated once permission is granted, so this
        // has to come after the camera is already on.
        const cameras = await Room.getLocalDevices('videoinput').catch(() => [])
        if (!cancelled) setCanFlipCamera(cameras.length > 1)
        return
      }

      // The host may already be publishing; those tracks fired no event for us.
      setPhase('waiting')
      for (const participant of room.remoteParticipants.values()) {
        if (!fromHost(participant)) continue
        for (const publication of participant.trackPublications.values()) {
          if (publication.track && !publication.isMuted) attach(publication.track)
        }
      }
    }

    start().catch((cause: unknown) => {
      const name = cause instanceof Error ? cause.name : ''
      if (name === 'NotAllowedError') return fail('Allow camera and microphone access to go live.')
      if (name === 'NotFoundError') return fail('No camera or microphone was found.')
      fail(cause instanceof Error ? cause.message : 'Could not join the stream.')
    })

    return () => {
      cancelled = true
      roomRef.current = null
      void room?.disconnect()
    }
  }, [streamId, studio])

  const toggleMic = useCallback(async () => {
    const local = roomRef.current?.localParticipant
    if (!local) return
    await local.setMicrophoneEnabled(!local.isMicrophoneEnabled)
    setMicOn(local.isMicrophoneEnabled)
  }, [])

  const toggleCamera = useCallback(async () => {
    const local = roomRef.current?.localParticipant
    if (!local) return
    await local.setCameraEnabled(!local.isCameraEnabled)
    setCameraOn(local.isCameraEnabled)
  }, [])

  const flipCamera = useCallback(async () => {
    const livekit = livekitRef.current
    const local = roomRef.current?.localParticipant
    if (!livekit || !local) return

    const camera = local.getTrackPublication(livekit.Track.Source.Camera)?.videoTrack
    if (!camera) return

    // restartTrack swaps the underlying device on the same published track, so
    // viewers see a brief freeze rather than the stream dropping and rejoining.
    const next = facingUser ? 'environment' : 'user'
    await camera.restartTrack({ facingMode: next })
    setFacingUser(next === 'user')
  }, [facingUser])

  const unblockAudio = useCallback(async () => {
    await roomRef.current?.startAudio()
  }, [])

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      if (audioRef.current) audioRef.current.muted = !current
      return !current
    })
  }, [])

  const sendChat = useCallback(async (raw: string) => {
    const room = roomRef.current
    const who = senderRef.current
    const text = raw.trim().slice(0, CHAT_MAX_LENGTH)
    if (!room || !who || !text) return

    const message: ChatMessage = {
      id: `${room.localParticipant.identity}:${Date.now()}`,
      identity: room.localParticipant.identity,
      name: who.name,
      avatarUrl: who.avatarUrl,
      text,
      at: Date.now(),
      fromHost: room.localParticipant.identity === hostIdentityRef.current,
    }

    // Data messages are not echoed back to their sender, so add it locally.
    setMessages((list) => [...list, message].slice(-CHAT_HISTORY))
    // TextEncoder types its output over ArrayBufferLike; publishData wants a plain ArrayBuffer.
    const bytes = new TextEncoder().encode(JSON.stringify(message))
    const payload = new Uint8Array(new ArrayBuffer(bytes.byteLength))
    payload.set(bytes)
    await room.localParticipant.publishData(payload, { reliable: true, topic: CHAT_TOPIC })
  }, [])

  const leave = useCallback(() => {
    void roomRef.current?.disconnect()
  }, [])

  return {
    phase,
    error,
    role,
    viewerCount,
    peakViewers,
    micOn,
    cameraOn,
    audioBlocked,
    muted,
    canFlipCamera,
    facingUser,
    messages,
    videoRef,
    backdropRef,
    audioRef,
    toggleMic,
    toggleCamera,
    flipCamera,
    unblockAudio,
    toggleMuted,
    sendChat,
    leave,
  }
}

/**
 * Chat arrives from other browsers, so trust nothing in it: only the text is
 * taken as sent, and the identity comes from LiveKit rather than the payload.
 */
function parseChat(raw: string, identity: string, fromHost: boolean): ChatMessage | null {
  try {
    const data = JSON.parse(raw) as Partial<ChatMessage>
    if (typeof data.text !== 'string' || !data.text.trim()) return null
    return {
      id: `${identity}:${typeof data.at === 'number' ? data.at : Date.now()}`,
      identity,
      name: typeof data.name === 'string' && data.name.trim() ? data.name.slice(0, 48) : 'Guest',
      avatarUrl: typeof data.avatarUrl === 'string' && data.avatarUrl.startsWith('http') ? data.avatarUrl : null,
      text: data.text.trim().slice(0, CHAT_MAX_LENGTH),
      at: typeof data.at === 'number' ? data.at : Date.now(),
      fromHost,
    }
  } catch {
    return null
  }
}
