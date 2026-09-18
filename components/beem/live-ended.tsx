'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Gem, Star } from 'lucide-react'
import { EyeFilled } from './icons'

type Props = {
  peakViewers: number
  diamonds: string
}

/** The host's end-of-stream summary, with the rating prompt from the reference. */
export function LiveEnded({ peakViewers, diamonds }: Props) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="ended">
      <h2>Live ended</h2>
      <p className="ended-stats">
        <span>
          <EyeFilled size={16} /> {peakViewers}
        </span>
        <span>
          <Gem size={16} strokeWidth={2.2} /> {diamonds}
        </span>
      </p>
      <p className="ended-note">No gifters in this live</p>

      {submitted ? (
        <p className="ended-thanks">Thanks for the feedback.</p>
      ) : (
        <div className="ended-rating">
          <p>How was your broadcast?</p>
          <div className="ended-stars" role="radiogroup" aria-label="Rate your broadcast">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                type="button"
                key={value}
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value === 1 ? '' : 's'}`}
                className={`ended-star${value <= (hover || rating) ? ' is-on' : ''}`}
                onMouseEnter={() => setHover(value)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(value)}
              >
                <Star size={34} fill="currentColor" strokeWidth={0} />
              </button>
            ))}
          </div>
          {/* Ratings are not stored yet; acknowledging is honest and closes the loop. */}
          <button type="button" className="ended-submit" disabled={rating === 0} onClick={() => setSubmitted(true)}>
            Submit
          </button>
        </div>
      )}

      <Link href="/" className="acct-btn acct-btn--primary">
        Back to beem
      </Link>
    </div>
  )
}
