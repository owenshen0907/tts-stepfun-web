// app/[lang]/ui/content.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { faCircleDown, faCirclePause, faCirclePlay } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from '@nextui-org/button'
import { Textarea } from '@nextui-org/input'
import { Slider } from '@nextui-org/slider'
import { Spinner } from '@nextui-org/spinner'
import { toast, Toaster } from 'sonner'
import VoiceCard from '@/app/[lang]/ui/components/VoiceCard'
import { DEFAULT_TEXT, MIME_TYPES, STEPFUN_MAX_INPUT_LENGTH, STEPFUN_VOICES } from '@/app/lib/constants'
import { base64AudioToBlobUrl, getFormatDate, saveAs } from '@/app/lib/tools'
import { Tran } from '@/app/lib/types'

export default function Content({ t }: { t: Tran }) {
  const [input, setInput] = useState<string>(t['DEFAULT_TEXT'])
  const [isLoading, setLoading] = useState<boolean>(false)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // StepFun 需要的配置项
  const [voice, setVoice] = useState('cixingnansheng') // 默认选磁性男声
  const [speed, setSpeed] = useState(1.0) // 0.50 ~ 2.00
  const [volume, setVolume] = useState(1.0) // 0.10 ~ 2.00
  const [mimeType, setMimeType] = useState<'wav' | 'mp3' | 'flac' | 'opus'>('mp3') // 默认 mp3
  const [gender, setGender] = useState<'male' | 'female'>('male') // 默认男声

  // 动态翻译音色
  const translatedVoices = STEPFUN_VOICES.map(voice => ({
    ...voice,
    label: t['voices'][voice.gender][voice.value], // 根据翻译配置动态映射
  }))

  // 筛选男女声
  const maleVoices = translatedVoices.filter(voice => voice.gender === 'male')
  const femaleVoices = translatedVoices.filter(voice => voice.gender === 'female')
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
    const res = await fetch('/api/audio/tts', {
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
      toast.error(`${t['fetch-audio-error']} Code: ` + res.status)
      return null
    }
    return res.json() // 后端返回: { base64Audio, traceid, mime_type }
  }

  const play = async () => {
    if (!input.trim()) {
      toast.error(t['input-text'])
      return
    }
    if (isLoading) return

    setLoading(true)
    try {
      const data = await fetchAudio()
      if (!data || !data.base64Audio) {
        toast.error(t['no-audio-returned'])
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
      toast.error(t['request-failed'])
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
      toast.warning(t['download-fail'])
      return
    }
    const response = await fetch(audioRef.current.src)
    const blob = await response.blob()
    saveAs(blob, `${t['file-name-prefix']}-${voice}${getFormatDate(new Date())}.${mimeType}`)
    toast.success(t['download-success'])
  }

  return (
    <div className="grow overflow-y-auto flex md:justify-center gap-10 py-5 px-6 flex-col md:flex-row">
      <div className="md:flex-1">
        <Toaster position="top-center" />

        {/* 文本输入框 */}
        <Textarea
          size="lg"
          disableAutosize
          placeholder={t['input-text']}
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
              title={t['download']}
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
              title={isPlaying ? t['pause'] : t['play']}
            />
          )}
        </div>
      </div>

      {/* 音色、speed、volume 设置 */}
      <div className="md:flex-1 flex flex-col gap-4">
        {/* 音频格式选择 */}
        <div>
          <h3 className="font-bold mb-2">{t['audio-format']}</h3>
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
          <h3 className="font-bold mb-2">{t['select-gender']}</h3>
          <div className="flex flex-wrap gap-2 pb-3">
            <Button color={gender === 'male' ? 'primary' : 'default'} onClick={() => setGender('male')}>
              {t['genders']['male']}
            </Button>
            <Button color={gender === 'female' ? 'primary' : 'default'} onClick={() => setGender('female')}>
              {t['genders']['female']}
            </Button>
          </div>
        </div>

        {/* 音色选择 */}
        <div>
          <h3 className="font-bold mb-2">{t['select-voice']}</h3>
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
          <h3 className="font-bold mb-2">{t['rate']}（0.50 ~ 2.00）</h3>
          <Slider
            step={0.01}
            minValue={0.5}
            maxValue={2.0}
            value={speed}
            onChange={(val: number | number[]) => {
              if (typeof val === 'number') setSpeed(parseFloat(val.toFixed(2)))
            }}
            aria-label={t['rate']}
          />
          <p className="mt-1">
            {t['current']}：{speed.toFixed(2)}
          </p>
        </div>

        {/* 音量调整 */}
        <div>
          <h3 className="font-bold mb-2">{t['volume']}（0.10 ~ 2.00）</h3>
          <Slider
            step={0.01}
            minValue={0.1}
            maxValue={2.0}
            value={volume}
            onChange={(val: number | number[]) => {
              if (typeof val === 'number') setVolume(parseFloat(val.toFixed(2)))
            }}
            aria-label="{t['volume']}"
          />
          <p className="mt-1">
            {t['current']}：{volume.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
