'use client'

import { useState } from 'react'
import { BuyCoins } from './buy-coins'

/** The wallet-page "Buy coins" button that opens the slide-in drawer. */
export function BuyCoinsButton({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="wallet-buy" onClick={() => setOpen(true)} disabled={!signedIn}>
        {signedIn ? 'Buy coins' : 'Sign in to buy coins'}
      </button>
      <BuyCoins open={open} onClose={() => setOpen(false)} signedIn={signedIn} />
    </>
  )
}
