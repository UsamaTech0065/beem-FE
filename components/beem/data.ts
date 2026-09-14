/**
 * What remains of the original fixtures.
 *
 * Streams, creators and categories now come from the API. Only these two are
 * genuinely static: promos are marketing slots with no backend behind them,
 * and the nav is app structure rather than data.
 */

export type Promo = {
  eyebrow: string
  title: string
  action: string
  className: string
}

export const promos: Promo[] = [
  { eyebrow: 'beem temptation', title: 'Huge guaranteed prize!', action: 'Play', className: 'promo-purple' },
  { eyebrow: 'hot chilli bells', title: 'Guaranteed 3,000 coins', action: 'Get hot', className: 'promo-red' },
]

export type NavItem = {
  label: string
  icon: 'thumbs-up' | 'users' | 'search' | 'messages' | 'games'
  href: string
  /** Path prefix that counts as this item being active. Defaults to an exact match on href. */
  match?: string
}

export const navigationItems: NavItem[] = [
  { label: 'For You', icon: 'thumbs-up', href: '/' },
  { label: 'Following', icon: 'users', href: '/following' },
  { label: 'Explore', icon: 'search', href: '/live/nearby', match: '/live' },
  { label: 'Chats', icon: 'messages', href: '/chats' },
  { label: 'Games', icon: 'games', href: '/games' },
]

export function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.match) return pathname === item.match || pathname.startsWith(`${item.match}/`)
  return pathname === item.href
}

/** Feeds that span every live stream rather than filtering by genre. */
export const FEED_SLUGS = new Set(['nearby', 'new', 'popular'])
