// app/[lang]/ui/components/voice-clone/AudioPlayer.tsx

'use client'

import React, { useEffect, useRef, useState } from 'react'
import CustomWaveform from './CustomWaveform'

interface AudioPlayerProps {
  audioBlob: Blob | null
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBlob }) => {
  const [audioUrl, setAudioUrl] = useState<string>('')
  const audioRef = useRef<HTMLAudioElement>(null)

  // 播放状态和时间
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)

  // 裁切区域的起止时间
  const [trimStart, setTrimStart] = useState<number>(0)
  const [trimEnd, setTrimEnd] = useState<number>(0)

  // 将 Blob 转换为 URL
  useEffect(() => {
    if (!audioBlob) {
      setAudioUrl('')
      return
    }
    const url = URL.createObjectURL(audioBlob)
    setAudioUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [audioBlob])

  // 监听 audio 元素的事件
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setTrimEnd(audio.duration) // 默认裁切结束为音频总时长
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioUrl])

  // 播放 / 暂停
  const handlePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      // 确保播放从trimStart开始
      if (audio.currentTime < trimStart || audio.currentTime > trimEnd) {
        audio.currentTime = trimStart
      }
      audio.play()
      setIsPlaying(true)
    }
  }

  // 下载音频
  const handleDownload = () => {
    if (!audioUrl) return
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = 'recorded.wav' // 或者其他扩展名
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 裁切音频
  const handleCut = async () => {
    if (!audioBlob) return
    if (trimEnd <= trimStart) {
      alert('结束时间必须大于开始时间')
      return
    }

    try {
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      const sampleRate = audioBuffer.sampleRate
      const startSample = Math.floor(trimStart * sampleRate)
      const endSample = Math.floor(trimEnd * sampleRate)
      const length = endSample - startSample

      if (length <= 0) {
        alert('裁切长度无效')
        return
      }

      const trimmedBuffer = audioContext.createBuffer(audioBuffer.numberOfChannels, length, sampleRate)

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel).slice(startSample, endSample)
        trimmedBuffer.copyToChannel(channelData, channel, 0)
      }

      // 将 AudioBuffer 转换为 WAV Blob
      const wavBlob = await audioBufferToWav(trimmedBuffer)
      const trimmedUrl = URL.createObjectURL(wavBlob)
      setAudioUrl(trimmedUrl)
      if (audioRef.current) {
        audioRef.current.src = trimmedUrl
        audioRef.current.currentTime = 0
        setCurrentTime(0)
        setIsPlaying(false)
      }

      // 重置裁切线
      setTrimStart(0)
      setTrimEnd(trimmedBuffer.duration)

      // 释放资源
      audioContext.close()
    } catch (error) {
      console.error('裁切音频时出错:', error)
      alert('裁切音频时出错，请检查控制台日志')
    }
  }

  // 将 AudioBuffer 转换为 WAV Blob
  const audioBufferToWav = (buffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        const numOfChan = buffer.numberOfChannels
        const length = buffer.length * numOfChan * 2 + 44
        const bufferArray = new ArrayBuffer(length)
        const view = new DataView(bufferArray)

        /* RIFF identifier */
        writeString(view, 0, 'RIFF')
        /* file length */
        view.setUint32(4, 36 + buffer.length * numOfChan * 2, true)
        /* RIFF type */
        writeString(view, 8, 'WAVE')
        /* format chunk identifier */
        writeString(view, 12, 'fmt ')
        /* format chunk length */
        view.setUint32(16, 16, true)
        /* sample format (raw) */
        view.setUint16(20, 1, true)
        /* channel count */
        view.setUint16(22, numOfChan, true)
        /* sample rate */
        view.setUint32(24, buffer.sampleRate, true)
        /* byte rate (sample rate * block align) */
        view.setUint32(28, buffer.sampleRate * numOfChan * 2, true)
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, numOfChan * 2, true)
        /* bits per sample */
        view.setUint16(34, 16, true)
        /* data chunk identifier */
        writeString(view, 36, 'data')
        /* data chunk length */
        view.setUint32(40, buffer.length * numOfChan * 2, true)

        // 写入PCM数据
        let offset = 44
        for (let i = 0; i < buffer.length; i++) {
          for (let channel = 0; channel < numOfChan; channel++) {
            const sample = buffer.getChannelData(channel)[i]
            // 将浮点数样本转换为 16 位整数
            const s = Math.max(-1, Math.min(1, sample))
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
            offset += 2
          }
        }

        const blob = new Blob([view], { type: 'audio/wav' })
        resolve(blob)
      } catch (error) {
        reject(error)
      }
    })
  }

  // 辅助函数：写入字符串到 DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  return (
    <div className="flex flex-col w-full">
      {/* 第一行：音频波形与竖线 */}
      <div className="w-full mb-4">
        {audioUrl ? (
          <CustomWaveform
            audioUrl={audioUrl}
            currentTime={currentTime}
            duration={duration}
            trimStart={trimStart}
            trimEnd={trimEnd}
            onTrimStartChange={setTrimStart}
            onTrimEndChange={setTrimEnd}
          />
        ) : (
          <p className="text-gray-500">暂无音频</p>
        )}
      </div>

      {/* 第二行：按钮 */}
      <div className="flex w-full space-x-4">
        {/* 播放/暂停按钮 */}
        <button
          onClick={handlePlayPause}
          className={`flex-1 py-2 rounded text-white ${
            isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={!audioUrl}
        >
          {isPlaying ? '暂停' : '播放'}
        </button>

        {/* 裁切音频按钮 */}
        <button
          onClick={handleCut}
          className="flex-1 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
          disabled={!audioUrl || trimEnd <= trimStart}
        >
          裁切音频
        </button>

        {/* 下载按钮 */}
        <button
          onClick={handleDownload}
          className="flex-1 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
          disabled={!audioUrl}
        >
          下载
        </button>
      </div>

      {/* 隐藏的 Audio 元素 */}
      <audio ref={audioRef} src={audioUrl} />
    </div>
  )
}

// 辅助函数：格式化时间 (秒) 为 mm:ss
const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds
  return `${minutes}:${paddedSeconds}`
}

export default AudioPlayer
