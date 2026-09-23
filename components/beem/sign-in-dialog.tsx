'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Clock, Loader2, Mail, Send, Smartphone, X } from 'lucide-react'
import { API_URL } from '@/lib/api'
import { CoinIcon } from './icons'

type LastMethod = 'google' | 'email' | 'phone'
const LAST_METHOD_KEY = 'beem_last_method'

type Step = 'choose' | 'email' | 'phone' | 'code'
type Channel = 'sms' | 'whatsapp' | 'email'
type Channels = Record<Channel, boolean>

const CHANNEL_LABEL: Record<Channel, string> = { sms: 'SMS', whatsapp: 'WhatsApp', email: 'email' }

/** Used only if the API cannot be asked at all. */
const DEFAULT_CHANNELS: Channels = { sms: true, whatsapp: false, email: true }
/** The API's answer is kept for the session, so the dialog opens complete the next time. */
const CHANNELS_CACHE_KEY = 'beem_otp_channels'

function readCachedChannels(): Channels | null {
  try {
    const raw = sessionStorage.getItem(CHANNELS_CACHE_KEY)
    return raw ? (JSON.parse(raw) as Channels) : null
  } catch {
    return null
  }
}

/** Set to enable "Continue with Google"; must match the API's GOOGLE_CLIENT_ID. */
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

type GoogleTokenClient = { requestAccessToken: () => void }

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient(config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }): GoogleTokenClient
        }
      }
    }
  }
}

