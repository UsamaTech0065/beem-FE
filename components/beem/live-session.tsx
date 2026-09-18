'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Eye, Maximize2, X } from 'lucide-react'
import type { StreamDetail } from '@/lib/api-types'
import { useLiveRoom, type ChatSender, type LiveRoom } from '@/lib/use-live-room'
import { TrackAudio, TrackVideo } from './track-media'

type Session = {
  stream: StreamDetail
  studio: boolean
  sender: ChatSender | null
}

type LiveSessionContext = {
  session: Session | null
  room: LiveRoom
  /** Join a stream, replacing any other one the visitor had open. */
  open: (stream: StreamDetail, studio: boolean, sender: ChatSender | null) => void
  /** Leave the room for good. */
  close: () => void
}

const Context = createContext<LiveSessionContext | null>(null)

/**
 * Holds the one live room a visitor can be in, above the page tree, so that
 * leaving the stream page shrinks the picture into a corner instead of
 * dropping the connection. Mounted once in the root layout.
 */
export function LiveSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const room = useLiveRoom(session?.stream.id ?? null, session?.sender ?? null, { studio: session?.studio })

  const open = useCallback((stream: StreamDetail, studio: boolean, sender: ChatSender | null) => {
    setSession((current) => {
      if (current && current.stream.id === stream.id && current.studio === studio) return current
      return { stream, studio, sender }
    })
  }, [])

  const close = useCallback(() => {
    room.leave()
    setSession(null)
  }, [room])

  const value = useMemo(() => ({ session, room, open, close }), [session, room, open, close])

  return (
    <Context.Provider value={value}>
      {children}
      {session && <TrackAudio track={session.studio || room.role !== 'host' ? room.audioTrack : null} muted={room.muted} />}
      <MiniPlayer />
    </Context.Provider>
  )
}

export function useLiveSession(): LiveSessionContext {
  const value = useContext(Context)
  if (!value) throw new Error('useLiveSession must be used inside LiveSessionProvider')
  return value
}

/** The floating player shown on every page except the stream's own. */
function MiniPlayer() {
  const { session, room, close } = useLiveSession()
  const pathname = usePathname()
  const router = useRouter()

  const onOwnPage = session ? pathname === `/stream/${session.stream.id}` : false

  // A stream that ended while minimised has nothing left to show.
  useEffect(() => {
    if (session && !onOwnPage && (room.phase === 'ended' || room.phase === 'error')) close()
  }, [session, onOwnPage, room.phase, close])

  if (!session || onOwnPage) return null

  const { stream } = session
  const href = `/stream/${stream.id}${session.studio ? '?source=obs' : ''}`

  return (
    <div className="pip" role="region" aria-label={`Mini player: ${stream.host.displayName}`}>
      <button type="button" className="pip-stage" onClick={() => router.push(href)} aria-label="Return to the stream">
        <TrackVideo track={room.videoTrack} className="pip-video" />
        {!room.videoTrack && <img src={stream.thumbnailUrl ?? '/placeholder-user.jpg'} alt="" className="pip-poster" />}
      </button>

      <div className="pip-top">
        <span className="pip-live">
          <span className="live-dot" aria-hidden="true" /> LIVE
        </span>
        <span className="pip-viewers">
          <Eye size={12} fill="currentColor" strokeWidth={0} /> {room.viewerCount}
        </span>
        <Link href={href} className="pip-btn" aria-label="Expand">
          <Maximize2 size={14} />
        </Link>
        <button type="button" className="pip-btn" onClick={close} aria-label="Close mini player">
          <X size={16} />
        </button>
      </div>

      <div className="pip-bottom">
        <img src={stream.host.avatarUrl ?? '/placeholder-user.jpg'} alt="" />
        <strong>{stream.host.displayName}</strong>
      </div>
    </div>
  )
}
