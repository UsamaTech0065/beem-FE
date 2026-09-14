import Image from 'next/image'
import { Eye, Play } from 'lucide-react'
import type { LiveFollowedEntry } from '@/lib/api-types'

const FALLBACK_THUMB = '/placeholder.jpg'
const FALLBACK_AVATAR = '/placeholder-user.jpg'

export function StoryCard({ entry }: { entry: LiveFollowedEntry }) {
  const { host, stream } = entry

  return (
    <article className="story-card">
      <Image
        src={stream.thumbnailUrl ?? FALLBACK_THUMB}
        alt={`${host.displayName} live story`}
        fill
        sizes="184px"
        className="object-cover"
      />
      <div className="story-card-top">
        <span>
          <Eye size={18} fill="currentColor" /> {stream.viewerCount}
        </span>
        {stream.mode === 'VIDEO' ? <Play size={19} fill="currentColor" /> : null}
      </div>
      <div className="story-avatar-wrap">
        <Image
          src={host.avatarUrl ?? FALLBACK_AVATAR}
          alt={`${host.displayName} profile`}
          width={48}
          height={48}
          className="story-avatar"
        />
      </div>
    </article>
  )
}
