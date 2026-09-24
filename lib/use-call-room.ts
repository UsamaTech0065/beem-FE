'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Room, Track } from 'livekit-client'
import type { CallConnection, CallStatus } from './api-types'

export type CallPhase = 'connecting' | 'waiting' | 'active' | 'ended' | 'error'

/** How often the page checks the call's state while nobody has picked up yet. */
const STATUS_POLL_MS = 3_000

export type CallRoom = {
  phase: CallPhase
  error: string | null
  /** Why it ended, once it has: the other person's word, or the server's. */
  endedAs: CallStatus | null
  localVideo: Track | null
  remoteVideo: Track | null
  remoteAudio: Track | null
  micOn: boolean
  cameraOn: boolean
  canFlipCamera: boolean
  facingUser: boolean
  /** Seconds since both were connected. */
  elapsed: number
  toggleMic: () => Promise<void>
  toggleCamera: () => Promise<void>
  flipCamera: () => Promise<void>
  /** Hang up: tells the API, which closes the room for both. */
  hangUp: () => Promise<void>
}

/**
 * A private two-person room. Both sides publish camera and microphone; the
 * other side's tracks are shown large, one's own small. Leaving, on either
 * side, ends the call for both.
 */
export function useCallRoom(callId: string): CallRoom {
  const [phase, setPhase] = useState<CallPhase>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [endedAs, setEndedAs] = useState<CallStatus | null>(null)
  const [localVideo, setLocalVideo] = useState<Track | null>(null)
  const [remoteVideo, setRemoteVideo] = useState<Track | null>(null)
  const [remoteAudio, setRemoteAudio] = useState<Track | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [canFlipCamera, setCanFlipCamera] = useState(false)
  const [facingUser, setFacingUser] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const roomRef = useRef<Room | null>(null)
  const livekitRef = useRef<typeof import('livekit-client') | null>(null)
  const startedAtRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    let room: Room | null = null
    let poll: ReturnType<typeof setInterval> | null = null

    const fail = (message: string) => {
      setError(message)
      setPhase('error')
    }
    const over = (status: CallStatus) => {
      setEndedAs(status)
      setPhase('ended')
      setRemoteVideo(null)
      setRemoteAudio(null)
    }

    async function start() {
      const response = await fetch(`/api/calls/${encodeURIComponent(callId)}/token`, { method: 'POST' }).catch(() => null)
      if (cancelled) return
      if (!response) return fail('Cannot reach the server.')
      if (response.status === 410) return over('ENDED')
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        return fail(body?.message ?? 'Could not join the call.')
      }
      const connection = (await response.json()) as CallConnection

      const livekit = await import('livekit-client')
      if (cancelled) return
      livekitRef.current = livekit
      const { Room, RoomEvent, Track, DisconnectReason, VideoPresets } = livekit
      const isPeer = (identity: string) => identity === connection.peerIdentity

      room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: { resolution: VideoPresets.h720.resolution, facingMode: 'user' },
      })
      roomRef.current = room

      const connected = () => {
        if (cancelled) return
        if (startedAtRef.current === null) startedAtRef.current = Date.now()
        setPhase('active')
      }
      const take = (track: Track) => {
        if (track.kind === Track.Kind.Video) setRemoteVideo(track)
        else if (track.kind === Track.Kind.Audio) setRemoteAudio(track)
      }

      room
        .on(RoomEvent.ParticipantConnected, (participant) => {
          if (!cancelled && isPeer(participant.identity)) connected()
        })
        .on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
          if (!cancelled && isPeer(participant.identity)) {
            connected()
            take(track)
          }
        })
        .on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
          if (cancelled || !isPeer(participant.identity)) return
          if (track.kind === Track.Kind.Video) setRemoteVideo(null)
          else if (track.kind === Track.Kind.Audio) setRemoteAudio(null)
        })
        .on(RoomEvent.ParticipantDisconnected, (participant) => {
          // A 1:1 is over the moment the other person leaves.
          if (!cancelled && isPeer(participant.identity)) over('ENDED')
        })
        .on(RoomEvent.Disconnected, (reason) => {
          if (cancelled) return
          if (reason === DisconnectReason.ROOM_DELETED || reason === DisconnectReason.PARTICIPANT_REMOVED) over('ENDED')
          else if (reason === DisconnectReason.DUPLICATE_IDENTITY) fail('This call was opened in another tab.')
          else if (reason !== DisconnectReason.CLIENT_INITIATED) fail('The connection was lost.')
        })

      await room.connect(connection.url, connection.token)
      if (cancelled) return void room.disconnect()

      await room.localParticipant.enableCameraAndMicrophone()
      if (cancelled) return void room.disconnect()
      const camera = room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack
      if (camera) setLocalVideo(camera)
      setMicOn(room.localParticipant.isMicrophoneEnabled)
      setCameraOn(room.localParticipant.isCameraEnabled)
      const cameras = await Room.getLocalDevices('videoinput').catch(() => [])
      if (!cancelled) setCanFlipCamera(cameras.length > 1)

      // The other person may already be in the room.
      const peer = [...room.remoteParticipants.values()].find((participant) => isPeer(participant.identity))
      if (peer) {
        connected()
        for (const publication of peer.trackPublications.values()) {
          if (publication.track) take(publication.track)
        }
      } else {
        setPhase('waiting')
        // While it rings, ask the server whether it was declined or timed out.
        poll = setInterval(async () => {
          const check = await fetch(`/api/calls/${encodeURIComponent(callId)}`).catch(() => null)
          if (!check?.ok || cancelled) return
          const call = (await check.json()) as { status: CallStatus }
          if (call.status === 'ENDED' || call.status === 'MISSED') {
            over(call.status)
            void room?.disconnect()
          }
        }, STATUS_POLL_MS)
      }
    }

    start().catch((cause: unknown) => {
      // Hang up rather than leave the other person with an invite that rings for nobody.
      void fetch(`/api/calls/${encodeURIComponent(callId)}/end`, { method: 'POST' }).catch(() => null)
      void room?.disconnect()
      const name = cause instanceof Error ? cause.name : ''
      if (name === 'NotAllowedError') return fail('Allow camera and microphone access to join the call.')
      if (name === 'NotFoundError') return fail('No camera or microphone was found.')
      fail(cause instanceof Error ? cause.message : 'Could not join the call.')
    })

    return () => {
      cancelled = true
      roomRef.current = null
      if (poll) clearInterval(poll)
      void room?.disconnect()
    }
  }, [callId])

  // Stop polling once the peer is in.
  useEffect(() => {
    if (phase !== 'active') return
    const timer = setInterval(() => {
      if (startedAtRef.current !== null) setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [phase])

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
    const next = facingUser ? 'environment' : 'user'
    await camera.restartTrack({ facingMode: next })
    setFacingUser(next === 'user')
  }, [facingUser])

  const hangUp = useCallback(async () => {
    await fetch(`/api/calls/${encodeURIComponent(callId)}/end`, { method: 'POST' }).catch(() => null)
    void roomRef.current?.disconnect()
    setEndedAs((current) => current ?? 'ENDED')
    setPhase('ended')
  }, [callId])

  return {
    phase,
    error,
    endedAs,
    localVideo,
    remoteVideo,
    remoteAudio,
    micOn,
    cameraOn,
    canFlipCamera,
    facingUser,
    elapsed,
    toggleMic,
    toggleCamera,
    flipCamera,
    hangUp,
  }
}
