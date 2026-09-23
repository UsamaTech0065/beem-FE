/** App structure, not content: the primary nav and which /live slugs are feeds. */

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
