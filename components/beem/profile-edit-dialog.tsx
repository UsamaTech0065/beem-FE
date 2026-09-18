'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import type { ProfilePage } from '@/lib/api-types'
import { UserAvatar } from './user-avatar'

type Props = { profile: ProfilePage; onClose: () => void }

/** Edits the four fields the API lets a person change about themselves. */
export function ProfileEditDialog({ profile, onClose }: Props) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [handle, setHandle] = useState(profile.handle)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleValid = /^[a-z0-9_]{2,32}$/.test(handle)
  const avatarValid = avatarUrl === '' || /^https:\/\/\S+$/.test(avatarUrl)
  const canSave = !busy && displayName.trim().length > 0 && handleValid && avatarValid

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    const response = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName, handle, bio, avatarUrl }),
    }).catch(() => null)

    if (!response?.ok) {
      const body = (await response?.json().catch(() => null)) as { message?: string } | null
      setError(body?.message ?? 'Could not save. Try again.')
      setBusy(false)
      return
    }

    // A new handle is a new address; otherwise just re-read the page.
    if (handle !== profile.handle) router.replace(`/${handle}`)
    router.refresh()
    onClose()
  }

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-title">
      <div className="auth-panel profile-edit">
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
          <X size={22} />
        </button>

        <form onSubmit={save}>
          <h2 id="edit-title">Edit profile</h2>

          <div className="profile-edit-preview">
            <UserAvatar src={avatarValid && avatarUrl ? avatarUrl : null} name={displayName || '?'} size={72} />
            <span>This is how people see you.</span>
          </div>

          <label className="profile-edit-field">
            <span>Name</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={48} required />
          </label>

          <label className="profile-edit-field">
            <span>Handle</span>
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              maxLength={32}
              autoCapitalize="none"
              spellCheck={false}
              required
            />
            <small>beem.app/{handle || 'your_handle'} · lowercase letters, digits and underscores</small>
          </label>

          <label className="profile-edit-field">
            <span>Bio</span>
            <textarea value={bio} onChange={(event) => setBio(event.target.value.slice(0, 280))} rows={3} />
            <small>{bio.length}/280</small>
          </label>

          <label className="profile-edit-field">
            <span>Photo address</span>
            <input
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value.trim())}
              placeholder="https://..."
              inputMode="url"
              spellCheck={false}
            />
            <small>
              {avatarValid
                ? 'A link to an image, starting with https://. Leave empty to use your initial. Photo upload comes later.'
                : 'The address must start with https://'}
            </small>
          </label>

          {error && <span className="auth-error">{error}</span>}

          <button type="submit" className="auth-submit" disabled={!canSave}>
            {busy ? <Loader2 className="auth-spin" size={18} /> : null}
            {busy ? 'Saving' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  )
}
