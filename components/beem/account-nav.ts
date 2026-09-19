/**
 * The signed-in account menu, shared by the avatar dropdown and the mobile
 * drawer. Every entry has a page behind it; items without a backend yet say so
 * on their page rather than 404ing.
 */

export type AccountIcon =
  | 'following'
  | 'followers'
  | 'vault'
  | 'stats'
  | 'fans'
  | 'agency'
  | 'vip'
  | 'store'
  | 'help'
  | 'auction'
  | 'games'
  | 'support'
  | 'app'

export type AccountItem = {
  label: string
  href: string
  icon: AccountIcon
  /** Second line under the label, used for the app download entry. */
  description?: string
}

export type AccountSection = { title: string; items: AccountItem[] }

export const accountSections: AccountSection[] = [
  {
    title: 'Connections',
    items: [
      { label: 'Following', href: '/my-following', icon: 'following' },
      { label: 'Followers', href: '/my-followers', icon: 'followers' },
    ],
  },
  {
    title: 'Creator Tools',
    items: [
      { label: 'My Vault', href: '/vault', icon: 'vault' },
      { label: 'Statistics', href: '/statistics', icon: 'stats' },
      { label: 'My Fans', href: '/fans', icon: 'fans' },
    ],
  },
  {
    title: 'Special Programs',
    items: [
      { label: 'Agency Program', href: '/agency', icon: 'agency' },
      { label: 'VIP Loyalty', href: '/vip', icon: 'vip' },
      { label: 'MyVIP Store', href: '/store', icon: 'store' },
      { label: 'How to beem', href: '/help', icon: 'help' },
      { label: 'beem Cards Auction', href: '/auction', icon: 'auction' },
      { label: 'Games', href: '/games', icon: 'games' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Customer Support', href: '/support', icon: 'support' },
      {
        label: 'Get beem App',
        href: '/app',
        icon: 'app',
        description: 'Stay connected with your friends anywhere and anytime!',
      },
    ],
  },
]

/** 1234 -> "1.2K", 3700000 -> "3.7M". Matches the counts on stream cards. */
export function compactNumber(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return '0'
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}
