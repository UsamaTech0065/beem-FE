type IconProps = { size?: number; className?: string }

/**
 * A solid eye with a visible pupil. Filling lucide's outline eye paints over
 * the pupil and leaves a blob, which is what this replaces.
 */
export function EyeFilled({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 5C6.6 5 2.7 8.9 1.3 11.3a1.4 1.4 0 0 0 0 1.4C2.7 15.1 6.6 19 12 19s9.3-3.9 10.7-6.3a1.4 1.4 0 0 0 0-1.4C21.3 8.9 17.4 5 12 5Zm0 3.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"
      />
      <circle cx="12" cy="12" r="1.9" />
    </svg>
  )
}

/** The beem coin as a drawn icon, for buttons where the small CSS coin is too plain. */
export function CoinIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="beem-coin-face" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fff3b0" />
          <stop offset=".45" stopColor="#ffd23f" />
          <stop offset="1" stopColor="#e0a400" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#c48a00" />
      <circle cx="12" cy="12" r="9.6" fill="url(#beem-coin-face)" />
      <circle cx="12" cy="12" r="7" fill="none" stroke="#c48a00" strokeOpacity=".55" strokeWidth="1" />
      <path
        fill="#b87f00"
        d="m12 6.9 1.5 3.1 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5L12 6.9Z"
      />
    </svg>
  )
}
