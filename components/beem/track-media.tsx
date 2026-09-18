'use client'

import { useEffect, useRef } from 'react'
import type { Track } from 'livekit-client'

type VideoProps = Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'src'> & { track: Track | null }

/** A <video> that shows a LiveKit track. Attaching is idempotent, so several may share one track. */
export function TrackVideo({ track, ...props }: VideoProps) {
  const element = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const el = element.current
    if (!el || !track) return
    track.attach(el)
    return () => {
      track.detach(el)
    }
  }, [track])

  return <video ref={element} autoPlay playsInline muted {...props} />
}

type AudioProps = { track: Track | null; muted: boolean }

/** The host's sound. Lives in the session provider so it keeps playing in the mini player. */
export function TrackAudio({ track, muted }: AudioProps) {
  const element = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const el = element.current
    if (!el || !track) return
    track.attach(el)
    return () => {
      track.detach(el)
    }
  }, [track])

  useEffect(() => {
    if (element.current) element.current.muted = muted
  }, [muted])

  return <audio ref={element} autoPlay />
}
