// app/[lang]/ui/components/voice-clone/VoiceCloneClient.tsx

'use client'

import React, { useState } from 'react'
import AudioPlayer from '@/app/[lang]/ui/components/voice-clone/AudioPlayer'
import FileUploader from '@/app/[lang]/ui/components/voice-clone/FileUploader'
import Recorder from '@/app/[lang]/ui/components/voice-clone/Recorder'
import TextOutput from '@/app/[lang]/ui/components/voice-clone/TextOutput'
import ToneGeneratorButton from '@/app/[lang]/ui/components/voice-clone/ToneGeneratorButton'
import { STEPFUN_TTS_MODEL } from '@/app/lib/constants'
import type { Locale } from '@/app/lib/i18n/i18n-config'

interface VoiceCloneClientProps {
  t: Record<string, any>
  lang: Locale
}

export default function VoiceCloneClient(_props: VoiceCloneClientProps) {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [textInfo, setTextInfo] = useState<string>('')
  const [sampleText, setSampleText] = useState<string>('') // 原"试听文本"，现改成"试听文档"

  const [voiceId, setVoiceId] = useState<string>('')
  const [sampleAudio, setSampleAudio] = useState<string>('')

  // 当录音完成时
  const handleRecordingComplete = (recordedBlob: Blob, text?: string) => {
    setAudioBlob(recordedBlob)
    setTextInfo(text || '录音完成，已获得音频文件。')
  }

  // 当文件上传完成时
  const handleFileUpload = (file: File) => {
    setAudioBlob(file)
    setTextInfo(`已上传文件：${file.name}`)
  }

  // 一键识别文本
  const handleRecognizeText = async () => {
    if (!audioBlob) {
      alert('请先录制或上传音频，再识别文本。')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.wav')

      const res = await fetch('/api/audio/asr', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.error) {
        alert(`识别文本出错：${data.error}`)
        return
      }

      if (data.recognizedText) {
        setTextInfo(data.recognizedText)
      } else {
        alert('未获取到识别文本。')
      }
    } catch (error) {
      console.error('Transcription error:', error)
      alert('识别文本时遇到错误')
    }
  }

  // 生成音色
  const handleGenerateTone = async () => {
    try {
      if (!audioBlob) {
        alert('请先录制或上传音频！')
        return
      }
      if (!textInfo.trim()) {
        alert('请先提供或识别文本！')
        return
      }
      if (!sampleText.trim()) {
        alert('请填写试听文档内容！')
        return
      }

      // 1) 上传文件到 /api/file/upload
      const uploadForm = new FormData()
      uploadForm.append('file', audioBlob, 'audio.wav')

      const uploadRes = await fetch('/api/file/upload', {
        method: 'POST',
        body: uploadForm,
      })
      const uploadData = await uploadRes.json()
      if (uploadData.error) {
        alert(`上传文件失败: ${uploadData.error}`)
        return
      }

      const fileId = uploadData.id
      let status = uploadData.status

      if (!fileId) {
        alert('上传后没有获取到文件ID')
        return
      }

      // 2) 轮询文件状态
      if (status !== 'success' && status !== 'processed') {
        let isReady = false
        while (!isReady) {
          await new Promise(r => setTimeout(r, 1000))
          const checkRes = await fetch(`/api/file/upload/status?file_id=${fileId}`)
          const checkData = await checkRes.json()
          if (checkData.error) {
            alert(`查询文件状态失败: ${checkData.error}`)
            return
          }
          status = checkData.status
          if (status === 'success' || status === 'processed') {
            isReady = true
          }
        }
      }

      // 3) 调用 /api/audio/clone
      const cloneBody = {
        file_id: fileId,
        model: STEPFUN_TTS_MODEL,
        text: textInfo,
        sample_text: sampleText,
      }

      const cloneRes = await fetch('/api/audio/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloneBody),
      })
      const cloneData = await cloneRes.json()
      if (cloneData.error) {
        alert(`生成音色失败: ${cloneData.error}`)
        return
      }

      setVoiceId(cloneData.id)
      setSampleAudio(cloneData.sample_audio || '')
      alert('生成音色成功！')
    } catch (err) {
      console.error('handleGenerateTone error:', err)
      alert('生成音色时出错')
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center">
      {/* 外层容器 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-5xl p-6 mt-6 mb-6">
        {/* 顶部标题和描述 */}
        <h1 className="text-2xl font-bold mb-2">🔊音色克隆</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          您可以录制或者上传 5~10
          秒的音频，进行音色克隆。克隆完成后，您可以试听生成的音色。如果满意，请记下您的音色ID，以便后续使用。
        </p>
        <hr className="my-4" />

        {/* 1. 音频播放器 */}
        <div className="mb-4">
          <AudioPlayer audioBlob={audioBlob} />
        </div>

        {/* 2. 录音和上传功能 */}
        <div className="flex mb-6">
          <div className="flex-1 mr-2">
            {/* 录音按钮 */}
            <Recorder onRecordingComplete={handleRecordingComplete} />
          </div>
          <div className="flex-1 ml-2">
            {/* 上传按钮 */}
            <FileUploader accept=".wav, .mp3" onFileUpload={handleFileUpload} />
          </div>
        </div>

        {/* 3. 文本编辑：一键识别 + 文本框 */}
        <div className="flex items-center mb-4 space-x-2">
          <button onClick={handleRecognizeText} className="h-10 w-1/5 bg-blue-600 text-white rounded">
            一键识别文本
          </button>
          <div className="flex-grow">
            <TextOutput text={textInfo} onTextChange={newVal => setTextInfo(newVal)} />
          </div>
        </div>

        {/* 4. 生成试听文档 + 文本输入框 */}
        <div className="flex items-center mb-4 space-x-2">
          <button
            className="h-10 w-1/5 bg-green-600 text-white rounded"
            onClick={() => alert('生成试听文档（示例按钮）')}
          >
            生成试听文档
          </button>
          <input
            type="text"
            className="flex-grow p-2 border rounded"
            value={sampleText}
            onChange={e => setSampleText(e.target.value)}
            placeholder="请输入生成后的试听文档内容"
          />
        </div>

        {/* 5. 生成音色 */}
        <div className="border p-4 mt-4">
          <ToneGeneratorButton onGenerateTone={handleGenerateTone} />

          {voiceId && (
            <div className="mt-2 p-2 border rounded">
              <p>音色 ID：{voiceId}</p>
              {sampleAudio && (
                <div className="mt-2">
                  <p>试听音频：</p>
                  <audio controls src={`data:audio/wav;base64,${sampleAudio}`} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// export default VoiceCloneClient
