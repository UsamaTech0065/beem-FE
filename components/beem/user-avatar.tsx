type Props = {
  src: string | null | undefined
  /** Used for the initial and its colour when there is no photo. */
  name: string
  /** Rendered size in px; only needed to scale the initial. The box itself is sized by CSS. */
  size?: number
  className?: string
}

/**
 * A person's photo, or their initial on a colour derived from their name.
 * A generic placeholder image made every new member look identical and
 * unfinished; the same name always gets the same colour here.
 */
export function UserAvatar({ src, name, size = 44, className = '' }: Props) {
  if (src) return <img src={src} alt="" className={`ua ${className}`} />

  const initial = (name.trim()[0] ?? '?').toUpperCase()
  return (
    <span
      className={`ua ua--initial ${className}`}
      style={{ background: `hsl(${hueFor(name)} 62% 52%)`, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}

function hueFor(text: string): number {
  let hash = 0
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) % 360
  return hash
}
