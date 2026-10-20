'use client'

import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'

/** Password form for the developer door. A right answer sets the bypass cookie and opens the home page. */
export function DevAccessForm({ tag }: { tag: string }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || !password) return
    setBusy(true)
    setError(null)
    const response = await fetch('/api/maintenance/unlock', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tag, password }),
    }).catch(() => null)
    if (response?.ok) {
      window.location.assign('/')
      return
    }
    setBusy(false)
    setError(response?.status === 401 ? 'Wrong password.' : 'Could not sign you in. Try again.')
  }

  return (
    <form className="devgate-form" onSubmit={submit}>
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Maintenance password"
        autoComplete="current-password"
        autoFocus
        aria-label="Maintenance password"
      />
      {error && (
        <span className="devgate-error" role="alert">
          {error}
        </span>
      )}
      <button type="submit" disabled={busy || !password}>
        {busy ? <Loader2 size={18} className="auth-spin" /> : 'Enter'}
      </button>
    </form>
  )
}
