/**
 * Placeholder conversations. There is no messaging API yet, so this is the one
 * screen still rendering fixtures — kept here rather than inline so it is
 * obvious what has to be replaced when the API lands.
 */
export type ChatItem = {
  name: string
  /** Rendered as HTML-free text; `previewLead` is bolded ahead of it. */
  preview: string
  /** Bold prefix for system messages, e.g. "Sent a" + bold "Content Pack". */
  previewBold?: string
  time: string
  avatar?: string
  initials?: string
  tone?: 'orange' | 'blue' | 'discount'
  unread?: string
  favorite?: boolean
}

export const chats: ChatItem[] = [
  { name: 'Banshee', preview: 'Sent a', previewBold: 'Content Pack', time: 'Thursday' },
  {
    name: 'beem Offers',
    preview: 'Unlock your welcome bundle before it…',
    time: 'Tuesday',
    initials: '%',
    tone: 'discount',
    unread: '23',
  },
  {
    name: 'Awanthika New session',
    preview: 'Jonny: Show on',
    time: '12:56',
    initials: 'AN',
    tone: 'orange',
    unread: '66',
  },
  {
    name: 'shakiyaaa',
    preview: 'Official sana 890: Show available',
    time: '11:13',
    initials: 'S',
    tone: 'blue',
    unread: '1',
  },
  {
    name: 'Birthday Girl',
    preview: 'How are you',
    time: 'Yesterday',
    avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=160&q=80',
  },
  {
    name: 'Nicol',
    preview: 'Hey my love, how are you',
    time: 'Tuesday',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    unread: '1',
    favorite: true,
  },
  {
    name: 'Roxan',
    preview: 'Thanks for supporting my LIVE!',
    time: 'Tuesday',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=80',
    unread: '1',
  },
  {
    name: 'Cleo Velvet',
    preview: 'im calling you now',
    time: 'Tuesday',
    avatar: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=160&q=80',
    favorite: true,
  },
]

/** Quick-send gifts under the composer, priced in coins. */
export type Gift = { id: string; emoji: string; coins: number }

export const gifts: Gift[] = [
  { id: 'heart', emoji: '❤️', coins: 8 },
  { id: 'cone', emoji: '🍦', coins: 39 },
  { id: 'berry', emoji: '🍓', coins: 59 },
  { id: 'rose', emoji: '🌹', coins: 99 },
  { id: 'call', emoji: '📹', coins: 79 },
  { id: 'hearts', emoji: '💕', coins: 199 },
  { id: 'fizz', emoji: '🍾', coins: 299 },
  { id: 'star', emoji: '⭐', coins: 799 },
  { id: 'parcel', emoji: '🎁', coins: 2999 },
]

/**
 * A single locked-media message. Real threads arrive with the messaging API;
 * this exists so the conversation pane has something truthful to lay out.
 */
export type LockedMedia = {
  kind: 'locked-media'
  label: string
  unlockCoins: number
  caption: string
  preview: string
}

export type ThreadMessage = LockedMedia

export const thread: ThreadMessage[] = [
  {
    kind: 'locked-media',
    label: '1 PIC',
    unlockCoins: 159,
    caption: "I couldn't wait to show you what I was wearing tonight",
    preview: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=600&q=60',
  },
]
