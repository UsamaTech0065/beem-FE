import type { Category, Page, StreamCard } from './api-types'

/**
 * Stand-in content for when the API cannot be reached: a build with no
 * backend configured, the backend asleep, or a network failure. The feeds
 * fall back to these so the site still looks alive instead of empty.
 *
 * They mirror the API's seed (prisma/seed.ts in beem-backend), so a viewer
 * sees the same faces either way. Never used when the API answers, even if
 * it answers with nothing.
 */

export const demoCategories: Category[] = [
  { slug: 'nearby', name: 'Nearby' },
  { slug: 'new', name: 'New' },
  { slug: 'ai-creators', name: 'AI Creators' },
  { slug: 'audio', name: 'Audio' },
  { slug: 'artists', name: 'Artists' },
  { slug: 'popular', name: 'Popular' },
  { slug: 'gamers', name: 'Gamers' },
]

const photo = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`

type DemoCreator = {
  handle: string
  displayName: string
  image: string
  category: string
  title: string
  viewers: number
  diamonds: string
  mode: StreamCard['mode']
}

const CREATORS: DemoCreator[] = [
  { handle: 'ruby', displayName: 'Ruby', image: '1508214751196-bcfd4ca60f91', category: 'artists', title: 'Late night acoustic set', viewers: 15, diamonds: '3700000', mode: 'VERSUS' },
  { handle: 'venus_love', displayName: 'Venus_Love', image: '1529626455594-4ff0802cfb7e', category: 'ai-creators', title: 'Friday dance battle', viewers: 4, diamonds: '805500', mode: 'VERSUS' },
  { handle: 'madison', displayName: 'Madison', image: '1531123897727-8f129e1688ce', category: 'audio', title: 'Chatting and chilling', viewers: 7, diamonds: '2600000', mode: 'LIVE' },
  { handle: 'fancy_boar', displayName: 'Fancy Boar', image: '1561214115-f2f134cc4912', category: 'artists', title: 'Painting commissions live', viewers: 1, diamonds: '11700', mode: 'LIVE' },
  { handle: 'mony_black', displayName: 'MoNy BlAck', image: '1494790108377-be9c29b29330', category: 'gamers', title: 'Q&A with the crew', viewers: 10, diamonds: '1200000', mode: 'VERSUS' },
  { handle: 'lunitta', displayName: 'Lunitta', image: '1515886657613-9f3515b0c78f', category: 'artists', title: 'Requests hour', viewers: 10, diamonds: '2100000', mode: 'LIVE' },
  { handle: 'vibras', displayName: "Vibra's", image: '1488426862026-3ee34a7d66df', category: 'ai-creators', title: 'Choreo practice', viewers: 30, diamonds: '988000', mode: 'VERSUS' },
  { handle: 'paola', displayName: 'Paola', image: '1524504388940-b1c1722653e1', category: 'audio', title: 'Cooking something new', viewers: 6, diamonds: '1600000', mode: 'LIVE' },
  { handle: 'lina', displayName: 'Lina', image: '1534528741775-53994a69daeb', category: 'ai-creators', title: 'First stream, say hi', viewers: 1, diamonds: '4200', mode: 'VIDEO' },
  { handle: 'sofia', displayName: 'Sofia', image: '1506794778202-cad84cf45f1d', category: 'gamers', title: 'Ranked climb', viewers: 12, diamonds: '640000', mode: 'LIVE' },
  { handle: 'cleo_velvet', displayName: 'Cleo Velvet', image: '1524250502761-1ac6f2e30d43', category: 'audio', title: 'Audio only, wind down', viewers: 8, diamonds: '320000', mode: 'LIVE' },
  { handle: 'ebonyfire', displayName: 'EbonyFire', image: '1517841905240-472988babdf9', category: 'gamers', title: 'Big gift goals tonight', viewers: 22, diamonds: '5100000', mode: 'VERSUS' },
]

const STARTED_AT = new Date().toISOString()

export const demoStreams: StreamCard[] = CREATORS.map((creator) => ({
  id: `demo-${creator.handle}`,
  title: creator.title,
  mode: creator.mode,
  viewerCount: creator.viewers,
  diamondsTotal: creator.diamonds,
  thumbnailUrl: photo(creator.image),
  startedAt: STARTED_AT,
  category: demoCategories.find((category) => category.slug === creator.category) ?? null,
  host: {
    id: `demo-${creator.handle}`,
    handle: creator.handle,
    displayName: creator.displayName,
    avatarUrl: photo(creator.image, 160),
  },
}))

/** Mirrors GET /streams/live: optional genre filter, capped at `limit`. */
export function demoLivePage(options: { category?: string; limit?: number } = {}): Page<StreamCard> {
  const filtered = options.category
    ? demoStreams.filter((stream) => stream.category?.slug === options.category)
    : demoStreams
  return { items: filtered.slice(0, options.limit ?? filtered.length), nextCursor: null }
}
