import { NextResponse } from 'next/server'
import { forwardToApi } from '@/lib/server-api'

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params
  return forwardToApi(`/chats/${encodeURIComponent(id)}`, { auth: 'required', method: 'GET' })
}

/** Favourite or unfavourite. */
export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params
  const body = (await request.json().catch(() => null)) as { favorite?: boolean } | null
  if (typeof body?.favorite !== 'boolean') {
    return NextResponse.json({ message: 'favorite must be true or false.' }, { status: 400 })
  }
  return forwardToApi(`/chats/${encodeURIComponent(id)}`, { auth: 'required', method: 'PATCH', body: { favorite: body.favorite } })
}
