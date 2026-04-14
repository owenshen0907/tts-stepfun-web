// app/api/audio/clone/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { STEPFUN_API_KEY, STEPFUN_API_URL, STEPFUN_TTS_MODEL } from '@/app/lib/constants'
import { extractStepFunError } from '@/app/lib/stepfun-error'

const STEP_VOICES_URL = `${STEPFUN_API_URL}/audio/voices`
const SAMPLE_TEXT_MAX_LENGTH = 50

export async function POST(req: NextRequest) {
  try {
    const { file_id, sample_text, text } = await req.json()
    const normalizedText = typeof text === 'string' ? text.trim() : ''
    const normalizedSampleText = typeof sample_text === 'string' ? sample_text.trim() : ''

    if (!file_id) {
      return NextResponse.json({ error: 'Missing file_id' }, { status: 400 })
    }
    if (!normalizedText) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    const requestBody = {
      file_id,
      model: STEPFUN_TTS_MODEL,
      text: normalizedText,
      ...(normalizedSampleText ? { sample_text: normalizedSampleText } : {}),
    }

    if (normalizedSampleText.length > SAMPLE_TEXT_MAX_LENGTH) {
      return NextResponse.json(
        { error: `sample_text must be ${SAMPLE_TEXT_MAX_LENGTH} characters or fewer.` },
        { status: 400 },
      )
    }

    const res = await fetch(STEP_VOICES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STEPFUN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!res.ok) {
      const errorText = await res.text()
      const parsedError = extractStepFunError(errorText, `StepFun clone request failed (${res.status}).`)
      return NextResponse.json({ error: parsedError.message, code: parsedError.code }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({
      duplicated: Boolean(data?.duplicated),
      id: data?.id,
      sample_audio: data?.sample_audio,
      sample_text: data?.sample_text,
    })
  } catch (error) {
    console.error('Error in clone route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
