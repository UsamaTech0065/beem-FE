'use client'

import { useState } from 'react'
import { ImagePlus, Minus, Plus, X } from 'lucide-react'

const PRESETS = [4_000, 2_000, 999, 499, 199]

type Props = {
  onClose: () => void
  /** Sending needs coins and media storage; the caller decides what to tell the user. */
  onSend: () => void
}

/**
 * The content pack flow from the reference: an empty state, a create form
 * with Free / Premium and a price, and an "unsaved changes" guard on close.
 * Uploading is not wired yet, so the picker only shows the chosen file names.
 */
export function ChatContentPacks({ onClose, onSend }: Props) {
  const [step, setStep] = useState<'list' | 'create'>('list')
  const [premium, setPremium] = useState(true)
  const [price, setPrice] = useState(399)
  const [tease, setTease] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [confirmLeave, setConfirmLeave] = useState(false)

  const dirty = step === 'create' && (tease.trim() !== '' || files.length > 0)

  function requestClose() {
    if (dirty) setConfirmLeave(true)
    else onClose()
  }

  return (
    <div className="live-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="packs-title">
      <div className="packs">
        <header className="packs-head">
          <h2 id="packs-title">{step === 'list' ? 'Content packs' : 'Create'}</h2>
          <button type="button" className="packs-close" onClick={requestClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        {step === 'list' ? (
          <div className="packs-empty">
            <ImagePlus size={54} strokeWidth={1.4} />
            <h3>Create a media pack</h3>
            <p>Give your fans something to get excited about.</p>
            <button type="button" className="studio-golive studio-golive--sm packs-cta" onClick={() => setStep('create')}>
              <Plus size={20} /> Create
            </button>
          </div>
        ) : (
          <form
            className="packs-form"
            onSubmit={(event) => {
              event.preventDefault()
              onSend()
            }}
          >
            <div className="packs-media">
              {files.map((name) => (
                <span key={name} className="packs-file" title={name}>
                  {name}
                </span>
              ))}
              <label className="packs-add">
                <Plus size={22} />
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  hidden
                  onChange={(event) => setFiles([...event.target.files ?? []].map((file) => file.name))}
                />
              </label>
            </div>

            <div className="packs-tier" role="radiogroup" aria-label="Pack type">
              <button type="button" role="radio" aria-checked={!premium} className={!premium ? 'is-active' : ''} onClick={() => setPremium(false)}>
                Free
              </button>
              <button type="button" role="radio" aria-checked={premium} className={premium ? 'is-active' : ''} onClick={() => setPremium(true)}>
                Premium
              </button>
            </div>

            {premium && (
              <>
                <div className="packs-price">
                  <button type="button" onClick={() => setPrice((p) => Math.max(1, p - 50))} aria-label="Lower price">
                    <Minus size={18} />
                  </button>
                  <span>
                    <span className="tg-coin" aria-hidden="true" /> {price.toLocaleString()}
                  </span>
                  <button type="button" onClick={() => setPrice((p) => p + 50)} aria-label="Raise price">
                    <Plus size={18} />
                  </button>
                </div>
                <div className="packs-presets">
                  {PRESETS.map((value) => (
                    <button type="button" key={value} className={price === value ? 'is-active' : ''} onClick={() => setPrice(value)}>
                      <span className="tg-coin" aria-hidden="true" /> {value >= 1000 ? `${value / 1000}K` : value}
                    </button>
                  ))}
                </div>
              </>
            )}

            <label className="packs-tease">
              <textarea
                value={tease}
                onChange={(event) => setTease(event.target.value.slice(0, 500))}
                placeholder="Add a tease no one can resist..."
                rows={5}
              />
              <small>{tease.length}/500</small>
            </label>

            <button type="submit" className="studio-golive studio-golive--sm" disabled={files.length === 0}>
              Send
            </button>
            {files.length === 0 && <p className="packs-note">Add at least one photo or video.</p>}
          </form>
        )}

        {confirmLeave && (
          <div className="packs-confirm">
            <h3>Unsaved changes</h3>
            <p>Your changes won&apos;t be saved if you leave now.</p>
            <button type="button" className="studio-golive studio-golive--sm" onClick={onClose}>
              Leave
            </button>
            <button type="button" className="acct-btn" onClick={() => setConfirmLeave(false)}>
              Keep editing
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
