import { ChevronRight } from 'lucide-react'
import type { LiveFollowedEntry, StreamCard as StreamCardData } from '@/lib/api-types'
import { StoryCard } from './story-card'
import { StreamCard } from './stream-card'

/**
 * The rail of followed creators who are live right now. Renders nothing at all
 * when there is nobody to show: an empty heading above an empty strip reads as
 * a loading failure.
 */
export function FollowingSection({ entries }: { entries: LiveFollowedEntry[] }) {
  if (entries.length === 0) return null

  return (
    <section className="content-section" aria-labelledby="following-heading">
      <div className="section-heading">
        <div className="flex items-center gap-3">
          <h1 id="following-heading">You follow</h1>
          <span className="live-pill">LIVE</span>
        </div>
        <button className="circle-button" type="button" aria-label="See all followed creators">
          <ChevronRight size={22} />
        </button>
      </div>
      <div className="story-rail">
        {entries.map((entry) => (
          <StoryCard key={entry.stream.id} entry={entry} />
        ))}
      </div>
    </section>
  )
}

export function StreamGrid({
  streams,
  emptyMessage = 'No one is live right now.',
}: {
  streams: StreamCardData[]
  emptyMessage?: string
}) {
  if (streams.length === 0) {
    return <p className="feed-empty">{emptyMessage}</p>
  }

  return (
    <section className="live-grid" aria-label="Live streams">
      {streams.map((stream, index) => (
        // The grid is at most four across, so the first four are always above the fold.
        <StreamCard key={stream.id} stream={stream} priority={index < 4} />
      ))}
    </section>
  )
}
