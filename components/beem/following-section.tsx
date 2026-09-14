import { ChevronRight } from 'lucide-react'
import type { LiveFollowedEntry, StreamCard as StreamCardData } from '@/lib/api-types'
import { promos } from './data'
import { StoryCard } from './story-card'
import { PromoBanner } from './promo-banner'
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

/** Static marketing slots. These have no API behind them yet. */
export function PromoBanners() {
  return (
    <div className="promo-grid" aria-label="Featured games">
      {promos.map((promo) => (
        <PromoBanner key={promo.title} promo={promo} />
      ))}
    </div>
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
      {streams.map((stream) => (
        <StreamCard key={stream.id} stream={stream} />
      ))}
    </section>
  )
}
