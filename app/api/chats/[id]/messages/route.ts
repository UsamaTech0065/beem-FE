import { NextResponse } from 'next/server'
import { forwardToApi } from '@/lib/server-api'

type Context = { params: Promise<{ id: string }> }

/** Messages, oldest first. `?after=<ISO>` returns only newer ones, for polling. */
export async function GET(request: Request, { params }: Context) {
  const { id } = await params
  const after = new URL(request.url).searchParams.get('after')
  const query = after ? `?after=${encodeURIComponent(after)}` : ''
  return forwardToApi(`/chats/${encodeURIComponent(id)}/messages${query}`, { auth: 'required', method: 'GET' })
}

export async function POST(request: Request, { params }: Context) {
  const { id } = await params
  const body = (await request.json().catch(() => null)) as { text?: string; kind?: 'TEXT' | 'HI' } | null
  if (!body?.text?.trim()) return NextResponse.json({ message: 'Write a message first.' }, { status: 400 })
  return forwardToApi(`/chats/${encodeURIComponent(id)}/messages`, {
    auth: 'required',
    body: { text: body.text.trim(), ...(body.kind === 'HI' ? { kind: 'HI' } : {}) },
  })
}
