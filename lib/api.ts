import type { Category, CreatorStats, CurrentUser, Fan, LiveFollowedEntry, Page, StreamCard } from './api-types'
import { demoCategories, demoLivePage } from './demo-data'

/**
 * Server-side calls prefer API_URL (which can be an internal address in a
 * container network); the browser only ever sees NEXT_PUBLIC_API_URL.
 */
export const API_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000'
).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestOptions = {
  accessToken?: string | null
  /** Live feeds must never be served from a cache. */
  revalidate?: number | false
  method?: string
  body?: unknown
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken, revalidate = false, method = 'GET', body } = options

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(revalidate === false ? { cache: 'no-store' as const } : { next: { revalidate } }),
  })

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response))
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] }
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message
    return message ?? response.statusText
  } catch {
    return response.statusText
  }
}

/**
 * Feeds degrade rather than throw. A request that fails, because the API is
 * down, unreachable, or misconfigured, must not turn into an error screen when
 * one panel's request fails.
 *
 * The public discovery feeds fall back to bundled demo content so the site
 * still looks alive. Personalised feeds fall back to empty: inventing who a
 * viewer follows would be wrong. The fallback only applies when the request
 * fails; an API that answers with nothing is shown as nothing.
 */
async function safe<T>(promise: Promise<T>, fallback: T | (() => T), what: string): Promise<T> {
  try {
    return await promise
  } catch (error) {
    warnOnce(what, error)
    return typeof fallback === 'function' ? (fallback as () => T)() : fallback
  }
}

const warned = new Set<string>()

/** One line per failing endpoint per process, so a dead API is visible in the logs without flooding them. */
function warnOnce(what: string, error: unknown): void {
  if (warned.has(what)) return
  warned.add(what)
  const reason = error instanceof Error ? error.message : String(error)
  console.warn(`[beem] ${what} unavailable at ${API_URL} (${reason}); using fallback content.`)
}

const EMPTY_PAGE: Page<StreamCard> = { items: [], nextCursor: null }

export function getLiveStreams(options: { category?: string; limit?: number } = {}) {
  const params = new URLSearchParams()
  if (options.category) params.set('category', options.category)
  if (options.limit) params.set('limit', String(options.limit))
  const query = params.toString()
  return safe(
    apiFetch<Page<StreamCard>>(`/streams/live${query ? `?${query}` : ''}`),
    () => demoLivePage(options),
    'streams',
  )
}

export function getFollowingStreams(accessToken: string | null) {
  if (!accessToken) return Promise.resolve(EMPTY_PAGE)
  return safe(apiFetch<Page<StreamCard>>('/streams/following', { accessToken }), EMPTY_PAGE, 'following feed')
}

export function getLiveFollowed(accessToken: string | null) {
  if (!accessToken) return Promise.resolve<LiveFollowedEntry[]>([])
  return safe(apiFetch<LiveFollowedEntry[]>('/follows/live', { accessToken }), [], 'live followed')
}

export function getCategories() {
  // Uncached on purpose: the live page 404s on a slug it does not know, and a
  // stale list here would turn a newly added category into a wrong page.
  return safe(apiFetch<Category[]>('/categories'), demoCategories, 'categories')
}

export function getCurrentUser(accessToken: string | null) {
  if (!accessToken) return Promise.resolve(null)
  return safe(apiFetch<CurrentUser>('/auth/me', { accessToken }), null, 'current user')
}

export function getCreatorStats(accessToken: string | null) {
  if (!accessToken) return Promise.resolve<CreatorStats | null>(null)
  return safe(apiFetch<CreatorStats>('/users/me/stats', { accessToken }), null, 'creator stats')
}

export function getFans(accessToken: string | null) {
  if (!accessToken) return Promise.resolve<Fan[]>([])
  return safe(apiFetch<Fan[]>('/follows/fans', { accessToken }), [], 'fans')
}
