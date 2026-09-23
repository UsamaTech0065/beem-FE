import Link from 'next/link'

export function BrandMark() {
  return (
    <Link href="/" className="brand" aria-label="beem home">
      {/* The wordmark carries the name, so there is no text next to it. */}
      <img src="/beem-wordmark.svg" alt="beem" className="brand-logo" />
    </Link>
  )
}
