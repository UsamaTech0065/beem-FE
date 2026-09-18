'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Camera,
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Lock,
  Mic,
  MicOff,
  Pencil,
  Radio,
  Settings,
  Share2,
  Smile,
  Sparkles,
  Users,
  Video,
  VideoOff,
  Wand2,
} from 'lucide-react'
import type { Category, CurrentUser, GoLiveResponse } from '@/lib/api-types'

type Source = 'camera' | 'obs'
type Permission = 'unknown' | 'granted' | 'denied' | 'unavailable'

const TIP_SEEN_KEY = 'beem:permissions-tip-seen'
const FALLBACK_AVATAR = '/placeholder-user.jpg'

type Props = {
  user: CurrentUser
  categories: Category[]
}

/**
 * The pre-live screen. Regular Live previews the camera here and publishes on
 * the stream page; OBS Live opens an RTMP entry point and shows the key there.
 */
export function BroadcastStudio({ user, categories }: Props) {
  const router = useRouter()
  const preview = useRef<HTMLVideoElement | null>(null)
  const media = useRef<MediaStream | null>(null)

  const [source, setSource] = useState<Source>('camera')
  const [permission, setPermission] = useState<Permission>('unknown')
  const [showTip, setShowTip] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [title, setTitle] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shared, setShared] = useState(false)

  // Ask once per browser before the real permission prompt, like the reference.
  useEffect(() => {
    let seen = false
    try {
      seen = localStorage.getItem(TIP_SEEN_KEY) === '1'
    } catch {
      // Storage may be blocked; just show the tip.
    }
    if (seen) void openCamera()
    else setShowTip(true)
    return stopCamera
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) return setPermission('unavailable')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true })
      media.current = stream
      if (preview.current) preview.current.srcObject = stream
      setPermission('granted')
    } catch (cause) {
      setPermission((cause as DOMException).name === 'NotAllowedError' ? 'denied' : 'unavailable')
    }
  }

  function stopCamera() {
    media.current?.getTracks().forEach((track) => track.stop())
    media.current = null
  }

  function acknowledgeTip() {
    try {
      localStorage.setItem(TIP_SEEN_KEY, '1')
    } catch {
      // Fine without it; the tip shows again next time.
    }
    setShowTip(false)
    void openCamera()
  }

  function toggle(kind: 'audio' | 'video') {
    const tracks = kind === 'audio' ? media.current?.getAudioTracks() : media.current?.getVideoTracks()
    const next = kind === 'audio' ? !micOn : !cameraOn
    tracks?.forEach((track) => (track.enabled = next))
    if (kind === 'audio') setMicOn(next)
    else setCameraOn(next)
  }

  async function share() {
    const url = `${location.origin}/stream`
    try {
      if (navigator.share) await navigator.share({ title: 'Watch me on beem', url })
      else await navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 1800)
    } catch {
      // Cancelled share sheet; nothing to report.
    }
  }

  async function goLive() {
    setBusy(true)
    setError(null)

    const response = await fetch('/api/streams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: title.trim() || `${user.displayName} is live`,
        categorySlug: categorySlug || undefined,
        source,
      }),
    }).catch(() => null)

    if (!response?.ok) {
      const body = (await response?.json().catch(() => null)) as { message?: string } | null
      setError(body?.message ?? 'Could not start the stream. Try again.')
      setBusy(false)
      return
    }

    const { stream } = (await response.json()) as GoLiveResponse
    // Release the camera before the stream page opens it for publishing.
    stopCamera()
    router.push(`/stream/${stream.id}${source === 'obs' ? '?source=obs' : ''}`)
  }

  const canGoLive = !busy && (source === 'obs' || permission === 'granted')

  return (
    <div className="studio">
      <header className="studio-top">
        <Link href="/" className="live-round" aria-label="Back">
          <ArrowLeft size={22} />
        </Link>

        <div className="studio-tabs" role="tablist" aria-label="Broadcast source">
          <button
            type="button"
            role="tab"
            aria-selected={source === 'camera'}
            className={`studio-tab${source === 'camera' ? ' is-active' : ''}`}
            onClick={() => setSource('camera')}
          >
            Regular Live
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={source === 'obs'}
            className={`studio-tab${source === 'obs' ? ' is-active' : ''}`}
            onClick={() => setSource('obs')}
          >
            OBS Live
            <span className="studio-new">NEW</span>
          </button>
        </div>

        <div className="studio-top-right">
          <img src={user.avatarUrl ?? FALLBACK_AVATAR} alt="" className="studio-avatar-sm" />
          <button type="button" className="live-round" onClick={share} aria-label="Share">
            {shared ? <Check size={20} /> : <Share2 size={20} />}
          </button>
        </div>
      </header>

      <aside className="studio-side studio-left">
        <div className="studio-tip">
          <span className="studio-tip-label">Quick tip</span>
          <span className="studio-tip-icon">
            <Users size={30} strokeWidth={1.6} />
          </span>
          <strong>Collaborate and go live with your friends</strong>
          <p>Invite friends to a live party during a live to boost the fun. Coming soon.</p>
        </div>

        {source === 'camera' ? (
          <div className="studio-block">
            <span className="studio-block-icon">
              <Wand2 size={34} strokeWidth={1.5} />
            </span>
            <h2>Masks &amp; Filters</h2>
            {[
              { icon: Sparkles, label: 'Makeup' },
              { icon: Smile, label: 'Beauty' },
              { icon: Camera, label: 'Masks' },
            ].map(({ icon: Icon, label }) => (
              <button type="button" className="studio-row" key={label} disabled title="Coming soon">
                <Icon size={20} strokeWidth={1.8} />
                <span>
                  {label}
                  <small>Coming soon</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <ObsGuide />
        )}
      </aside>

      <main className="studio-stage">
        {source === 'camera' ? (
          <>
            <video ref={preview} autoPlay playsInline muted className={cameraOn ? '' : 'is-off'} />
            {permission !== 'granted' && (
              <div className="studio-locked">
                <Lock size={44} strokeWidth={1.4} />
                <p>
                  {permission === 'unavailable'
                    ? 'No camera or microphone was found on this device.'
                    : 'beem needs access to your camera and microphone'}
                </p>
                {permission === 'denied' && <small>Allow access in your browser settings, then reload.</small>}
              </div>
            )}
            <div className="studio-controls">
              <button
                type="button"
                className={`live-round live-round--lg${micOn ? '' : ' is-off'}`}
                onClick={() => toggle('audio')}
                aria-pressed={!micOn}
                aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                {micOn ? <Mic size={22} /> : <MicOff size={22} />}
              </button>
              <button
                type="button"
                className={`live-round live-round--lg${cameraOn ? '' : ' is-off'}`}
                onClick={() => toggle('video')}
                aria-pressed={!cameraOn}
                aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
              >
                {cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
              </button>
            </div>
          </>
        ) : (
          <div className="studio-obs">
            <ObsMark />
            <p>
              Follow instructions on
              <br />
              how to go live with OBS Studio
            </p>
          </div>
        )}
      </main>

      <aside className="studio-side studio-right">
        <div className="studio-profile">
          <img src={user.avatarUrl ?? FALLBACK_AVATAR} alt="" />
          <button type="button" className="studio-edit" disabled title="Profile editing is coming soon">
            <Pencil size={14} /> Edit
          </button>
        </div>

        <label className="studio-field">
          <span>Notification for followers</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="I started Broadcast"
            maxLength={80}
          />
        </label>

        <div className="studio-switch" aria-disabled="true" title="Premium streams are coming soon">
          <span>Premium</span>
          <span className="studio-toggle" />
        </div>

        <label className="studio-field">
          <span>
            <Settings size={14} /> Live settings
          </span>
          <select value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)}>
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <div className="studio-go">
          {error && <span className="auth-error">{error}</span>}
          <button type="button" className="studio-golive" onClick={goLive} disabled={!canGoLive}>
            {busy ? <Loader2 size={20} className="auth-spin" /> : <Radio size={20} strokeWidth={2.2} />}
            {busy ? 'Starting' : 'Go Live'}
          </button>
        </div>
      </aside>

      {showTip && (
        <div className="live-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="perm-title">
          <div className="live-modal">
            <h2 id="perm-title">Permissions</h2>
            <p>Before you go live, you will be asked to allow access to the following:</p>
            <div className="live-modal-icons">
              <span>
                <Camera size={30} strokeWidth={1.6} />
                Camera
              </span>
              <span>
                <Mic size={30} strokeWidth={1.6} />
                Microphone
              </span>
            </div>
            <button type="button" className="studio-golive studio-golive--sm" onClick={acknowledgeTip}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Steps for encoder streaming. The key itself appears once the stream exists. */
export function ObsGuide({ ingress }: { ingress?: { url: string; streamKey: string } | null }) {
  const [copied, setCopied] = useState<'url' | 'key' | null>(null)

  async function copy(kind: 'url' | 'key', value: string) {
    await navigator.clipboard.writeText(value).catch(() => null)
    setCopied(kind)
    setTimeout(() => setCopied(null), 1600)
  }

  return (
    <div className="studio-block studio-obs-guide">
      <span className="studio-block-icon">
        <ObsMark size={34} />
      </span>
      <h2>How to go live with OBS</h2>

      <ol className="studio-steps">
        <li>
          <span>1</span>
          <div>
            <strong>Download OBS Studio</strong>
            <p>Install version 30 or later from the official site and launch it.</p>
            <a href="https://obsproject.com" target="_blank" rel="noreferrer" className="studio-link">
              Official OBS website <ExternalLink size={14} />
            </a>
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <strong>Point OBS at beem</strong>
            <p>
              Settings, Stream, Service: <em>Custom</em>. Paste the server and the stream key below, then press Start
              Streaming in OBS.
            </p>
          </div>
        </li>
      </ol>

      {ingress ? (
        <div className="studio-keys">
          <button type="button" className="studio-key" onClick={() => copy('url', ingress.url)}>
            {copied === 'url' ? <Check size={18} /> : <Copy size={18} />}
            <span>
              Server
              <code>{ingress.url}</code>
            </span>
          </button>
          <button type="button" className="studio-key" onClick={() => copy('key', ingress.streamKey)}>
            {copied === 'key' ? <Check size={18} /> : <Copy size={18} />}
            <span>
              Stream key
              <code>{'•'.repeat(18)}</code>
            </span>
          </button>
          <small>Anyone with the key can stream as you. It stops working when you end the live.</small>
        </div>
      ) : (
        <p className="studio-hint">
          <Download size={16} /> Your server address and stream key appear here after you press Go Live.
        </p>
      )}
    </div>
  )
}

/** The OBS ring, drawn inline so no image request is needed. */
function ObsMark({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="3" />
      <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="3" />
      <circle cx="32" cy="14" r="5" fill="currentColor" />
      <circle cx="17" cy="41" r="5" fill="currentColor" />
      <circle cx="47" cy="41" r="5" fill="currentColor" />
    </svg>
  )
}
