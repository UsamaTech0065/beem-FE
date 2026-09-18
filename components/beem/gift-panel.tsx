'use client'

import { Plus, X } from 'lucide-react'
import { compactNumber } from './account-nav'
import { CoinIcon } from './icons'

/**
 * The catalogue is static until the coin ledger exists. Prices mirror the
 * reference so the layout is real; sending is what is still to come.
 */
export type GiftItem = { name: string; emoji: string; coins: number; free?: boolean }

export const GIFTS: GiftItem[] = [
  { name: 'Heart', emoji: '❤️', coins: 8, free: true },
  { name: 'Ice cream', emoji: '🍦', coins: 39 },
  { name: 'Strawberry', emoji: '🍓', coins: 59 },
  { name: 'Kiss', emoji: '💋', coins: 79 },
  { name: 'Rose', emoji: '🌹', coins: 99 },
  { name: 'Ring', emoji: '💍', coins: 79 },
  { name: 'Hearts', emoji: '💕', coins: 199 },
  { name: 'Champagne', emoji: '🍾', coins: 299 },
  { name: 'Teddy', emoji: '🧸', coins: 99 },
  { name: 'Crown', emoji: '👑', coins: 399 },
  { name: 'Sports car', emoji: '🏎️', coins: 799 },
  { name: 'Rocket', emoji: '🚀', coins: 999 },
  { name: 'Diamond', emoji: '💎', coins: 1_499 },
  { name: 'Castle', emoji: '🏰', coins: 2_999 },
  { name: 'Yacht', emoji: '🛥️', coins: 5_999 },
  { name: 'Unicorn', emoji: '🦄', coins: 229 },
]

type Props = {
  balance: number
  onClose: () => void
  onPick: (gift: { name: string; coins: number }) => void
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
          <button type="button" className="gifts-add" aria-label="Add coins" disabled title="Coins are coming soon">
            <Plus size={14} />
          </button>
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
            key={gift.name}
            className="gift"
            onClick={() => onPick(gift)}
            aria-label={`${gift.name}, ${gift.coins} coins`}
          >
            {gift.free && <span className="gift-free">Free</span>}
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
