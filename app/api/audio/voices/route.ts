import { NextResponse } from 'next/server'
import { STEPFUN_API_KEY, STEPFUN_API_URL } from '@/app/lib/constants'
import { extractStepFunError } from '@/app/lib/stepfun-error'

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
      const parsedError = extractStepFunError(errorText, `StepFun voice list request failed (${res.status}).`)
      return NextResponse.json({ error: parsedError.message, code: parsedError.code }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error in voices route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
