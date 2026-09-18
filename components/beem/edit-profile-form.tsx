'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Camera, ChevronDown, Loader2 } from 'lucide-react'
import type { EditableProfile, Gender } from '@/lib/api-types'
import { UploadError, uploadImage } from '@/lib/upload-image'
import { UserAvatar } from './user-avatar'

const NAME_MAX = 30
const ABOUT_MAX = 200
/** Long edge of a stored profile photo; it is never shown larger than 192px, doubled for dense screens. */
const AVATAR_EDGE = 512

const GENDER_LABEL: Record<Gender | 'NONE', string> = {
  NONE: 'Prefer not to show',
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
}

type Patch = Partial<Pick<EditableProfile, 'displayName' | 'handle' | 'bio' | 'avatarUrl' | 'gender' | 'birthDate' | 'hideAge'>>
type Modal = 'nickname' | 'gender' | 'birth' | null

type Props = {
  profile: EditableProfile
  /** Host shown in front of the nickname, e.g. beem.app */
  siteHost: string
}

async function patchProfile(fields: Patch): Promise<{ ok: true; profile: EditableProfile } | { ok: false; message: string }> {
  const response = await fetch('/api/users/me', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(fields),
  }).catch(() => null)

  const payload = (await response?.json().catch(() => null)) as (EditableProfile & { message?: string }) | null
  if (!response?.ok || !payload) return { ok: false, message: payload?.message ?? 'Could not save. Try again.' }
  return { ok: true, profile: payload }
}

/**
 * Name and About Me are saved by Done. The photo and the three rows under
 * them save on their own, as soon as they are set.
 */
export function EditProfileForm({ profile, siteHost }: Props) {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)

  const [saved, setSaved] = useState(profile)
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [modal, setModal] = useState<Modal>(null)
  const [busy, setBusy] = useState<'done' | 'photo' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const name = displayName.trim()
  const dirty = name !== saved.displayName || bio.trim() !== (saved.bio ?? '')
  const canFinish = dirty && name.length > 0 && busy === null

  async function finish() {
    setBusy('done')
    setError(null)
    const outcome = await patchProfile({ displayName: name, bio: bio.trim() })
    if (!outcome.ok) {
      setBusy(null)
      return setError(outcome.message)
    }
    router.push(`/${outcome.profile.handle}`)
    router.refresh()
  }

  async function changePhoto(file: File | undefined) {
    if (!file) return
    setBusy('photo')
    setError(null)
    try {
      const avatarUrl = await uploadImage(file, AVATAR_EDGE)
      const outcome = await patchProfile({ avatarUrl })
      if (!outcome.ok) throw new UploadError(outcome.message)
      setSaved(outcome.profile)
      // The header shows the photo too.
      router.refresh()
    } catch (caught) {
      setError(caught instanceof UploadError ? caught.message : 'Could not change the photo. Try again.')
    } finally {
      setBusy(null)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  function onSaved(next: EditableProfile) {
    setSaved(next)
    setModal(null)
    router.refresh()
  }

  return (
    <main className="fp">
      <header className="fp-head">
        <Link href={`/${saved.handle}`} className="fp-back" aria-label="Back to profile">
          <ArrowLeft size={24} strokeWidth={2} />
        </Link>
        <h1>Edit Profile</h1>
        <button type="button" className="fp-done" onClick={finish} disabled={!canFinish}>
          {busy === 'done' ? <Loader2 size={16} className="auth-spin" /> : 'Done'}
        </button>
      </header>

      <div className="ep-photo">
        <UserAvatar src={saved.avatarUrl} name={name || saved.displayName} size={192} className="ep-photo-img" />
        <button
          type="button"
          className="ep-photo-btn"
          onClick={() => fileInput.current?.click()}
          disabled={busy !== null}
          aria-label="Change profile photo"
        >
          {busy === 'photo' ? <Loader2 size={20} className="auth-spin" /> : <Camera size={20} strokeWidth={2.2} />}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(event) => changePhoto(event.target.files?.[0])}
        />
      </div>

      {error && (
        <p className="fp-error" role="alert">
          {error}
        </p>
      )}

      <label className="fp-field">
        <span>Name</span>
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value.slice(0, NAME_MAX))} maxLength={NAME_MAX} />
        <small>
          {displayName.length}/{NAME_MAX}
        </small>
      </label>

      <label className="fp-field">
        <span>About Me</span>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value.slice(0, ABOUT_MAX))}
          placeholder="Type few words about you"
          rows={1}
        />
        <small>
          {bio.length}/{ABOUT_MAX}
        </small>
      </label>

      <dl className="ep-rows">
        <div>
          <dt>Nickname</dt>
          <dd>
            <span>
              {siteHost}/{saved.handle}
            </span>
            <button type="button" onClick={() => setModal('nickname')}>
              Edit
            </button>
          </dd>
        </div>
        <div>
          <dt>Gender</dt>
          <dd>
            <span>{GENDER_LABEL[saved.gender ?? 'NONE']}</span>
            <button type="button" onClick={() => setModal('gender')}>
              Edit
            </button>
          </dd>
        </div>
        <div>
          <dt>Date of Birth</dt>
          <dd>
            {saved.birthDate && <span>{toDisplayDate(saved.birthDate)}</span>}
            <button type="button" onClick={() => setModal('birth')}>
              {saved.birthDate ? 'Edit' : 'Set'}
            </button>
          </dd>
        </div>
      </dl>

      {modal === 'nickname' && <NicknameModal saved={saved} siteHost={siteHost} onSaved={onSaved} onCancel={() => setModal(null)} />}
      {modal === 'gender' && <GenderModal saved={saved} onSaved={onSaved} onCancel={() => setModal(null)} />}
      {modal === 'birth' && <BirthModal saved={saved} onSaved={onSaved} onCancel={() => setModal(null)} />}
    </main>
  )
}

