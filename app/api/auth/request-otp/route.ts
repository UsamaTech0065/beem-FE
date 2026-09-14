import { NextResponse } from 'next/server'
import { callApi, errorResponse } from '../route-helpers'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { phone?: string } | null

  if (!body?.phone) {
    return errorResponse(400, 'Enter your phone number.')
  }

  const result = await callApi('/auth/otp/request', { phone: body.phone })

  if (!result.ok) {
    return errorResponse(result.status, result.message)
  }

  return NextResponse.json(result.data)
}
