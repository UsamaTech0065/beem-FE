import { NextResponse } from 'next/server'
import { API_URL } from '@/lib/api'

/**
 * The browser never talks to the API for auth — it talks to these handlers,
 * which hold the tokens in httpOnly cookies on its behalf.
 */
export async function callApi(
  path: string,
  body: unknown,
): Promise<{ ok: true; data: any } | { ok: false; status: number; message: string }> {
  let response: Response

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
  } catch {
    return { ok: false, status: 503, message: 'Cannot reach the server. Is the API running?' }
  }

  if (!response.ok) {
    let message = response.statusText
    try {
      const parsed = (await response.json()) as { message?: string | string[] }
      const raw = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message
      if (raw) message = raw
    } catch {
      // keep statusText
    }
    return { ok: false, status: response.status, message }
  }

  const data = response.status === 204 ? null : await response.json()
  return { ok: true, data }
}

export function errorResponse(status: number, message: string) {
  return NextResponse.json({ message }, { status })
}
