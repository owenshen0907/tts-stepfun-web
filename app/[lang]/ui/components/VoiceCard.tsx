'use client'

import { useState, useRef } from 'react'
import { Button } from '@nextui-org/button'

type VoiceItem = {
  value: string
  label: string
  gender: 'male' | 'female'
  previewUrl?: string
}

interface VoiceCardProps {
  voiceItem: VoiceItem
  selectedVoice: string
  onSelect: (voiceValue: string) => void
}

export default function VoiceCard({ voiceItem, selectedVoice, onSelect }: VoiceCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  // 播放预览
  const handlePreview = () => {
    if (!voiceItem.previewUrl) return

    // 如果已有音频在播，先暂停销毁
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }

    previewAudioRef.current = new Audio(voiceItem.previewUrl)
    previewAudioRef.current.play().catch(err => {
      console.error('预览播放失败:', err)
    })
  }

  // 鼠标事件
  const handleMouseEnter = () => {
    setIsHovered(true)
  }
  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  return (
    // 让这个 div 包含 按钮 + 预览图标
    // 并在父级监听 onMouseEnter/Leave
    <div className="relative inline-block pr-10" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* 点击按钮 => 选择音色 */}
      <Button
        color={voiceItem.value === selectedVoice ? 'primary' : 'default'}
        onClick={() => onSelect(voiceItem.value)}
      >
        {voiceItem.label}
      </Button>

      {/* 悬浮时显示 播放图标 */}
      {isHovered && (
        <span
          className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer text-xl"
          onClick={handlePreview}
          title={`预览${voiceItem.label}`}
        >
          ▶️
        </span>
      )}
    </div>
  )
}
