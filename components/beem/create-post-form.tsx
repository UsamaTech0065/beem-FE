'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react'
import { UploadError, uploadImage } from '@/lib/upload-image'

const TEXT_MAX = 500
/** Long edge of a stored post photo. */
const POST_EDGE = 1600

type Props = { handle: string }

export function CreatePostForm({ handle }: Props) {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [fansOnly, setFansOnly] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The preview is a blob address; it has to be released when it is replaced.
  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const canPost = !busy && (file !== null || text.trim().length > 0)

  function choose(next: File | undefined) {
    if (!next) return
    setError(null)
    if (!next.type.startsWith('image/')) return setError('Only photos can be posted for now. Video is on the way.')
    setFile(next)
  }

  function clearMedia() {
    setFile(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  async function publish() {
    setBusy(true)
    setError(null)
    try {
      const mediaUrl = file ? await uploadImage(file, POST_EDGE) : undefined
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, mediaUrl, fansOnly }),
      }).catch(() => null)

      if (!response?.ok) {
        const body = (await response?.json().catch(() => null)) as { message?: string } | null
        throw new UploadError(body?.message ?? 'Could not publish. Try again.')
      }
      router.push(`/${handle}`)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof UploadError ? caught.message : 'Could not publish. Try again.')
      setBusy(false)
    }
  }

  return (
    <main className="fp">
      <header className="fp-head">
        <Link href={`/${handle}`} className="fp-back" aria-label="Back to profile">
          <ArrowLeft size={24} strokeWidth={2} />
        </Link>
        <h1>Create Post</h1>
      </header>

      {preview ? (
        <div className="cp-preview">
          <img src={preview} alt="The photo you are about to post" />
          <button type="button" onClick={clearMedia} disabled={busy} aria-label="Remove photo">
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>
      ) : (
        <button type="button" className="cp-media" onClick={() => fileInput.current?.click()}>
          <Plus size={26} strokeWidth={1.8} />
          Add Media
        </button>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(event) => choose(event.target.files?.[0])}
      />

      <label className="fp-field cp-text">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, TEXT_MAX))}
          placeholder="Add a tease no one can resist..."
          rows={4}
          aria-label="Caption"
        />
        <small>
          {text.length}/{TEXT_MAX}
        </small>
      </label>

      <label className="cp-toggle">
        <span>
          <strong>Share with Subscribers only</strong>
          <small>Only your Subscribers will see this post</small>
        </span>
        <input type="checkbox" role="switch" checked={fansOnly} onChange={(event) => setFansOnly(event.target.checked)} />
        <i aria-hidden="true" />
      </label>

      {error && (
        <p className="fp-error" role="alert">
          {error}
        </p>
      )}

      <button type="button" className="cp-submit" onClick={publish} disabled={!canPost}>
        {busy ? <Loader2 size={20} className="auth-spin" /> : 'Post'}
      </button>
    </main>
  )
}
