// app/[lang]/ui/content.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { faCircleDown, faCirclePause, faCirclePlay } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from '@nextui-org/button'
import { Textarea } from '@nextui-org/input'
import { Slider } from '@nextui-org/slider'
import { Spinner } from '@nextui-org/spinner'
import { Toaster, toast } from 'sonner'
import VoiceCard from '@/app/[lang]/ui/components/VoiceCard'
import { STEPFUN_VOICES, STEPFUN_MAX_INPUT_LENGTH, DEFAULT_TEXT, MIME_TYPES } from '@/app/lib/constants'
import { base64AudioToBlobUrl, getFormatDate, saveAs } from '@/app/lib/tools'
import { Tran } from '@/app/lib/types'

export default function Content({ t }: { t: Tran }) {
  const [input, setInput] = useState<string>(DEFAULT_TEXT.CN)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // StepFun 需要的配置项
  const [voice, setVoice] = useState('cixingnansheng') // 默认选磁性男声
  const [speed, setSpeed] = useState(1.0) // 0.50 ~ 2.00
  const [volume, setVolume] = useState(1.0) // 0.10 ~ 2.00
  const [mimeType, setMimeType] = useState<'wav' | 'mp3' | 'flac' | 'opus'>('mp3') // 默认 mp3
  const [gender, setGender] = useState<'male' | 'female'>('male') // 默认男声

  // 筛选男女声
  const maleVoices = STEPFUN_VOICES.filter(voice => voice.gender === 'male')
  const femaleVoices = STEPFUN_VOICES.filter(voice => voice.gender === 'female')

  // 切换性别时，重置音色
  useEffect(() => {
    if (gender === 'male') {
      setVoice(maleVoices[0].value)
    } else {
      setVoice(femaleVoices[0].value)
    }
  }, [gender])

  // 点“播放”时调用后端 /api/audio
  const fetchAudio = async () => {
    const res = await fetch('/api/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input,
        config: {
          voice,
          speed,
          volume,
          mime_type: mimeType,
        },
      }),
    })
    if (!res.ok) {
      toast.error('Error fetching audio. Code: ' + res.status)
      return null
    }
    return res.json() // 后端返回: { base64Audio, traceid, mime_type }
  }

  const play = async () => {
    if (!input.trim()) {
      toast.error('请输入文本')
      return
    }
    if (isLoading) return

    setLoading(true)
    try {
      const data = await fetchAudio()
      if (!data || !data.base64Audio) {
        toast.error('后端没有返回 base64Audio')
        return
      }

      const url = base64AudioToBlobUrl(data.base64Audio, data.mime_type)
      if (!audioRef.current) {
        audioRef.current = new Audio(url)
        audioRef.current.onended = () => setIsPlaying(false)
      } else {
        // 复用 Audio 对象时，先停止再重新赋 src
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.src = url
      }
      setIsPlaying(true)
      audioRef.current.play()
    } catch (err) {
      console.error('Error fetching audio:', err)
      toast.error('请求失败')
    } finally {
      setLoading(false)
    }
  }

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  const handleDownload = async () => {
    if (!audioRef.current || !audioRef.current.src) {
      toast.warning('请先播放，才可下载')
      return
    }
    const response = await fetch(audioRef.current.src)
    const blob = await response.blob()
    saveAs(blob, `StepFun-TTS-${voice}${getFormatDate(new Date())}.${mimeType}`)
    toast.success('已下载')
  }

  return (
    <div className="grow overflow-y-auto flex md:justify-center gap-10 py-5 px-6 flex-col md:flex-row">
      <div className="md:flex-1">
        <Toaster position="top-center" />

        {/* 文本输入框 */}
        <Textarea
          size="lg"
          disableAutosize
          placeholder="请输入文本..."
          value={input}
          maxLength={STEPFUN_MAX_INPUT_LENGTH} // StepFun限制1000字
          onChange={e => setInput(e.target.value)}
          classNames={{ input: 'resize-y min-h-[120px]' }}
        />
        <p className="text-right pt-2">
          {input.length}/{STEPFUN_MAX_INPUT_LENGTH}
        </p>

        {/* 操作按钮行 */}
        <div className="flex justify-between items-center pt-3">
          <div className="flex gap-3">
            {/* 下载 */}
            <FontAwesomeIcon
              icon={faCircleDown}
              className="w-8 h-8 text-blue-600 hover:text-blue-500 cursor-pointer"
              onClick={handleDownload}
              title="下载音频"
            />
          </div>
          {/* 播放/暂停 */}
          {isLoading ? (
            <Spinner className="w-8 h-8" />
          ) : (
            <FontAwesomeIcon
              icon={isPlaying ? faCirclePause : faCirclePlay}
              className="w-8 h-8 text-blue-600 hover:text-blue-500 cursor-pointer"
              onClick={isPlaying ? pause : play}
              title={isPlaying ? '暂停' : '播放'}
            />
          )}
        </div>
      </div>

      {/* 音色、speed、volume 设置 */}
      <div className="md:flex-1 flex flex-col gap-4">
        {/* 音频格式选择 */}
        <div>
          <h3 className="font-bold mb-2">音频格式</h3>
          <div className="flex flex-wrap gap-2 pb-3">
            {MIME_TYPES.map(item => (
              <Button
                key={item.value}
                color={item.value === mimeType ? 'primary' : 'default'}
                onClick={() => setMimeType(item.value as 'wav' | 'mp3' | 'flac' | 'opus')}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 性别选择 */}
        <div>
          <h3 className="font-bold mb-2">选择性别</h3>
          <div className="flex flex-wrap gap-2 pb-3">
            <Button color={gender === 'male' ? 'primary' : 'default'} onClick={() => setGender('male')}>
              男声
            </Button>
            <Button color={gender === 'female' ? 'primary' : 'default'} onClick={() => setGender('female')}>
              女声
            </Button>
          </div>
        </div>

        {/* 音色选择 */}
        <div>
          <h3 className="font-bold mb-2">选择音色</h3>
          <div className="flex flex-wrap gap-2 pb-3">
            {(gender === 'male' ? maleVoices : femaleVoices).map(item => (
              <VoiceCard
                key={item.value}
                voiceItem={item}
                selectedVoice={voice}
                onSelect={voiceValue => {
                  console.log('Selecting voice:', voiceValue)
                  setVoice(voiceValue)
                }}
                // onSelect={(voiceValue: string) => setVoice(voiceValue)}
              />
            ))}
          </div>
        </div>

        {/* 语速调整 */}
        <div>
          <h3 className="font-bold mb-2">语速（0.50 ~ 2.00）</h3>
          <Slider
            step={0.01}
            minValue={0.5}
            maxValue={2.0}
            value={speed}
            onChange={(val: number | number[]) => {
              if (typeof val === 'number') setSpeed(parseFloat(val.toFixed(2)))
            }}
            aria-label="语速"
          />
          <p className="mt-1">当前：{speed.toFixed(2)}</p>
        </div>

        {/* 音量调整 */}
        <div>
          <h3 className="font-bold mb-2">音量（0.10 ~ 2.00）</h3>
          <Slider
            step={0.01}
            minValue={0.1}
            maxValue={2.0}
            value={volume}
            onChange={(val: number | number[]) => {
              if (typeof val === 'number') setVolume(parseFloat(val.toFixed(2)))
            }}
            aria-label="音量"
          />
          <p className="mt-1">当前：{volume.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
