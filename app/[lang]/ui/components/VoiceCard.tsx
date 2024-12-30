'use client'

import { useState, useRef } from 'react'
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
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
  const [isPlaying, setIsPlaying] = useState(false)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  // 用来存储定时器ID，防止多次悬停/移出导致冲突
  const hideTimer = useRef<NodeJS.Timeout | null>(null)

  // ======= 播放 / 暂停预览逻辑 =======
  const handlePlay = () => {
    if (!voiceItem.previewUrl) return

    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }

    const audio = new Audio(voiceItem.previewUrl)
    audio.onended = () => setIsPlaying(false)
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(err => console.error('预览播放失败:', err))

    previewAudioRef.current = audio
  }

  const handlePause = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
    setIsPlaying(false)
  }

  // ======= 悬浮显示、延迟隐藏 =======
  const handleMouseEnter = () => {
    // 如果之前设置了定时器，先清除，避免“刚离开就又回来了”情况
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    // 设置一个 200ms 定时器再隐藏
    hideTimer.current = setTimeout(() => {
      setIsHovered(false)
      hideTimer.current = null
      // 如果想离开就自动暂停播放，可以在这儿 handlePause()
    }, 200)
  }

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* 音色按钮 */}
      <Button
        color={voiceItem.value === selectedVoice ? 'primary' : 'default'}
        onPress={() => {
          console.log('Selecting voice:', voiceItem.value)
          onSelect(voiceItem.value)
        }}
      >
        {voiceItem.label}
      </Button>

      {/* 小播放按钮：绝对定位在上方 */}
      {isHovered && (
        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
            bg-opacity-20
            rounded
            z-10
            pointer-events-none
          "
        >
          <div className="pointer-events-auto">
            {isPlaying ? (
              <Button
                isIconOnly
                size="sm"
                onPress={handlePause}
                className="
                  rounded-full
                  bg-gradient-to-r
                  from-pink-400
                  to-pink-600
                  text-white
                  shadow-md
                  hover:shadow-lg
                  transition
                  duration-300
                  ease-in-out
                "
              >
                <FontAwesomeIcon icon={faPause} />
              </Button>
            ) : (
              <Button
                isIconOnly
                size="sm"
                onPress={handlePlay}
                className="
                  rounded-full
                  bg-gradient-to-r
                  from-pink-400
                  to-pink-600
                  text-white
                  shadow-md
                  hover:shadow-lg
                  transition
                  duration-300
                  ease-in-out
                "
              >
                <FontAwesomeIcon icon={faPlay} />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
