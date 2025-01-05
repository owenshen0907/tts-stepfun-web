import React, { useRef, useState } from 'react'
import { WaveFile } from 'wavefile'

interface RecorderProps {
  onRecordingComplete?: (blob: Blob, textInfo?: string) => void
}

const Recorder: React.FC<RecorderProps> = ({ onRecordingComplete }) => {
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // 常见音频类型的优先级列表
  const possibleMimeTypes = ['audio/wav', 'audio/webm; codecs=opus', 'audio/ogg; codecs=opus']

  // 根据浏览器支持度，找一个可行的 mimeType
  function getSupportedMimeType() {
    for (const mime of possibleMimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime
      }
    }
    return '' // 如果一个都不支持，则返回空字符串
  }

  /**
   * 使用 AudioContext.decodeAudioData 先解码 Blob，得到 AudioBuffer。
   * 然后使用 wavefile.fromScratch(...) 构建一个标准 WAV。
   */
  async function convertToStandardWav(originalBlob: Blob): Promise<Blob> {
    // 1) 先解码成原始 PCM
    const arrayBuffer = await originalBlob.arrayBuffer()
    const audioCtx = new AudioContext()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

    // 2) 准备 wavefile 所需的 channelData
    const numChannels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const channelData: Float32Array[] = []
    for (let ch = 0; ch < numChannels; ch++) {
      channelData.push(audioBuffer.getChannelData(ch))
    }

    // 3) 用 wavefile.fromScratch 创建 32-bit float WAV
    const wav = new WaveFile()
    wav.fromScratch(numChannels, sampleRate, '32f', channelData)

    // 4) 可选地做降采样、降位深、转单声道等
    wav.toSampleRate(16000) // 转为16kHz
    wav.toBitDepth('16') // 转为16位
    // wav.toMono()           // 如需单声道，解开此行

    // 5) 生成最终 WAV Buffer 并封装成 Blob
    const newBuffer = wav.toBuffer()
    return new Blob([newBuffer], { type: 'audio/wav' })
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mimeType = getSupportedMimeType()
      if (!mimeType) {
        alert('当前浏览器不支持任何常见录音格式，请尝试更新或更换浏览器。')
        return
      }

      // 创建 MediaRecorder，mimeType 为检测到的可行格式
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // 合并 chunks 生成录制的原始音频 (WebM / Ogg / WAV... 看 mimeType 而定)
        const rawBlob = new Blob(chunksRef.current, { type: mimeType })

        try {
          // 转换成「真正的标准 WAV」
          const standardWavBlob = await convertToStandardWav(rawBlob)

          // 交给上层使用
          onRecordingComplete?.(standardWavBlob, '这是录音生成的标准 WAV 音频')
        } catch (err) {
          console.error('WAV 转码失败：', err)
          // 如果转码失败，就把原始 Blob 传出去
          onRecordingComplete?.(rawBlob, '这是原始音频，转码失败')
        }
      }

      mediaRecorder.start()
      setRecording(true)
    } catch (error) {
      console.error('录音失败:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  return (
    <div>
      <button
        onClick={recording ? stopRecording : startRecording}
        className="w-full h-12 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {recording ? '停止录音' : '开始录音'}
      </button>
    </div>
  )
}

export default Recorder
