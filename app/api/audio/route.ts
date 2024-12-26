// app/api/audio/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Buffer } from 'buffer'
import { STEPFUN_API_KEY, STEPFUN_API_URL } from '@/app/lib/constants'

export async function POST(req: NextRequest) {
  try {
    // 1. 解析前端发送的 JSON
    const { input, config } = await req.json()
    const { voice, speed, volume, mime_type } = config || {}

    // 2. 做一些简单的检查 (可根据需要调整)
    if (!input || !input.trim()) {
      return NextResponse.json({ error: 'No input text.' }, { status: 400 })
    }

    // StepFun 文档限制：文本最长 1000 字符
    if (input.length > 1000) {
      return NextResponse.json({ error: 'Max 1000 characters.' }, { status: 413 })
    }

    // 3. 向 StepFun 发起请求，接收**纯二进制**音频
    const res = await fetch(`${STEPFUN_API_URL}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // StepFun 需要 Bearer Token
        'Authorization': `Bearer ${STEPFUN_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'step-tts-mini',
        input,            // 文本
        voice,            // 音色，如"cixingnansheng"
        speed,            // 语速，0.50 ~ 2.00
        volume,           // 音量，0.10 ~ 2.00
        response_format: mime_type, // 动态设置格式
      }),
    })

    // 如果返回非200(OK)，读取text看看错误内容
    if (!res.ok) {
      const errorText = await res.text()
      return NextResponse.json(
        { error: `StepFun TTS Error (${res.status}): ${errorText}` },
        { status: res.status },
      )
    }

    // 4. 用 arrayBuffer() 读取**二进制音频**
    const arrayBuffer = await res.arrayBuffer()

    // 5. 转成 base64 字符串
    const base64Audio = Buffer.from(arrayBuffer).toString('base64')

    // 6. 返回给前端一个 JSON 包含 base64 音频和 MIME 类型
    return NextResponse.json({
      base64Audio,
      mime_type: mime_type || 'audio/mpeg', // 确保有默认值
    })
  } catch (error) {
    console.error('Error in StepFun TTS route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}