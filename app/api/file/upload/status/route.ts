// app/api/file/upload/status/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { STEPFUN_API_KEY, STEPFUN_API_URL } from '@/app/lib/constants'

export async function GET(req: NextRequest) {
  try {
    // 1. 解析查询参数 file_id
    const { searchParams } = new URL(req.url)
    const fileId = searchParams.get('file_id')

    if (!fileId) {
      return NextResponse.json({ error: 'Missing file_id' }, { status: 400 })
    }

    // 2. 调用 StepFun 接口: GET /v1/files/:fileId
    //    例如：
    //    curl https://api.stepfun.com/v1/files/file-abc \
    //      -H "Authorization: Bearer $STEP_API_KEY"
    const stepfunRes = await fetch(`${STEPFUN_API_URL}/files/${fileId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${STEPFUN_API_KEY}`,
      },
    })

    if (!stepfunRes.ok) {
      const errorText = await stepfunRes.text()
      return NextResponse.json(
        { error: `StepFun File Status Error (${stepfunRes.status}): ${errorText}` },
        { status: stepfunRes.status },
      )
    }

    // 3. 把 StepFun 的 JSON 响应直接返回给前端
    const data = await stepfunRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in file status route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
