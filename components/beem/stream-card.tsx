import Image from 'next/image'
import { Eye, Gem, Play } from 'lucide-react'
import { formatDiamonds, type StreamCard as StreamCardData } from '@/lib/api-types'

const FALLBACK_THUMB = '/placeholder.jpg'
const FALLBACK_AVATAR = '/placeholder-user.jpg'

type Props = {
  stream: StreamCardData
  /** True for cards in the first row: they are the page's largest paint, so load eagerly. */
  priority?: boolean
}

export function StreamCard({ stream, priority = false }: Props) {
  // A recorded clip reads as a player: a centred play control, and no host
  // strip along the bottom. Only live cards carry the name and diamond total.
  const isVideo = stream.mode === 'VIDEO'

  return (
    <article className={`stream-card ${isVideo ? 'stream-card-video' : ''}`}>
      <Image
        src={stream.thumbnailUrl ?? FALLBACK_THUMB}
        alt={`${stream.host.displayName} live stream`}
        fill
        priority={priority}
        sizes="(max-width: 760px) 50vw, (max-width: 1180px) 33vw, 250px"
        className="stream-image"
      />

      <div className="stream-top">
        <span className="stream-viewers">
          <Eye size={16} fill="currentColor" strokeWidth={0} /> {stream.viewerCount}
        </span>
        {stream.mode === 'VERSUS' && (
          <>
            <span className="stream-divider" aria-hidden="true" />
            <span className="stream-versus">VS</span>
          </>
        )}
      </div>

      {isVideo ? (
        <span className="stream-play" aria-hidden="true">
          <Play size={26} fill="currentColor" strokeWidth={0} />
        </span>
      ) : (
        <div className="stream-info">
          <Image
            src={stream.host.avatarUrl ?? FALLBACK_AVATAR}
            alt=""
            width={48}
            height={48}
            className="stream-avatar"
          />
          <div className="stream-meta">
            <h2>{stream.host.displayName}</h2>
            <p>
              <Gem size={14} strokeWidth={2.2} /> {formatDiamonds(stream.diamondsTotal)}
            </p>
          </div>
        </div>
      )}
    </article>
  )
}