export function SignInDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('choose')
  // Null until the API has said which channels exist. The options are not
  // drawn from a guess, so a phone button never appears and then vanishes.
  const [channels, setChannels] = useState<Channels | null>(readCachedChannels)
  const available = channels ?? DEFAULT_CHANNELS
  const [channel, setChannel] = useState<Channel>('sms')
  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const [lastMethod, setLastMethod] = useState<LastMethod | null>(null)
  const tokenClientRef = useRef<GoogleTokenClient | null>(null)

  // Show the "Last used" badge on whichever method signed the person in last.
  useEffect(() => {
    try {
      const value = localStorage.getItem(LAST_METHOD_KEY)
      if (value === 'google' || value === 'email' || value === 'phone') setLastMethod(value)
    } catch {
      // No storage (private mode); the badge simply does not show.
    }
  }, [])

  function rememberMethod(method: LastMethod) {
    try {
      localStorage.setItem(LAST_METHOD_KEY, method)
    } catch {
      // Ignore: the badge is a convenience, not required for sign-in.
    }
  }

  // Exchanges the Google access token for a session, registering on first use.
  async function onGoogleToken(accessToken: string) {
    setBusy(true)
    setError(null)
    const response = await post('/api/auth/google', { accessToken })
    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'Google sign-in failed.' }))
      setBusy(false)
      setError(body.message)
      return
    }
    rememberMethod('google')
    router.refresh()
    onClose()
  }

  // Kept in a ref so the token client's one-time callback always calls the latest closure.
  const googleHandlerRef = useRef(onGoogleToken)
  googleHandlerRef.current = onGoogleToken

  // Load Google Identity Services once, only where a client ID is configured.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let cancelled = false

    function init() {
      const oauth2 = window.google?.accounts?.oauth2
      if (cancelled || !oauth2) return
      tokenClientRef.current = oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID as string,
        scope: 'openid email profile',
        callback: (response) => {
          if (response.error || !response.access_token) {
            setError('Google sign-in was cancelled.')
            return
          }
          void googleHandlerRef.current(response.access_token)
        },
      })
      setGoogleReady(true)
    }

    if (window.google?.accounts?.oauth2) {
      init()
      return () => {
        cancelled = true
      }
    }

    const src = 'https://accounts.google.com/gsi/client'
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing) {
      existing.addEventListener('load', init)
      return () => {
        cancelled = true
        existing.removeEventListener('load', init)
      }
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.onload = init
    document.head.appendChild(script)
    return () => {
      cancelled = true
    }
  }, [])

  function startGoogle() {
    setError(null)
    setNotice(null)
    tokenClientRef.current?.requestAccessToken()
  }

  // Hide channels the API has no sender for (WhatsApp needs a Twilio WhatsApp number).
  useEffect(() => {
    let cancelled = false
    fetch(`${API_URL}/auth/otp/channels`)
      .then((response) => (response.ok ? (response.json() as Promise<Channels>) : null))
      .then((answer) => {
        if (cancelled) return
        if (answer) {
          setChannels(answer)
          try {
            sessionStorage.setItem(CHANNELS_CACHE_KEY, JSON.stringify(answer))
          } catch {
            // No storage: the next open asks again.
          }
        } else {
          setChannels((current) => current ?? DEFAULT_CHANNELS)
        }
      })
      .catch(() => {
        // API unreachable: fall back to the usual set; the request step reports the rest.
        if (!cancelled) setChannels((current) => current ?? DEFAULT_CHANNELS)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function post(path: string, body: unknown): Promise<Response> {
    return fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  function go(next: Step, nextChannel?: Channel) {
    setStep(next)
    if (nextChannel) setChannel(nextChannel)
    setError(null)
    setNotice(null)
    if (next === 'choose') {
      setIdentifier('')
      setCode('')
    }
  }

  /** Resolves to the development code when the API is in development mode, else an empty string. */
  async function requestCode(): Promise<string | null> {
    setBusy(true)
    setError(null)
    setNotice(null)

    const response = await post('/api/auth/request-otp', { channel, identifier })
    setBusy(false)

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'Something went wrong.' }))
      setError(body.message)
      return null
    }

    const body = (await response.json().catch(() => ({}))) as { devCode?: string }
    return body.devCode ?? ''
  }

  /** In development the API returns the fixed code; fill it in so nobody has to read the log. */
  function applyDevCode(devCode: string) {
    setCode(devCode)
    if (devCode) setNotice(`Development mode: the code ${devCode} has been filled in for you.`)
  }

  async function submitIdentifier(event: React.FormEvent) {
    event.preventDefault()
    const devCode = await requestCode()
    if (devCode === null) return
    applyDevCode(devCode)
    setStep('code')
  }

  async function resend() {
    const devCode = await requestCode()
    if (devCode === null) return
    applyDevCode(devCode)
    if (!devCode) setNotice(`We sent a new code by ${CHANNEL_LABEL[channel]}.`)
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    const response = await post('/api/auth/verify-otp', { identifier, code })

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'Something went wrong.' }))
      setBusy(false)
      setError(body.message)
      return
    }

    rememberMethod(channel === 'email' ? 'email' : 'phone')
    // The session now lives in httpOnly cookies; re-render the server tree so
    // the personalised feeds pick it up.
    router.refresh()
    onClose()
  }

  const comingSoon = (what: string) => () => setNotice(`${what} sign-in is coming soon.`)

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className={`auth-panel${step === 'choose' ? ' is-choice' : ''}`}>
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
          <X size={22} />
        </button>

        {step === 'choose' && (
          <div className="auth-choice">
            <h2 id="auth-title">
              Sign up to continue
              <br />
              and claim Free Coins
            </h2>

            <div className="auth-coins">
              <CoinStack />
              <span className="auth-coins-amount">
                <CoinIcon size={20} />
                15
              </span>
            </div>

            <div className="auth-options">
              <button
                type="button"
                className="auth-option auth-option--dark"
                onClick={GOOGLE_CLIENT_ID ? startGoogle : comingSoon('Google')}
                disabled={busy || (Boolean(GOOGLE_CLIENT_ID) && !googleReady)}
              >
                {lastMethod === 'google' && <LastUsedBadge />}
                <GoogleMark />
                Continue with Google
              </button>
              <button type="button" className="auth-option" onClick={() => go('email', 'email')}>
                {lastMethod === 'email' && <LastUsedBadge />}
                <Mail size={22} strokeWidth={1.8} />
                Continue with Email
              </button>
              {/* Still asking the API: hold the slot so the layout does not jump. */}
              {channels === null && <span className="auth-option auth-option--pending" aria-busy="true" aria-label="Loading sign-in options" />}
              {/* No SMS provider configured: phone sign-in is not offered at all. */}
              {channels !== null && (channels.sms || channels.whatsapp) && (
                <button
                  type="button"
                  className="auth-option"
                  onClick={() => go('phone', available.sms ? 'sms' : 'whatsapp')}
                >
                  {lastMethod === 'phone' && <LastUsedBadge />}
                  <Smartphone size={22} strokeWidth={1.8} />
                  Continue with Phone
                </button>
              )}
            </div>

            <div className="auth-social">
              <button type="button" className="auth-social-btn" aria-label="Continue with X" onClick={comingSoon('X')}>
                <XMark />
              </button>
              <button
                type="button"
                className="auth-social-btn"
                aria-label="Continue with Telegram"
                onClick={comingSoon('Telegram')}
              >
                <Send size={20} strokeWidth={1.8} />
              </button>
            </div>

            {notice && <span className="auth-notice">{notice}</span>}

            <p className="auth-terms">
              By logging in, you confirm you&apos;re over 18 years old and agree to our{' '}
              <a href="/terms">Terms of Use</a> and <a href="/privacy">Privacy Policy</a>.
            </p>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={submitIdentifier}>
            <h2 id="auth-title">Continue with Email</h2>
            <p>We&apos;ll email you a six-digit code.</p>
            <input
              type="email"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              autoComplete="email"
              autoFocus
              required
            />
            {error && <span className="auth-error">{error}</span>}
            <button type="submit" className="auth-submit" disabled={busy || !identifier.includes('@')}>
              {busy ? <Loader2 className="auth-spin" size={18} /> : null}
              {busy ? 'Sending' : 'Send code'}
            </button>
            <button type="button" className="auth-back" onClick={() => go('choose')}>
              Use a different method
            </button>
          </form>
        )}

        {step === 'phone' && (
          <form onSubmit={submitIdentifier}>
            <h2 id="auth-title">Continue with Phone</h2>
            <p>Include your country code. We&apos;ll send you a six-digit code.</p>
            <input
              type="tel"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="+1 555 000 0000"
              aria-label="Phone number"
              autoComplete="tel"
              autoFocus
              required
            />
            {available.sms && available.whatsapp && (
              <div className="auth-segment" role="radiogroup" aria-label="Send the code by">
                <button
                  type="button"
                  role="radio"
                  aria-checked={channel === 'sms'}
                  className={`auth-segment-btn${channel === 'sms' ? ' is-active' : ''}`}
                  onClick={() => setChannel('sms')}
                >
                  Text message
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={channel === 'whatsapp'}
                  className={`auth-segment-btn${channel === 'whatsapp' ? ' is-active' : ''}`}
                  onClick={() => setChannel('whatsapp')}
                >
                  WhatsApp
                </button>
              </div>
            )}
            {error && <span className="auth-error">{error}</span>}
            <button type="submit" className="auth-submit" disabled={busy || identifier.replace(/\D/g, '').length < 7}>
              {busy ? <Loader2 className="auth-spin" size={18} /> : null}
              {busy ? 'Sending' : channel === 'whatsapp' ? 'Send on WhatsApp' : 'Send code'}
            </button>
            <button type="button" className="auth-back" onClick={() => go('choose')}>
              Use a different method
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={submitCode}>
            <h2 id="auth-title">Enter your code</h2>
            <p>
              Sent by {CHANNEL_LABEL[channel]} to <strong>{identifier}</strong>.
            </p>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              aria-label="Six-digit code"
              autoComplete="one-time-code"
              autoFocus
              required
            />
            {error && <span className="auth-error">{error}</span>}
            {notice && <span className="auth-notice">{notice}</span>}
            <button type="submit" className="auth-submit" disabled={busy || code.length !== 6}>
              {busy ? <Loader2 className="auth-spin" size={18} /> : null}
              {busy ? 'Checking' : 'Sign in'}
            </button>
            <div className="auth-links">
              <button type="button" className="auth-back" onClick={resend} disabled={busy}>
                Resend code
              </button>
              <button type="button" className="auth-back" onClick={() => go(channel === 'email' ? 'email' : 'phone')}>
                Change {channel === 'email' ? 'email' : 'number'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function LastUsedBadge() {
  return (
    <span className="auth-badge">
      <Clock size={12} strokeWidth={2.6} />
      Last Used
    </span>
  )
}

/** A little pile of gold coins, echoing the free-coins reward. */
function CoinStack() {
  const stacks = [
    { cx: 31, base: 52, count: 5 },
    { cx: 55, base: 52, count: 4 },
  ]
  return (
    <svg className="auth-coins-pile" width="86" height="66" viewBox="0 0 86 66" aria-hidden="true">
      {stacks.map((stack, si) =>
        Array.from({ length: stack.count }).map((_, i) => {
          const cy = stack.base - i * 6
          return (
            <g key={`${si}-${i}`}>
              <ellipse cx={stack.cx} cy={cy + 3} rx="15" ry="5" fill="#c98a00" />
              <ellipse cx={stack.cx} cy={cy} rx="15" ry="5" fill="#ffc928" />
              <ellipse cx={stack.cx} cy={cy - 1} rx="9" ry="2.6" fill="#ffe27a" />
            </g>
          )
        }),
      )}
    </svg>
  )
}

function GoogleMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.5 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.4 0 20.1 0 24s1 7.6 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.7-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  )
}

function XMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-7.4 8.5L23.3 22h-6.8l-5.3-6.9L5 22H1.9l7.9-9L.7 2h7l4.8 6.3L18.9 2zm-1.2 18.2h1.8L7 3.8H5.1l12.6 16.4z" />
    </svg>
  )
}
