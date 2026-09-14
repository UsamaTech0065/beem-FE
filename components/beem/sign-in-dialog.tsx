'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, X } from 'lucide-react'

type Step = 'phone' | 'code'

export function SignInDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function post(path: string, body: unknown): Promise<Response> {
    return fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  async function submitPhone(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    const response = await post('/api/auth/request-otp', { phone })
    setBusy(false)

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'Something went wrong.' }))
      setError(body.message)
      return
    }

    setStep('code')
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    const response = await post('/api/auth/verify-otp', { phone, code })

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'Something went wrong.' }))
      setBusy(false)
      setError(body.message)
      return
    }

    // The session now lives in httpOnly cookies; re-render the server tree so
    // the personalised feeds pick it up.
    router.refresh()
    onClose()
  }

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="auth-panel">
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
          <X size={22} />
        </button>

        {step === 'phone' ? (
          <form onSubmit={submitPhone}>
            <h2 id="auth-title">Sign in to beem</h2>
            <p>We&apos;ll text you a six-digit code.</p>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+1 555 000 0000"
              aria-label="Phone number"
              autoFocus
              required
            />
            {error && <span className="auth-error">{error}</span>}
            <button type="submit" className="auth-submit" disabled={busy || phone.length < 7}>
              {busy ? <Loader2 className="auth-spin" size={18} /> : null}
              {busy ? 'Sending' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitCode}>
            <h2 id="auth-title">Enter your code</h2>
            <p>
              Sent to {phone}. In development the code is printed in the API log rather than
              texted.
            </p>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              aria-label="Six-digit code"
              autoFocus
              required
            />
            {error && <span className="auth-error">{error}</span>}
            <button type="submit" className="auth-submit" disabled={busy || code.length !== 6}>
              {busy ? <Loader2 className="auth-spin" size={18} /> : null}
              {busy ? 'Checking' : 'Sign in'}
            </button>
            <button
              type="button"
              className="auth-back"
              onClick={() => {
                setStep('phone')
                setCode('')
                setError(null)
              }}
            >
              Use a different number
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
