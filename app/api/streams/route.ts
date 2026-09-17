import { NextResponse } from 'next/server'
import { forwardToApi } from '@/lib/server-api'

/** Go live. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { title?: string; categorySlug?: string } | null

  if (!body?.title?.trim()) {
    return NextResponse.json({ message: 'Give your stream a title.' }, { status: 400 })
  }

  return forwardToApi('/streams', {
    auth: 'required',
    body: { title: body.title.trim(), ...(body.categorySlug ? { categorySlug: body.categorySlug } : {}) },
  })
}
