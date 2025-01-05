// app/api/audio/clone/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { STEPFUN_API_KEY, STEPFUN_API_URL } from '@/app/lib/constants'

const STEP_VOICES_URL = `${STEPFUN_API_URL}/audio/voices`

export async function POST(req: NextRequest) {
  try {
    // 1. 解析 JSON
    //   前端会发送 { file_id, model, text, sample_text }
    const { file_id, model, text, sample_text } = await req.json()

    if (!file_id) {
      return NextResponse.json({ error: 'Missing file_id' }, { status: 400 })
    }
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    // 2. 构造要请求给 StepFun 的 body
    const requestBody = {
      file_id,
      model: model || 'step-tts-mini',
      text, // 用于克隆时的文本
      sample_text, // 试听文本
    }

    // 3. 请求 StepFun /v1/audio/voices
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
      return NextResponse.json(
        {
          error: `StepFun Clone Error (${res.status}): ${errorText}`,
        },
        { status: res.status },
      )
    }

    // 4. 返回的响应：{
    //   id: string,              // 音色 ID，可用于后续的音频生成
    //   object: "audio.voice",   // 文件类型
    //   duplicated: boolean,     // 是否重复请求
    //   sample_text: string,     // 试听文本
    //   sample_audio: string     // base64 的 wav 音频
    // }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in clone route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
