// app/api/audio/asr/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { STEPFUN_API_KEY, STEPFUN_API_URL } from '@/app/lib/constants'

const STEPFUN_ASR_URL = STEPFUN_API_URL + '/audio/transcriptions'

export async function POST(req: NextRequest) {
  try {
    // 1. 解析从前端发过来的 FormData（二进制音频）
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    const stepfunFormData = new FormData()
    stepfunFormData.append('model', 'step-asr')
    stepfunFormData.append('response_format', 'text')
    // 注意这里要把 File 对象也 append 进去
    // 第三个参数可以给文件起个名字
    stepfunFormData.append('file', file, file.name)

    // 3. 发起 fetch 请求到 StepFun
    const res = await fetch(STEPFUN_ASR_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STEPFUN_API_KEY}`, // 注意，这里要带上 Bearer 令牌
      },
      body: stepfunFormData,
    })

    if (!res.ok) {
      const errorText = await res.text()
      return NextResponse.json({ error: `StepFun ASR Error (${res.status}): ${errorText}` }, { status: res.status })
    }

    // 4. StepFun 返回的响应是纯文本
    //    如果你使用 "response_format=text"，它会是纯文本
    //    如果是 json，就要 await res.json()
    const recognizedText = await res.text()

    return NextResponse.json({ recognizedText })
  } catch (error) {
    console.error('Error in StepFun ASR route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
