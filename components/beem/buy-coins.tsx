'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Lock, X } from 'lucide-react'
import type { CoinPack } from '@/lib/api-types'
import { CoinIcon } from './icons'

const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

type Step = 'packs' | 'pay' | 'done'

/**
 * The buy-coins drawer, sliding in from the right (Tango-style). Picks a pack,
 * then pays: instantly in mock mode, or with clean Stripe card fields (number /
 * expiry / CVC only — no Link, no account signup) when a key is configured.
 */
export function BuyCoins({ open, onClose, signedIn }: { open: boolean; onClose: () => void; signedIn: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('packs')
  const [packs, setPacks] = useState<CoinPack[] | null>(null)
  const [selected, setSelected] = useState<CoinPack | null>(null)
  const [busy, setBusy] = useState(false)
  const [cardReady, setCardReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stripeRef = useRef<StripeLike | null>(null)
  const cardRef = useRef<StripeElement | null>(null)
  const clientSecretRef = useRef<string | null>(null)
  const numberElRef = useRef<HTMLDivElement | null>(null)
  const expiryElRef = useRef<HTMLDivElement | null>(null)
  const cvcElRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open || !signedIn || packs) return
    fetch('/api/wallet/packs')
      .then((response) => (response.ok ? (response.json() as Promise<CoinPack[]>) : []))
      .then(setPacks)
      .catch(() => setPacks([]))
  }, [open, signedIn, packs])

  useEffect(() => {
    if (open) return
    setStep('packs')
    setSelected(null)
    setError(null)
    setBusy(false)
    setCardReady(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Stripe mode: mount the split card fields and fetch the client secret.
  useEffect(() => {
    if (step !== 'pay' || !STRIPE_PK || !selected) return
    let cancelled = false
    ;(async () => {
      setError(null)
      setCardReady(false)
      const stripe = await loadStripe(STRIPE_PK as string)
      if (!stripe || cancelled) return setError('Could not load the payment form.')
      stripeRef.current = stripe

      const response = await fetch('/api/wallet/payment-intent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ packId: selected.id }),
      }).catch(() => null)
      if (!response?.ok || cancelled) return setError('Could not start the payment.')
      clientSecretRef.current = ((await response.json()) as { clientSecret: string }).clientSecret

      const style = {
        base: { fontSize: '16px', color: '#17171c', '::placeholder': { color: '#a3a3ab' } },
        invalid: { color: '#e24b4a' },
      }
      const elements = stripe.elements()
      const number = elements.create('cardNumber', { style, showIcon: true })
      const expiry = elements.create('cardExpiry', { style })
      const cvc = elements.create('cardCvc', { style })
      if (cancelled) return
      if (numberElRef.current) number.mount(numberElRef.current)
      if (expiryElRef.current) expiry.mount(expiryElRef.current)
      if (cvcElRef.current) cvc.mount(cvcElRef.current)
      cardRef.current = number
      setCardReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [step, selected])

  if (!open) return null

  async function pay() {
    if (!selected) return
    setBusy(true)
    setError(null)

    if (!STRIPE_PK) {
      const response = await fetch('/api/wallet/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ packId: selected.id }),
      }).catch(() => null)
      setBusy(false)
      if (!response?.ok) {
        const body = await response?.json().catch(() => ({ message: 'Purchase failed.' }))
        return setError(body?.message ?? 'Purchase failed.')
      }
      setStep('done')
      router.refresh()
      return
    }

    const stripe = stripeRef.current
    const card = cardRef.current
    const clientSecret = clientSecretRef.current
    if (!stripe || !card || !clientSecret) {
      setBusy(false)
      return setError('Payment form is not ready yet.')
    }
    const { error: payError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    })
    setBusy(false)
    if (payError) return setError(payError.message ?? 'Payment failed.')
    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      setStep('done')
      router.refresh()
    }
  }

  return (
    <div className="coins-drawer-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="coins-drawer" role="dialog" aria-modal="true" aria-label="Buy coins">
        {step === 'packs' && (
          <>
            <header className="coins-drawer-head">
              <span />
              <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
                <X size={22} />
              </button>
            </header>
            <h2 className="coins-drawer-title">Welcome Bonus for You!</h2>

            {!signedIn ? (
              <p className="coins-drawer-msg">Sign in to buy coins.</p>
            ) : packs === null ? (
              <div className="coins-drawer-loading">
                <Loader2 className="auth-spin" size={22} />
              </div>
            ) : (
              <ul className="coins-grid">
                {packs.map((pack) => (
                  <li key={pack.id}>
                    <button
                      type="button"
                      className="coins-tile"
                      onClick={() => {
                        setSelected(pack)
                        setStep('pay')
                      }}
                    >
                      {pack.tag && <span className="coins-tile-tag">{pack.tag}</span>}
                      <span className="coins-tile-amount">
                        <CoinIcon size={18} /> {pack.total.toLocaleString()}
                      </span>
                      {pack.bonus > 0 && <span className="coins-tile-bonus">{percentMore(pack)}% More</span>}
                      <span className="coins-tile-price">{formatPrice(pack)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {step === 'pay' && selected && (
          <>
            <header className="coins-drawer-head">
              <button type="button" className="auth-close" onClick={() => setStep('packs')} aria-label="Back">
                <ArrowLeft size={22} />
              </button>
              <strong className="coins-drawer-heading">Checkout</strong>
              <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
                <X size={22} />
              </button>
            </header>

            <div className="coins-checkout-item">
              <span className="coins-tile-amount">
                <CoinIcon size={20} /> {selected.total.toLocaleString()}
              </span>
              <span className="coins-checkout-price">{formatPrice(selected)}</span>
            </div>

            {STRIPE_PK ? (
              <div className="card-form">
                <label className="card-label">Card number</label>
                <div ref={numberElRef} className="stripe-field" />
                <div className="card-row">
                  <div>
                    <label className="card-label">Expiry</label>
                    <div ref={expiryElRef} className="stripe-field" />
                  </div>
                  <div>
                    <label className="card-label">CVC</label>
                    <div ref={cvcElRef} className="stripe-field" />
                  </div>
                </div>
                {!cardReady && !error && (
                  <div className="coins-drawer-loading">
                    <Loader2 className="auth-spin" size={20} />
                  </div>
                )}
              </div>
            ) : (
              <p className="coins-mock-note">
                <Lock size={14} /> Test mode — no real card is charged.
              </p>
            )}

            {error && <p className="auth-error">{error}</p>}

            <button
              type="button"
              className="coins-pay"
              onClick={pay}
              disabled={busy || (Boolean(STRIPE_PK) && !cardReady)}
            >
              {busy ? <Loader2 className="auth-spin" size={18} /> : `Pay ${formatPrice(selected)}`}
            </button>

            <div className="coins-cards" aria-hidden="true">
              <span>VISA</span>
              <span>MC</span>
              <span>AMEX</span>
              <span className="coins-secure">
                <Lock size={11} /> Secure
              </span>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <header className="coins-drawer-head">
              <span />
              <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
                <X size={22} />
              </button>
            </header>
            <div className="coins-done2">
              <CoinIcon size={44} />
              <p>Coins added to your balance!</p>
              <button type="button" className="coins-pay" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

function percentMore(pack: CoinPack): number {
  return pack.coins > 0 ? Math.round((pack.bonus / pack.coins) * 100) : 0
}

function formatPrice(pack: CoinPack): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: pack.currency.toUpperCase() }).format(
    pack.amountCents / 100,
  )
}

// --- Stripe.js loaded on demand (no npm dependency) ---
type StripeElement = { mount(el: HTMLElement): void }
type StripeElementsApi = { create(type: string, options?: unknown): StripeElement }
type StripeLike = {
  elements(options?: { clientSecret?: string; appearance?: unknown }): StripeElementsApi
  confirmCardPayment(
    clientSecret: string,
    data: { payment_method: { card: StripeElement } },
  ): Promise<{ error?: { message?: string }; paymentIntent?: { status?: string } }>
}

let scriptPromise: Promise<void> | null = null

async function loadStripe(pk: string): Promise<StripeLike | null> {
  const w = window as unknown as { Stripe?: (key: string) => StripeLike }
  if (!w.Stripe) {
    if (!scriptPromise) {
      scriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://js.stripe.com/v3/'
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('stripe.js failed to load'))
        document.head.appendChild(script)
      })
    }
    try {
      await scriptPromise
    } catch {
      return null
    }
  }
  return w.Stripe ? w.Stripe(pk) : null
}
