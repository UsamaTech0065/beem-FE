import { NextResponse } from 'next/server'
import { forwardToApi } from '@/lib/server-api'

/** The caller's conversations. */
export async function GET() {
  return forwardToApi('/chats', { auth: 'required', method: 'GET' })
}

/** Open (or find) the conversation with someone. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { userId?: string } | null
  if (!body?.userId) return NextResponse.json({ message: 'Pick someone to message.' }, { status: 400 })
  return forwardToApi('/chats', { auth: 'required', body: { userId: body.userId } })
}
