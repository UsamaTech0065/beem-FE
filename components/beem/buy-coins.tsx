'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import type { CoinPack } from '@/lib/api-types'
import { CoinIcon } from './icons'

/** Opens a sheet of coin packs and runs a purchase (instant in dev, Stripe in prod). */
export function BuyCoins({ packs, signedIn }: { packs: CoinPack[]; signedIn: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!signedIn) {
    return (
      <button type="button" className="wallet-buy" disabled>
        Sign in to buy coins
      </button>
    )
  }

  async function buy(pack: CoinPack) {
    setBusyId(pack.id)
    setError(null)
    const response = await fetch('/api/wallet/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ packId: pack.id }),
    }).catch(() => null)

    if (!response?.ok) {
      const body = await response?.json().catch(() => ({ message: 'Purchase failed.' }))
      setBusyId(null)
      setError(body?.message ?? 'Purchase failed. Try again.')
      return
    }

    const data = (await response.json()) as { status: 'paid' | 'redirect'; url?: string }
    if (data.status === 'redirect' && data.url) {
      // Off to the hosted payment page; the webhook credits on return.
      window.location.href = data.url
      return
    }
    setBusyId(null)
    setDone(true)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        className="wallet-buy"
        onClick={() => {
          setOpen(true)
          setDone(false)
          setError(null)
        }}
      >
        Buy coins
      </button>

      {open && (
        <div
          className="auth-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Buy coins"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <div className="coins-modal">
            <button type="button" className="auth-close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={22} />
            </button>
            <h2>Get coins</h2>

            {done ? (
              <p className="coins-done">Coins added to your balance 🎉</p>
            ) : (
              <ul className="coins-packs">
                {packs.map((pack) => (
                  <li key={pack.id}>
                    <button type="button" className="coins-pack" onClick={() => buy(pack)} disabled={busyId !== null}>
                      {pack.tag && <span className="coins-pack-tag">{pack.tag}</span>}
                      <span className="coins-pack-amount">
                        <CoinIcon size={22} /> {pack.total.toLocaleString()}
                      </span>
                      {pack.bonus > 0 && <span className="coins-pack-bonus">incl. {pack.bonus.toLocaleString()} bonus</span>}
                      <span className="coins-pack-price">
                        {busyId === pack.id ? <Loader2 className="auth-spin" size={16} /> : formatPrice(pack)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {error && <p className="auth-error">{error}</p>}
          </div>
        </div>
      )}
    </>
  )
}

function formatPrice(pack: CoinPack): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency: pack.currency.toUpperCase() }).format(
    pack.amountCents / 100,
  )
}
