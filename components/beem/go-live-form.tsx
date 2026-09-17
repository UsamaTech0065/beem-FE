'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Loader2, Radio, VideoOff } from 'lucide-react'
import type { Category } from '@/lib/api-types'

type Props = {
  defaultTitle: string
  categories: Category[]
}

/** Camera check and stream details. Publishing itself starts on the stream page. */
export function GoLiveForm({ defaultTitle, categories }: Props) {
  const router = useRouter()
  const preview = useRef<HTMLVideoElement | null>(null)
  const [title, setTitle] = useState(defaultTitle)
  const [categorySlug, setCategorySlug] = useState('')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Preview only, and video only: asking for the microphone here would show a
  // second permission prompt with nothing to demonstrate it.
  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser cannot access a camera.')
      return
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((media) => {
        if (cancelled) return media.getTracks().forEach((track) => track.stop())
        stream = media
        if (preview.current) preview.current.srcObject = media
      })
      .catch((cause: DOMException) => {
        if (cancelled) return
        setCameraError(
          cause.name === 'NotAllowedError'
            ? 'Allow camera access in your browser to go live.'
            : 'No camera was found on this device.',
        )
      })

    // Release the camera on the way out, or the stream page cannot open it.
    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    const response = await fetch('/api/streams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, categorySlug: categorySlug || undefined }),
    }).catch(() => null)

    if (!response?.ok) {
      const body = (await response?.json().catch(() => null)) as { message?: string } | null
      setError(body?.message ?? 'Could not start the stream. Try again.')
      setBusy(false)
      return
    }

    const { stream } = (await response.json()) as { stream: { id: string } }
    router.push(`/stream/${stream.id}`)
  }

  return (
    <form className="golive" onSubmit={submit}>
      <div className="golive-preview">
        <video ref={preview} autoPlay playsInline muted />
        {cameraError && (
          <div className="golive-preview-error">
            <VideoOff size={30} strokeWidth={1.6} />
            <p>{cameraError}</p>
          </div>
        )}
      </div>

      <div className="golive-fields">
        <label className="golive-field">
          <span>Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
            placeholder="What are you doing today?"
            required
          />
        </label>

        <label className="golive-field">
          <span>Category</span>
          <select value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)}>
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        {error && <span className="auth-error">{error}</span>}

        <button
          type="submit"
          className="acct-btn acct-btn--primary golive-submit"
          disabled={busy || Boolean(cameraError) || !title.trim()}
        >
          {busy ? <Loader2 size={18} className="auth-spin" /> : <Radio size={18} strokeWidth={2.2} />}
          {busy ? 'Starting' : 'Go live'}
        </button>
        <p className="acct-note">Your followers see you in their feed the moment you start.</p>
      </div>
    </form>
  )
}