type ModalProps = { saved: EditableProfile; onSaved: (profile: EditableProfile) => void; onCancel: () => void }

function NicknameModal({ saved, siteHost, onSaved, onCancel }: ModalProps & { siteHost: string }) {
  const [handle, setHandle] = useState(saved.handle)
  const valid = /^[a-z0-9_]{2,32}$/.test(handle)

  return (
    <FieldModal
      title="Nickname"
      canSubmit={valid && handle !== saved.handle}
      onCancel={onCancel}
      onSaved={onSaved}
      patch={() => ({ handle })}
    >
      <input
        value={handle}
        onChange={(event) => setHandle(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 32))}
        autoCapitalize="none"
        spellCheck={false}
        autoFocus
        aria-label="Nickname"
      />
      <p className="fp-modal-hint">
        {siteHost}/{handle || 'nickname'}
        <br />
        Lowercase letters, digits and underscores. Links to your old nickname stop working.
      </p>
    </FieldModal>
  )
}

function GenderModal({ saved, onSaved, onCancel }: ModalProps) {
  const [gender, setGender] = useState<Gender | 'NONE'>(saved.gender ?? 'NONE')

  return (
    <FieldModal title="Gender" canSubmit onCancel={onCancel} onSaved={onSaved} patch={() => ({ gender: gender === 'NONE' ? null : gender })}>
      <span className="fp-select">
        <select value={gender} onChange={(event) => setGender(event.target.value as Gender | 'NONE')} aria-label="Gender">
          {(Object.keys(GENDER_LABEL) as (Gender | 'NONE')[]).map((value) => (
            <option key={value} value={value}>
              {GENDER_LABEL[value]}
            </option>
          ))}
        </select>
        <ChevronDown size={20} strokeWidth={2} aria-hidden="true" />
      </span>
    </FieldModal>
  )
}

function BirthModal({ saved, onSaved, onCancel }: ModalProps) {
  const [text, setText] = useState(saved.birthDate ? toDisplayDate(saved.birthDate) : '')
  const [hideAge, setHideAge] = useState(saved.hideAge)
  const birthDate = toIsoDate(text)

  return (
    <FieldModal
      title="Date of Birth"
      canSubmit={birthDate !== null}
      onCancel={onCancel}
      onSaved={onSaved}
      patch={() => ({ birthDate, hideAge })}
      footer={
        <label className="fp-check">
          <input type="checkbox" checked={hideAge} onChange={(event) => setHideAge(event.target.checked)} />
          <span aria-hidden="true" />
          Don&apos;t show my age in profile
        </label>
      }
    >
      <input
        value={text}
        onChange={(event) => setText(maskDate(event.target.value))}
        placeholder="DD/MM/YYYY"
        inputMode="numeric"
        autoFocus
        aria-label="Date of birth, day, month, year"
      />
    </FieldModal>
  )
}

type FieldModalProps = {
  title: string
  canSubmit: boolean
  patch: () => Patch
  onSaved: (profile: EditableProfile) => void
  onCancel: () => void
  children: ReactNode
  footer?: ReactNode
}

/** The small "Set / Cancel" panel the three rows share. Saves on Set. */
function FieldModal({ title, canSubmit, patch, onSaved, onCancel, children, footer }: FieldModalProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const outcome = await patchProfile(patch())
    if (outcome.ok) return onSaved(outcome.profile)
    setBusy(false)
    setError(outcome.message)
  }

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <form className="fp-modal" onSubmit={submit}>
        <h2>{title}</h2>
        {children}
        {error && (
          <p className="fp-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="fp-modal-set" disabled={!canSubmit || busy}>
          {busy ? <Loader2 size={18} className="auth-spin" /> : 'Set'}
        </button>
        <button type="button" className="fp-modal-cancel" onClick={onCancel}>
          Cancel
        </button>
        {footer}
      </form>
    </div>
  )
}

/** Keeps digits only and puts the slashes in as the person types. */
function maskDate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8)
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/')
}

/** DD/MM/YYYY to YYYY-MM-DD, or null while it is incomplete. The API decides whether the date is real. */
function toIsoDate(text: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null
}

function toDisplayDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}
