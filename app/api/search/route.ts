import { NextResponse } from 'next/server'
import { API_URL } from '@/lib/api'

/** Quick results for the header box. Public, so it goes straight to the API. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json({ query: '', people: [], streams: [] })

  try {
    const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
    const payload = await response.json().catch(() => null)
    return NextResponse.json(payload ?? { query: q, people: [], streams: [] }, { status: response.ok ? 200 : response.status })
  } catch {
    return NextResponse.json({ message: 'Cannot reach the server. Try again in a moment.' }, { status: 503 })
  }
}
