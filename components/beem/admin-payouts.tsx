'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check, Copy, Loader2, RotateCcw } from 'lucide-react'
import type { AdminPayout, AdminPayoutQueue } from '@/lib/api-types'
import { CoinIcon } from './icons'
import { UserAvatar } from './user-avatar'

const dollars = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const when = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const METHOD_NAME: Record<string, string> = { BANK: 'Bank transfer', CARD: 'Card', PAYPAL: 'PayPal', STRIPE: 'Stripe' }
const STATUS_LABEL = { REQUESTED: 'Processing', PAID: 'Paid', REJECTED: 'Returned' } as const

async function loadQueue(): Promise<AdminPayoutQueue | null> {
  return fetch('/api/admin/payouts').then((r) => (r.ok ? (r.json() as Promise<AdminPayoutQueue>) : null)).catch(() => null)
}

/**
 * The admin's payout desk. Each waiting request shows the full account or card
 * details; the admin sends the money from the business account, then marks it
 * paid. Returning a request puts the coins back in the creator's wallet.
 */
export function AdminPayouts({ initial }: { initial: AdminPayoutQueue }) {
  const [queue, setQueue] = useState(initial)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  async function settled(message: string) {
    setToast(message)
    const fresh = await loadQueue()
    if (fresh) setQueue(fresh)
  }

  const total = queue.pending.reduce((sum, payout) => sum + payout.amountCents, 0)

  return (
    <main className="fp adm">
      <h1 className="money-title">Payout requests</h1>
      <p className="adm-lead">
        {queue.pending.length === 0
          ? 'Nothing is waiting. New withdrawal requests appear here.'
          : `${queue.pending.length} waiting · ${dollars(total)} to send. Pay each one from your business account, then mark it.`}
      </p>

      <section className="adm-list">
        {queue.pending.map((payout) => (
          <PendingCard key={payout.id} payout={payout} onSettled={settled} onError={setToast} />
        ))}
      </section>

      {queue.recent.length > 0 && (
        <section className="money-history adm-recent">
          <h2>Recently settled</h2>
          <ul>
            {queue.recent.map((payout) => (
              <li key={payout.id}>
                <div>
                  <strong>
                    {dollars(payout.amountCents)} · {payout.user.displayName}
                  </strong>
                  <small>
                    @{payout.user.handle} · {payout.method} · {payout.processedAt ? when.format(new Date(payout.processedAt)) : ''}
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
    </main>
  )
}

type CardProps = { payout: AdminPayout; onSettled: (message: string) => Promise<void>; onError: (message: string) => void }

function PendingCard({ payout, onSettled, onError }: CardProps) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<'PAID' | 'REJECTED' | null>(null)
  const [confirmReturn, setConfirmReturn] = useState(false)
  const { details, user } = payout

  async function settle(status: 'PAID' | 'REJECTED') {
    if (busy) return
    setBusy(status)
    const response = await fetch(`/api/admin/payouts/${encodeURIComponent(payout.id)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, note: note.trim() || undefined }),
    }).catch(() => null)
    setBusy(null)
    if (!response?.ok) {
      const body = (await response?.json().catch(() => null)) as { message?: string } | null
      return onError(body?.message ?? 'Could not update the request. Try again.')
    }
    await onSettled(status === 'PAID' ? `${dollars(payout.amountCents)} to ${user.displayName} marked as paid.` : `${payout.coins.toLocaleString()} coins returned to ${user.displayName}.`)
  }

  const rows: [string, string | null][] =
    details.type === 'PAYPAL'
      ? [['PayPal email', details.paypalEmail]]
      : details.type === 'STRIPE'
        ? [['Stripe account', details.stripeAccountId]]
        : [
            [details.type === 'CARD' ? 'Name on card' : 'Account holder', details.accountName],
            [details.type === 'CARD' ? 'Issuing bank' : 'Bank', details.bankName],
            [details.type === 'CARD' ? 'Card number' : 'Account / IBAN', details.accountNumber],
            ['Country', details.country],
          ]

  return (
    <article className="adm-card">
      <header className="adm-card-head">
        <Link href={`/${user.handle}`} className="adm-user">
          <UserAvatar src={user.avatarUrl} name={user.displayName} size={44} />
          <span>
            <strong>{user.displayName}</strong>
            <small>@{user.handle}</small>
          </span>
        </Link>
        <div className="adm-amount">
          <b>{dollars(payout.amountCents)}</b>
          <small>
            <CoinIcon size={12} /> {payout.coins.toLocaleString()} · {when.format(new Date(payout.createdAt))}
          </small>
        </div>
      </header>

      <div className="adm-method">{METHOD_NAME[details.type] ?? details.type}</div>
      <dl className="adm-details">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                <span>{label.includes('number') || label.includes('IBAN') ? groupDigits(value!) : value}</span>
                <CopyButton value={value!} />
              </dd>
            </div>
          ))}
      </dl>

      <label className="fp-field adm-note">
        <span>Note for the creator (transfer reference, or why it was returned)</span>
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" maxLength={300} />
      </label>

      <div className="adm-actions">
        {confirmReturn ? (
          <>
            <span className="adm-confirm">Return {payout.coins.toLocaleString()} coins to their wallet?</span>
            <button type="button" className="adm-btn adm-btn--return" onClick={() => settle('REJECTED')} disabled={busy !== null}>
              {busy === 'REJECTED' ? <Loader2 size={16} className="auth-spin" /> : 'Yes, return coins'}
            </button>
            <button type="button" className="adm-btn" onClick={() => setConfirmReturn(false)} disabled={busy !== null}>
              Keep
            </button>
          </>
        ) : (
          <>
            <button type="button" className="adm-btn adm-btn--paid" onClick={() => settle('PAID')} disabled={busy !== null}>
              {busy === 'PAID' ? <Loader2 size={16} className="auth-spin" /> : <Check size={16} strokeWidth={2.6} />} Mark as paid
            </button>
            <button type="button" className="adm-btn adm-btn--return" onClick={() => setConfirmReturn(true)} disabled={busy !== null}>
              <RotateCcw size={15} strokeWidth={2.4} /> Return coins
            </button>
          </>
        )}
      </div>
    </article>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // No clipboard access: the value is visible to select by hand.
    }
  }
  return (
    <button type="button" className="adm-copy" onClick={copy} aria-label={copied ? 'Copied' : 'Copy'}>
      {copied ? <Check size={14} strokeWidth={2.6} /> : <Copy size={14} strokeWidth={2.2} />}
    </button>
  )
}

/** 4242424242424242 -> "4242 4242 4242 4242", so a long number can be read back. */
function groupDigits(value: string): string {
  return /^\d{12,19}$/.test(value) ? value.replace(/(.{4})/g, '$1 ').trim() : value
}
