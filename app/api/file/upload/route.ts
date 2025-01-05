// app/api/file/upload/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { STEPFUN_API_KEY, STEPFUN_API_URL } from '@/app/lib/constants'

const STEP_FILES_URL = `${STEPFUN_API_URL}/files` // https://api.stepfun.com/v1/files

export async function POST(req: NextRequest) {
  try {
    // 1. 获取前端传来的 FormData
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // 2. 准备要给 StepFun 的 FormData
    const stepfunFormData = new FormData()
    stepfunFormData.append('purpose', 'storage')
    stepfunFormData.append('file', file, file.name ?? 'unknown.mp3')

    // 3. 请求 StepFun /v1/files
    const res = await fetch(STEP_FILES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STEPFUN_API_KEY}`,
      },
      body: stepfunFormData,
    })

    if (!res.ok) {
      const errorText = await res.text()
      return NextResponse.json(
        {
          error: `StepFun File Upload Error (${res.status}): ${errorText}`,
        },
        { status: res.status },
      )
    }

    // 4. 返回 StepFun 的 JSON 响应
    //    例如:
    //    {
    //      "id": "file-abc123",
    //      "object": "file",
    //      "bytes": 140,
    //      "created_at": 1613779121,
    //      "filename": "salesOverview.pdf",
    //      "purpose": "storage",
    //      "status": "processed"
    //    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in file upload route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
