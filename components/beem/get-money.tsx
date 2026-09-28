'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Gem, Loader2, Pencil, Plus, Video } from 'lucide-react'
import type { PayoutMethod, PayoutSummary } from '@/lib/api-types'

const dollars = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`
const dateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

const STATUS_LABEL = { REQUESTED: 'Processing', PAID: 'Paid', REJECTED: 'Returned' } as const

/** The Get Money page: progress to the minimum, the withdrawal method, and past payouts. */
export function GetMoney({ initial }: { initial: PayoutSummary }) {
  const router = useRouter()
  const [summary, setSummary] = useState(initial)
  const [methodOpen, setMethodOpen] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const { diamonds, money } = summary
  const ready = diamonds.available >= diamonds.minimum
  const progress = Math.min(1, diamonds.available / diamonds.minimum)
  const missing = Math.max(0, diamonds.minimum - diamonds.available)
  const open = summary.payouts.find((payout) => payout.status === 'REQUESTED')

  async function withdraw() {
    setWithdrawing(true)
    const response = await fetch('/api/payouts', { method: 'POST' }).catch(() => null)
    const body = (await response?.json().catch(() => null)) as { message?: string; amountCents?: number } | null
    setWithdrawing(false)
    if (!response?.ok) return setToast(body?.message ?? 'Could not request the withdrawal. Try again.')
    setToast(`Withdrawal of ${dollars(body?.amountCents ?? 0)} requested.`)
    router.refresh()
    const fresh = await fetch('/api/payouts').then((r) => (r.ok ? (r.json() as Promise<PayoutSummary>) : null)).catch(() => null)
    if (fresh) setSummary(fresh)
  }

  return (
    <main className="fp money">
      <h1 className="money-title">Get Money</h1>

      <section className="money-card">
        {open ? (
          <>
            <strong>Withdrawal in progress</strong>
            <span className="money-sub">
              <Gem size={13} strokeWidth={2.2} /> {open.diamonds.toLocaleString()} diamonds on their way to {open.method}
            </span>
            <b className="money-amount">{dollars(open.amountCents)}</b>
            <span className="money-sub">Payouts are sent within 7 days.</span>
          </>
        ) : ready ? (
          <>
            <strong>Ready to withdraw</strong>
            <span className="money-sub">
              <Gem size={13} strokeWidth={2.2} /> {diamonds.available.toLocaleString()} diamonds available
            </span>
            <b className="money-amount">{dollars(money.availableCents)}</b>
            <button type="button" className="money-withdraw" onClick={withdraw} disabled={withdrawing || !summary.method}>
              {withdrawing ? <Loader2 size={18} className="auth-spin" /> : 'Withdraw'}
            </button>
            {!summary.method && <span className="money-sub">Add a withdrawal method below first.</span>}
          </>
        ) : (
          <>
            <strong>Great job!</strong>
            <span className="money-sub">
              Only <Gem size={13} strokeWidth={2.2} /> {missing.toLocaleString()} left to get
            </span>
            <b className="money-amount">{dollars(money.minimumCents)}</b>
            <span className="money-bar" role="progressbar" aria-valuemin={0} aria-valuemax={diamonds.minimum} aria-valuenow={diamonds.available}>
              <i style={{ width: `${Math.max(2, progress * 100)}%` }} />
            </span>
          </>
        )}
        {diamonds.pending > 0 && (
          <span className="money-pending">
            <Gem size={12} strokeWidth={2.2} /> {diamonds.pending.toLocaleString()} more become available {money.holdDays} days after they were received
          </span>
        )}
      </section>

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

      <Link href="/go-live" className="money-golive">
        <Video size={20} strokeWidth={2} /> Go Live
      </Link>

      <dl className="money-stats">
        <div>
          <dt>{diamonds.total.toLocaleString()}</dt>
          <dd>Earned</dd>
        </div>
        <div>
          <dt>{diamonds.withdrawn.toLocaleString()}</dt>
          <dd>Withdrawn</dd>
        </div>
        <div>
          <dt>{money.diamondsPerUsd.toLocaleString()}</dt>
          <dd>Diamonds = $1</dd>
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
                    {payout.diamonds.toLocaleString()} diamonds &middot; {payout.method} &middot; {dateFormat.format(new Date(payout.createdAt))}
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
          onClose={() => setMethodOpen(false)}
          onSaved={(method) => {
            setSummary((current) => ({ ...current, method }))
            setMethodOpen(false)
            setToast('Withdrawal method saved.')
          }}
        />
      )}
    </main>
  )
}

type DialogProps = { current: PayoutMethod | null; onClose: () => void; onSaved: (method: PayoutMethod) => void }

function MethodDialog({ current, onClose, onSaved }: DialogProps) {
  const [type, setType] = useState<'PAYPAL' | 'BANK'>(current?.type ?? 'PAYPAL')
  const [paypalEmail, setPaypalEmail] = useState(current?.paypalEmail ?? '')
  const [accountName, setAccountName] = useState(current?.accountName ?? '')
  const [bankName, setBankName] = useState(current?.bankName ?? '')
  const [accountNumber, setAccountNumber] = useState('')
  const [country, setCountry] = useState(current?.country ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSave =
    !busy && (type === 'PAYPAL' ? paypalEmail.includes('@') : accountName.trim() && bankName.trim() && accountNumber.trim().length >= 6 && country.trim().length === 2)

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const body = type === 'PAYPAL' ? { type, paypalEmail } : { type, accountName, bankName, accountNumber, country }
    const response = await fetch('/api/payouts/method', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null)
    const payload = (await response?.json().catch(() => null)) as (PayoutMethod & { message?: string }) | null
    setBusy(false)
    if (!response?.ok || !payload) return setError(payload?.message ?? 'Could not save. Try again.')
    onSaved(payload)
  }

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true" aria-labelledby="method-title">
      <form className="fp-modal money-dialog" onSubmit={save}>
        <h2 id="method-title">Withdrawal method</h2>

        <div className="money-types" role="radiogroup" aria-label="Method">
          <button type="button" role="radio" aria-checked={type === 'PAYPAL'} className={type === 'PAYPAL' ? 'is-active' : ''} onClick={() => setType('PAYPAL')}>
            PayPal
          </button>
          <button type="button" role="radio" aria-checked={type === 'BANK'} className={type === 'BANK' ? 'is-active' : ''} onClick={() => setType('BANK')}>
            Bank transfer
          </button>
        </div>

        {type === 'PAYPAL' ? (
          <label className="fp-field">
            <span>PayPal email</span>
            <input type="email" value={paypalEmail} onChange={(event) => setPaypalEmail(event.target.value)} placeholder="you@example.com" autoFocus />
          </label>
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
              <input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} placeholder={current?.accountLast4 ? `Ends in ${current.accountLast4}` : ''} spellCheck={false} />
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
          {busy ? <Loader2 size={18} className="auth-spin" /> : 'Save'}
        </button>
        <button type="button" className="fp-modal-cancel" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  )
}
