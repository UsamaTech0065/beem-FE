/**
 * Response shapes returned by beem-backend.
 *
 * The API lives in its own repository, so this is a copy of its
 * `src/contract.ts` rather than a shared package. If a response shape changes,
 * change it in both places.
 */

export type UserRole = 'VIEWER' | 'CREATOR' | 'MODERATOR' | 'ADMIN'
export type StreamMode = 'LIVE' | 'VIDEO' | 'VERSUS'
export type StreamStatus = 'LIVE' | 'ENDED'

export type PublicUser = {
  id: string
  handle: string
  displayName: string
  avatarUrl: string | null
}

export type UserProfile = PublicUser & {
  bio: string | null
  role: UserRole
  createdAt: string
  followerCount: number
  followingCount: number
  liveStream: { id: string; title: string; viewerCount: number } | null
}

export type CurrentUser = PublicUser & {
  bio: string | null
  role: UserRole
  createdAt: string
  followerCount: number
  followingCount: number
  /** Decimal string; diamond totals are 64-bit on the server. */
  diamondsTotal: string
  /** The stream this user is hosting right now, if any. */
  liveStream: { id: string; title: string; viewerCount: number; startedAt: string } | null
}

/** A stream opened on its own page: the card plus what the viewer's relation to the host is. */
export type StreamDetail = StreamCard & {
  /** Null when nobody is signed in. */
  isFollowing: boolean | null
}

/** RTMP details for an encoder such as OBS. */
export type RtmpIngress = { ingressId: string; url: string; streamKey: string }

export type GoLiveResponse = {
  stream: StreamCard
  connection: StreamConnection
  ingress: RtmpIngress | null
}

/** What the browser needs to join a stream's LiveKit room. */
export type StreamConnection = {
  url: string
  token: string
  identity: string
  role: 'host' | 'viewer'
  /** Identity of the host inside the room, to tell their tracks from anyone else's. */
  hostIdentity: string
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

/** A person's public page at /<handle>. */
export type ProfilePage = PublicUser & {
  bio: string | null
  /** Null when they prefer not to show it. */
  gender: Gender | null
  /** Null when no date of birth is set, or they chose to hide it. */
  age: number | null
  role: UserRole
  createdAt: string
  followerCount: number
  followingCount: number
  /** Diamonds earned across all their streams, as a decimal string. */
  diamondsTotal: string
  liveStream: { id: string; title: string; viewerCount: number } | null
  /** The viewer is looking at their own page. */
  isSelf: boolean
  /** Null when nobody is signed in, or on your own page. */
  isFollowing: boolean | null
}

/** What the edit-profile page works on. Includes fields nobody else is shown. */
export type EditableProfile = PublicUser & {
  bio: string | null
  gender: Gender | null
  /** YYYY-MM-DD */
  birthDate: string | null
  hideAge: boolean
}

export type ProfilePost = {
  id: string
  text: string
  /** A /media/<id> path. */
  mediaUrl: string | null
  fansOnly: boolean
  /** Fans-only and not yours: text and media are withheld. */
  locked: boolean
  createdAt: string
}

/** ---- direct messages ---- */

export type ChatPeer = PublicUser & {
  /** Their live stream id when they are on air; drives the green dot. */
  liveStreamId: string | null
}

export type DmMessage = {
  id: string
  senderId: string
  /** HI is the wave from "Say hi", drawn as a greeting rather than a bubble. */
  kind: 'TEXT' | 'HI'
  text: string
  createdAt: string
}

export type DmConversation = {
  id: string
  peer: ChatPeer
  favorite: boolean
  unreadCount: number
  /** They started following you in the last two weeks. */
  fromNewFollower: boolean
  lastMessage: DmMessage | null
  lastMessageAt: string
}

/** Creator dashboard numbers for the signed-in user. */
export type CreatorStats = {
  followerCount: number
  followingCount: number
  streamCount: number
  liveStreams: number
  viewersNow: number
  diamondsTotal: string
}

/** Someone who follows the signed-in user. */
export type Fan = PublicUser & {
  followedAt: string
  followsBack: boolean
}

/** A public post on the home page, with who wrote it. */
export type FeedPost = ProfilePost & { author: PublicUser }

/** A member shown in the "New on beem" row. */
export type NewMember = PublicUser & { liveStreamId: string | null }

export type Category = { slug: string; name: string }

export type StreamCard = {
  id: string
  title: string
  mode: StreamMode
  viewerCount: number
  /**
   * A decimal string, not a number. Diamond totals are 64-bit on the server and
   * would silently lose precision past 2^53 if serialised as JSON numbers.
   */
  diamondsTotal: string
  thumbnailUrl: string | null
  startedAt: string
  category: Category | null
  host: PublicUser
}

/** Cursor pagination — pass `nextCursor` back as `cursor` to continue. */
export type Page<T> = { items: T[]; nextCursor: string | null }

export type LiveFollowedEntry = {
  host: PublicUser
  stream: { id: string; mode: StreamMode; viewerCount: number; thumbnailUrl: string | null }
}

export type TokenPair = {
  accessToken: string
  refreshToken: string
  /** Access-token lifetime in seconds. */
  expiresIn: number
}

export type SignInResult = TokenPair & {
  user: PublicUser & { role: UserRole }
}

export type HealthReport = {
  status: 'ok' | 'degraded'
  uptimeSeconds: number
  checks: {
    database: { ok: boolean; latencyMs: number | null; error?: string }
    redis: { ok: boolean; latencyMs: number | null; error?: string }
  }
}

/** Formats a diamond total the way the cards display it (3.7M, 805.5K). */
export function formatDiamonds(total: string): string {
  const value = Number(total)
  if (!Number.isFinite(value)) return '0'
  if (value >= 1_000_000) return `${trimZero(value / 1_000_000)}M`
  if (value >= 1_000) return `${trimZero(value / 1_000)}K`
  return String(value)
}

function trimZero(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '')
}
