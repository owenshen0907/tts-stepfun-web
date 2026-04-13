import { NextResponse } from 'next/server'
import { STEPFUN_API_KEY, STEPFUN_API_URL } from '@/app/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch(`${STEPFUN_API_URL}/audio/voices?limit=100`, {
      headers: {
        Authorization: `Bearer ${STEPFUN_API_KEY}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const errorText = await res.text()
      return NextResponse.json(
        { error: `StepFun Voice List Error (${res.status}): ${errorText}` },
        { status: res.status },
      )
    }

    const data = await res.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error in voices route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
