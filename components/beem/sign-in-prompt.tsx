'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { SignInDialog } from './sign-in-dialog'

/** Shown in place of a private page when nobody is signed in. */
export function SignInPrompt({ title }: { title: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="acct-empty acct-locked">
      <span className="acct-empty-icon">
        <Lock size={30} strokeWidth={1.8} />
      </span>
      <h2>Sign in to see {title}</h2>
      <p>This page is part of your beem account.</p>
      <button type="button" className="acct-btn acct-btn--primary" onClick={() => setOpen(true)}>
        Sign in
      </button>
      {open && <SignInDialog onClose={() => setOpen(false)} />}
    </div>
  )
}
