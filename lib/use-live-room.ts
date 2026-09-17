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

export type LiveRoom = {
  phase: LivePhase
  error: string | null
  role: StreamConnection['role'] | null
  /** Everyone in the room except the host. */
  viewerCount: number
  micOn: boolean
  cameraOn: boolean
  /** True when the browser blocked audio until the viewer interacts with the page. */
  audioBlocked: boolean
  /** Host only: the device has more than one camera, so switching is possible (phones). */
  canFlipCamera: boolean
  /** Host only: the front camera is in use, so the self-view should be mirrored. */
  facingUser: boolean
  /** Attach to the <video> that shows the host. */
  videoRef: React.RefObject<HTMLVideoElement | null>
  /** Attach to the <audio> that plays the host. Unused for the host themselves. */
  audioRef: React.RefObject<HTMLAudioElement | null>
  toggleMic: () => Promise<void>
  toggleCamera: () => Promise<void>
  /** Switches between the front and back cameras without dropping the stream. */
  flipCamera: () => Promise<void>
  unblockAudio: () => Promise<void>
  /** Leaves the room without ending the stream. */
  leave: () => void
}

/**
 * Connects to a stream's LiveKit room and keeps the view state in step with it.
 *
 * livekit-client is imported inside the effect, so its ~300 kB stays out of
 * every bundle except the one that actually opens a room.
 */
export function useLiveRoom(streamId: string): LiveRoom {
  const [phase, setPhase] = useState<LivePhase>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<StreamConnection['role'] | null>(null)
  const [viewerCount, setViewerCount] = useState(0)
  const [micOn, setMicOn] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [canFlipCamera, setCanFlipCamera] = useState(false)
  const [facingUser, setFacingUser] = useState(true)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const roomRef = useRef<Room | null>(null)
  // The library is imported on demand; callbacks outside the effect reach it here.
  const livekitRef = useRef<typeof import('livekit-client') | null>(null)

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
      const response = await fetch(`/api/streams/${encodeURIComponent(streamId)}/token`, { method: 'POST' })
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
      const { Room, RoomEvent, Track, DisconnectReason, VideoPresets } = livekit

      const isHost = connection.role === 'host'
      const fromHost = (participant: Participant) => participant.identity === connection.hostIdentity

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
        setViewerCount(everyone.filter((participant) => !fromHost(participant)).length)
      }

      const attach = (track: RemoteTrack | LkTrack) => {
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current)
          setPhase('live')
        } else if (track.kind === Track.Kind.Audio && audioRef.current) {
          track.attach(audioRef.current)
        }
      }

      room
        .on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
          if (!cancelled && fromHost(participant)) attach(track)
        })
        .on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
          track.detach()
          if (!cancelled && fromHost(participant) && track.kind === Track.Kind.Video) setPhase('waiting')
        })
        .on(RoomEvent.TrackMuted, (publication, participant) => {
          if (!cancelled && !isHost && fromHost(participant) && publication.kind === Track.Kind.Video) setPhase('waiting')
        })
        .on(RoomEvent.TrackUnmuted, (publication, participant) => {
          if (!cancelled && !isHost && fromHost(participant) && publication.kind === Track.Kind.Video) setPhase('live')
        })
        .on(RoomEvent.ParticipantConnected, recount)
        .on(RoomEvent.ParticipantDisconnected, recount)
        .on(RoomEvent.AudioPlaybackStatusChanged, () => {
          if (!cancelled && room) setAudioBlocked(!room.canPlaybackAudio)
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

      if (isHost) {
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
  }, [streamId])

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

  const leave = useCallback(() => {
    void roomRef.current?.disconnect()
  }, [])

  return {
    phase,
    error,
    role,
    viewerCount,
    micOn,
    cameraOn,
    audioBlocked,
    canFlipCamera,
    facingUser,
    videoRef,
    audioRef,
    toggleMic,
    toggleCamera,
    flipCamera,
    unblockAudio,
    leave,
  }
}
