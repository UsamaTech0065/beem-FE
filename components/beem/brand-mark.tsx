import Link from 'next/link'

export function BrandMark() {
  return (
    <Link href="/" className="brand" aria-label="beem home">
      <img src="/beem-logo.svg" alt="" className="brand-icon" />
      <span className="brand-word">beem</span>
    </Link>
  )
}
