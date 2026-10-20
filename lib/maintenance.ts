/**
 * Maintenance mode. With MAINTENANCE_MODE=true every page shows the
 * maintenance screen and every /api route answers 503, except for people who
 * hold the developer cookie. A developer gets that cookie by opening the
 * secret page /dev-access/<MAINTENANCE_DEV_TAG> and typing
 * MAINTENANCE_DEV_PASSWORD. Everything here runs in the edge proxy as well as
 * in route handlers, so it uses Web Crypto and no Node-only modules.
 */

/** httpOnly: holds the proof of developer access. */
export const MAINTENANCE_COOKIE = 'beem_maint'
/** Readable by the page: only says "you are bypassing", so the badge can show. */
export const MAINTENANCE_FLAG_COOKIE = 'beem_maint_dev'
/** Developer access lasts this long before the password is asked again. */
export const MAINTENANCE_BYPASS_SECONDS = 12 * 3600

export function maintenanceEnabled(): boolean {
  const value = process.env.MAINTENANCE_MODE?.trim().toLowerCase()
  return value === 'true' || value === '1' || value === 'on'
}

export function maintenanceDevTag(): string | null {
  return process.env.MAINTENANCE_DEV_TAG?.trim() || null
}

export function maintenanceDevPassword(): string | null {
  return process.env.MAINTENANCE_DEV_PASSWORD || null
}

/**
 * Paths that must keep working during maintenance: the screen itself, the
 * unlock route, and the developer door at the real tag only. A guessed tag
 * gets the maintenance screen like everyone else.
 */
export function maintenanceAllows(pathname: string): boolean {
  if (pathname === '/maintenance' || pathname === '/api/maintenance/unlock') return true
  const tag = maintenanceDevTag()
  return Boolean(tag) && pathname === `/dev-access/${encodeURIComponent(tag!)}`
}

let digestPromise: Promise<string | null> | null = null

/**
 * The cookie value that proves developer access: a hash of the tag and the
 * password, so the cookie is useless on its own and changes when either does.
 */
export function bypassDigest(): Promise<string | null> {
  if (!digestPromise) {
    digestPromise = (async () => {
      const tag = maintenanceDevTag()
      const password = maintenanceDevPassword()
      if (!tag || !password) return null
      const bytes = new TextEncoder().encode(`beem-maintenance:${tag}:${password}`)
      const hash = await crypto.subtle.digest('SHA-256', bytes)
      return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('')
    })()
  }
  return digestPromise
}

/** Constant-time string comparison, so a wrong password takes as long as a right one. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
