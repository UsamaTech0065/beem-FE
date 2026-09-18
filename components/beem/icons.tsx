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

/**
 * The beem coin. This is the only coin in the app: balances, prices and
 * buttons all render it, so it looks the same at every size.
 *
 * Without `size` it takes its dimensions from the `.tg-coin` rule (and any
 * contextual override), which is how prices keep a smaller coin than buttons.
 * It is drawn with flat fills rather than a gradient on purpose: a gradient
 * needs an element id, and a page with dozens of coins would repeat that id.
 */
export function CoinIcon({ size, className = '' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`tg-coin ${className}`}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11.5" fill="#b97f00" />
      <circle cx="12" cy="12" r="10" fill="#ffc928" />
      <ellipse cx="9.6" cy="8.6" rx="6" ry="4.8" fill="#ffe680" opacity=".85" />
      <circle cx="12" cy="12" r="7.3" fill="none" stroke="#b97f00" strokeOpacity=".5" strokeWidth="1" />
      <path fill="#a86f00" d="m12 6.6 1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5L12 6.6Z" />
    </svg>
  )
}
