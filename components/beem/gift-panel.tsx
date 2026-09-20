'use client'

import Link from 'next/link'
import { Plus, X } from 'lucide-react'
import { compactNumber } from './account-nav'
import { CoinIcon } from './icons'

/** Ids and prices mirror the server catalogue (beem-backend gift-catalog.ts). */
export type GiftItem = { id: string; name: string; emoji: string; coins: number }

export const GIFTS: GiftItem[] = [
  { id: 'heart', name: 'Heart', emoji: '❤️', coins: 8 },
  { id: 'ice-cream', name: 'Ice cream', emoji: '🍦', coins: 39 },
  { id: 'strawberry', name: 'Strawberry', emoji: '🍓', coins: 59 },
  { id: 'kiss', name: 'Kiss', emoji: '💋', coins: 79 },
  { id: 'ring', name: 'Ring', emoji: '💍', coins: 79 },
  { id: 'rose', name: 'Rose', emoji: '🌹', coins: 99 },
  { id: 'teddy', name: 'Teddy', emoji: '🧸', coins: 99 },
  { id: 'hearts', name: 'Hearts', emoji: '💕', coins: 199 },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', coins: 229 },
  { id: 'champagne', name: 'Champagne', emoji: '🍾', coins: 299 },
  { id: 'crown', name: 'Crown', emoji: '👑', coins: 399 },
  { id: 'sports-car', name: 'Sports car', emoji: '🏎️', coins: 799 },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', coins: 999 },
  { id: 'diamond', name: 'Diamond', emoji: '💎', coins: 1_499 },
  { id: 'castle', name: 'Castle', emoji: '🏰', coins: 2_999 },
  { id: 'yacht', name: 'Yacht', emoji: '🛥️', coins: 5_999 },
]

type Props = {
  balance: number
  onClose: () => void
  onPick: (gift: GiftItem) => void
}

export function GiftPanel({ balance, onClose, onPick }: Props) {
  return (
    <aside className="gifts" aria-label="Gifts">
      <header className="gifts-top">
        <button type="button" className="gifts-create" disabled title="Custom gifts are coming soon">
          <Plus size={16} /> Create
        </button>
        <span className="gifts-balance">
          <CoinIcon /> {compactNumber(balance)}
          <Link href="/wallet" className="gifts-add" aria-label="Add coins">
            <Plus size={14} />
          </Link>
        </span>
        <button type="button" className="live-round live-round--sm" onClick={onClose} aria-label="Close gifts">
          <X size={18} />
        </button>
      </header>

      <p className="gifts-category">Classic</p>
      <div className="gifts-grid">
        {GIFTS.map((gift) => (
          <button
            type="button"
            key={gift.id}
            className="gift"
            onClick={() => onPick(gift)}
            aria-label={`${gift.name}, ${gift.coins} coins`}
          >
            <span className="gift-emoji" aria-hidden="true">
              {gift.emoji}
            </span>
            <span className="gift-price">
              <CoinIcon /> {compactNumber(gift.coins)}
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}
