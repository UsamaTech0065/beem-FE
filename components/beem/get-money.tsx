'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { ExternalLink, Loader2, Pencil, Plus, Video } from 'lucide-react'
import { CoinIcon } from './icons'
import type { PayoutMethod, PayoutMethodType, PayoutSummary } from '@/lib/api-types'

const METHOD_LABEL: Record<PayoutMethodType, string> = { STRIPE: 'Stripe', PAYPAL: 'PayPal', BANK: 'Bank transfer', CARD: 'Visa / Mastercard' }

const dollars = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`
const dateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

const STATUS_LABEL = { REQUESTED: 'Processing', PAID: 'Paid', REJECTED: 'Returned' } as const

async function loadSummary(): Promise<PayoutSummary | null> {
  return fetch('/api/payouts').then((r) => (r.ok ? (r.json() as Promise<PayoutSummary>) : null)).catch(() => null)
}

/** The Get Money page: progress to the minimum, the withdrawal method, and past payouts. */
export function GetMoney({ initial }: { initial: PayoutSummary }) {
  const router = useRouter()
  const params = useSearchParams()
  const [summary, setSummary] = useState(initial)
  const [methodOpen, setMethodOpen] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const { coins, money } = summary
  const ready = coins.available >= coins.minimum
  const progress = Math.min(1, coins.available / coins.minimum)
  const missing = Math.max(0, coins.minimum - coins.available)
  const open = summary.payouts.find((payout) => payout.status === 'REQUESTED')
  const stripePending = summary.method?.type === 'STRIPE' && summary.method.stripeReady === false
  // A method saved when it was still offered (say PayPal) has to be replaced first.
  const methodRetired = Boolean(summary.method) && !summary.methods.includes(summary.method!.type)
  const canWithdraw = Boolean(summary.method) && !stripePending && !methodRetired

  // Back from Stripe's onboarding page: ask the API whether it was completed.
  const stripeReturn = params.get('stripe')
  useEffect(() => {
    if (!stripeReturn) return
    ;(async () => {
      const response = await fetch('/api/payouts/stripe/sync', { method: 'POST' }).catch(() => null)
      const method = response?.ok ? ((await response.json().catch(() => null)) as PayoutMethod | null) : null
      if (method) {
        setSummary((current) => ({ ...current, method }))
        setToast(method.stripeReady ? 'Stripe is set up. You can withdraw to it now.' : 'Stripe still needs a few details. Open it again to finish.')
      }
      router.replace('/get-money')
    })()
  }, [stripeReturn, router])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  async function withdraw() {
    setWithdrawing(true)
    const response = await fetch('/api/payouts', { method: 'POST' }).catch(() => null)
    const body = (await response?.json().catch(() => null)) as { message?: string; amountCents?: number; status?: string; note?: string } | null
    setWithdrawing(false)
    if (!response?.ok) return setToast(body?.message ?? 'Could not request the withdrawal. Try again.')
    if (body?.status === 'PAID') setToast(`${dollars(body.amountCents ?? 0)} sent to Stripe. It reaches your bank on Stripe's schedule.`)
    else if (body?.status === 'REJECTED') setToast(body.note ?? 'Stripe refused the transfer. Your coins are back in your balance.')
    else setToast(`Withdrawal of ${dollars(body?.amountCents ?? 0)} requested.`)
    const fresh = await loadSummary()
    if (fresh) setSummary(fresh)
  }

  async function openStripeDashboard() {
    const response = await fetch('/api/payouts/stripe/dashboard').catch(() => null)
    const body = (await response?.json().catch(() => null)) as { url?: string; message?: string } | null
    if (body?.url) window.open(body.url, '_blank', 'noopener')
    else setToast(body?.message ?? 'Could not open Stripe.')
  }

  return (
    <main className="fp money">
      <h1 className="money-title">Get Money</h1>

      <section className="money-card">
        {open ? (
          <>
            <strong>Withdrawal in progress</strong>
            <span className="money-sub">
              <CoinIcon size={13} /> {open.coins.toLocaleString()} coins on their way to {open.method}
            </span>
            <b className="money-amount">{dollars(open.amountCents)}</b>
            <span className="money-sub">Sent to your {open.method.startsWith('PayPal') ? 'PayPal' : open.method.startsWith('Stripe') ? 'Stripe account' : /^(Visa|Mastercard|Card)/.test(open.method) ? 'card' : 'bank account'} within 7 days.</span>
          </>
        ) : ready ? (
          <>
            <strong>Ready to withdraw</strong>
            <span className="money-sub">
              <CoinIcon size={13} /> {coins.available.toLocaleString()} coins available
            </span>
            <b className="money-amount">{dollars(money.availableCents)}</b>
            <button type="button" className="money-withdraw" onClick={withdraw} disabled={withdrawing || !canWithdraw}>
              {withdrawing ? <Loader2 size={18} className="auth-spin" /> : 'Withdraw'}
            </button>
            {!summary.method && <span className="money-sub">Add a withdrawal method below first.</span>}
            {stripePending && <span className="money-sub">Finish setting up Stripe below first.</span>}
            {methodRetired && <span className="money-sub">That withdrawal method is no longer offered. Update it below first.</span>}
          </>
        ) : (
          <>
            <strong>Great job!</strong>
            <span className="money-sub">
              Only <CoinIcon size={13} /> {missing.toLocaleString()} left to get
            </span>
            <b className="money-amount">{dollars(money.minimumCents)}</b>
            <span className="money-bar" role="progressbar" aria-valuemin={0} aria-valuemax={coins.minimum} aria-valuenow={coins.available}>
              <i style={{ width: `${Math.max(2, progress * 100)}%` }} />
            </span>
          </>
        )}
        {coins.pending > 0 && (
          <span className="money-pending">
            <CoinIcon size={12} /> {coins.pending.toLocaleString()} more become available {money.holdDays} days after they were received
          </span>
        )}
      </section>

      <div className="money-method-row">
        <button type="button" className="money-method" onClick={() => setMethodOpen(true)}>
          {summary.method ? (
            <>
              <Pencil size={16} strokeWidth={2.2} /> {summary.method.label}
            </>
          ) : (
            <>
              <Plus size={18} strokeWidth={2.2} /> Add withdrawal method
            </>
          )}
        </button>
        {summary.method?.type === 'STRIPE' && summary.method.stripeReady && (
          <button type="button" className="money-method" onClick={openStripeDashboard}>
            <ExternalLink size={16} strokeWidth={2.2} /> Stripe dashboard
          </button>
        )}
      </div>

      <Link href="/go-live" className="money-golive">
        <Video size={20} strokeWidth={2} /> Go Live
      </Link>

      <dl className="money-stats">
        <div>
          <dt>{coins.earned.toLocaleString()}</dt>
          <dd>Earned</dd>
        </div>
        <div>
          <dt>{coins.withdrawn.toLocaleString()}</dt>
          <dd>Withdrawn</dd>
        </div>
        <div>
          <dt>{dollars(money.centsPer1000Coins)}</dt>
          <dd>per 1,000 coins</dd>
        </div>
      </dl>

      {summary.payouts.length > 0 && (
        <section className="money-history">
          <h2>Withdrawals</h2>
          <ul>
            {summary.payouts.map((payout) => (
              <li key={payout.id}>
                <div>
                  <strong>{dollars(payout.amountCents)}</strong>
                  <small>
                    {payout.coins.toLocaleString()} coins &middot; {payout.method} &middot; {dateFormat.format(new Date(payout.createdAt))}
                  </small>
                  {payout.note && <small>{payout.note}</small>}
                </div>
                <span className={`money-status is-${payout.status.toLowerCase()}`}>{STATUS_LABEL[payout.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {toast && (
        <div className="profile-toast" role="status">
          {toast}
        </div>
      )}
      {methodOpen && (
        <MethodDialog
          current={summary.method}
          methods={summary.methods}
          onClose={() => setMethodOpen(false)}
          onSaved={(method) => {
            setSummary((current) => ({ ...current, method }))
            setMethodOpen(false)
            setToast('Withdrawal method saved.')
          }}
          onError={setToast}
        />
      )}
    </main>
  )
}

type MethodType = PayoutMethodType
type DialogProps = {
  current: PayoutMethod | null
  /** What this deployment offers, in order; the first is the default. */
  methods: PayoutMethodType[]
  onClose: () => void
  onSaved: (method: PayoutMethod) => void
  onError: (message: string) => void
}

/** Digits only, in groups of four, at most 19 digits. */
function formatCard(value: string): string {
  return value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
}

function MethodDialog({ current, methods, onClose, onSaved, onError }: DialogProps) {
  const [type, setType] = useState<MethodType>(current && methods.includes(current.type) ? current.type : (methods[0] ?? 'BANK'))
  const [paypalEmail, setPaypalEmail] = useState(current?.paypalEmail ?? '')
  const [accountName, setAccountName] = useState(current?.accountName ?? '')
  const [bankName, setBankName] = useState(current?.bankName ?? '')
  const [accountNumber, setAccountNumber] = useState('')
  const [country, setCountry] = useState(current?.country ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const digits = accountNumber.replace(/\s+/g, '')
  const keepsSaved = !accountNumber && current?.type === type && Boolean(current?.accountLast4)
  const canSave =
    !busy &&
    (type === 'PAYPAL'
      ? paypalEmail.includes('@')
      : type === 'STRIPE'
        ? country.trim().length === 2
        : type === 'CARD'
          ? Boolean(accountName.trim()) && (/^\d{13,19}$/.test(digits) || keepsSaved) && country.trim().length === 2
          : Boolean(accountName.trim() && bankName.trim()) && (digits.length >= 6 || keepsSaved) && country.trim().length === 2)

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    if (type === 'STRIPE') {
      // Stripe collects the details itself on its hosted page; we only start it.
      const response = await fetch('/api/payouts/stripe/onboard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ country }),
      }).catch(() => null)
      const payload = (await response?.json().catch(() => null)) as { url?: string; message?: string } | null
      if (!response?.ok || !payload?.url) {
        setBusy(false)
        return setError(payload?.message ?? 'Could not start Stripe setup. Try again.')
      }
      window.location.assign(payload.url)
      return
    }

    const body =
      type === 'PAYPAL'
        ? { type, paypalEmail }
        : { type, accountName, ...(bankName.trim() ? { bankName } : {}), ...(digits ? { accountNumber: digits } : {}), country }
    const response = await fetch('/api/payouts/method', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null)
    const payload = (await response?.json().catch(() => null)) as (PayoutMethod & { message?: string }) | null
    setBusy(false)
    if (!response?.ok || !payload) {
      const message = payload?.message ?? 'Could not save. Try again.'
      setError(message)
      return onError(message)
    }
    onSaved(payload)
  }

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true" aria-labelledby="method-title">
      <form className="fp-modal money-dialog" onSubmit={save}>
        <h2 id="method-title">Withdrawal method</h2>

        {methods.length > 1 && (
          <div className="money-types" role="radiogroup" aria-label="Method">
            {methods.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={type === option} className={type === option ? 'is-active' : ''} onClick={() => setType(option)}>
                {METHOD_LABEL[option]}
              </button>
            ))}
          </div>
        )}

        {type === 'STRIPE' ? (
          <>
            <p className="money-note">
              {current?.type === 'STRIPE' && current.stripeReady
                ? 'Your Stripe account is set up. Continue to update your details.'
                : 'Stripe verifies your identity and bank details on its own secure page, then pays you directly. Takes about five minutes.'}
            </p>
            <label className="fp-field">
              <span>Your country (2 letters)</span>
              <input value={country} onChange={(event) => setCountry(event.target.value.toUpperCase().slice(0, 2))} placeholder="GB" autoFocus />
            </label>
          </>
        ) : type === 'PAYPAL' ? (
          <label className="fp-field">
            <span>PayPal email</span>
            <input type="email" value={paypalEmail} onChange={(event) => setPaypalEmail(event.target.value)} placeholder="you@example.com" autoFocus />
          </label>
        ) : type === 'CARD' ? (
          <>
            <p className="money-note">We send the money straight to your Visa or Mastercard. It usually arrives within 1 to 3 business days.</p>
            <label className="fp-field">
              <span>Name on card</span>
              <input value={accountName} onChange={(event) => setAccountName(event.target.value)} autoComplete="cc-name" autoFocus />
            </label>
            <label className="fp-field">
              <span>Card number</span>
              <input
                inputMode="numeric"
                autoComplete="cc-number"
                value={accountNumber}
                onChange={(event) => setAccountNumber(formatCard(event.target.value))}
                placeholder={current?.type === 'CARD' && current.accountLast4 ? `Ends in ${current.accountLast4}` : '4242 4242 4242 4242'}
                spellCheck={false}
              />
            </label>
            <label className="fp-field">
              <span>Issuing bank (optional)</span>
              <input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="HBL, Meezan, Barclays..." />
            </label>
            <label className="fp-field">
              <span>Card country (2 letters)</span>
              <input value={country} onChange={(event) => setCountry(event.target.value.toUpperCase().slice(0, 2))} placeholder="PK" />
            </label>
          </>
        ) : (
          <>
            <label className="fp-field">
              <span>Account holder name</span>
              <input value={accountName} onChange={(event) => setAccountName(event.target.value)} autoFocus />
            </label>
            <label className="fp-field">
              <span>Bank name</span>
              <input value={bankName} onChange={(event) => setBankName(event.target.value)} />
            </label>
            <label className="fp-field">
              <span>IBAN or account number</span>
              <input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} placeholder={current?.type === 'BANK' && current.accountLast4 ? `Ends in ${current.accountLast4}` : ''} spellCheck={false} />
            </label>
            <label className="fp-field">
              <span>Bank country (2 letters)</span>
              <input value={country} onChange={(event) => setCountry(event.target.value.toUpperCase().slice(0, 2))} placeholder="GB" />
            </label>
          </>
        )}

        {error && (
          <p className="fp-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="fp-modal-set" disabled={!canSave}>
          {busy ? <Loader2 size={18} className="auth-spin" /> : type === 'STRIPE' ? 'Continue to Stripe' : 'Save'}
        </button>
        <button type="button" className="fp-modal-cancel" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  )
}
