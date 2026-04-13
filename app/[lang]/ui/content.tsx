// app/[lang]/ui/content.tsx
'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  faCircleDown,
  faCirclePause,
  faCirclePlay,
  faClockRotateLeft,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from '@nextui-org/button'
import { Textarea } from '@nextui-org/input'
import { Slider } from '@nextui-org/slider'
import { toast, Toaster } from 'sonner'
import VoiceCard from '@/app/[lang]/ui/components/VoiceCard'
import {
  MIME_TYPES,
  SAMPLE_RATE_OPTIONS,
  STEPFUN_MAX_INPUT_LENGTH,
  STEPFUN_VOICES,
  VOICE_LABEL_EMOTION_OPTIONS,
  VOICE_LABEL_LANGUAGE_OPTIONS,
  VOICE_LABEL_STYLE_OPTIONS,
} from '@/app/lib/constants'
import { base64AudioToBlobUrl, getFormatDate, saveAs } from '@/app/lib/tools'
import { Tran } from '@/app/lib/types'
import type { Locale } from '@/app/lib/i18n/i18n-config'

type AudioFormat = 'wav' | 'mp3' | 'aac' | 'flac' | 'opus' | 'pcm'
type VoiceLabelMode = 'none' | 'language' | 'emotion' | 'style'
type VoiceLabelLanguageValue = (typeof VOICE_LABEL_LANGUAGE_OPTIONS)[number]['value']
type VoiceLabelEmotionValue = (typeof VOICE_LABEL_EMOTION_OPTIONS)[number]['value']
type VoiceLabelStyleValue = (typeof VOICE_LABEL_STYLE_OPTIONS)[number]['value']
type SampleRateValue = (typeof SAMPLE_RATE_OPTIONS)[number]['value']

type VoiceLabelOption<T extends string> = {
  label: string
  value: T
}

type CustomVoice = {
  label: string
  value: string
}

type VoiceLabelPayload = {
  language?: string
  emotion?: string
  style?: string
}

type PronunciationRule = {
  id: string
  source: string
  target: string
}

type GeneratedAudio = {
  id: string
  base64Audio: string
  mime_type: string
  input: string
  voice: string
  speed: number
  volume: number
  mimeType: AudioFormat
  sampleRate: SampleRateValue
  pronunciationInput: string
  voiceLabelMode: VoiceLabelMode
  voiceLabelLanguage: VoiceLabelLanguageValue
  voiceLabelEmotion: VoiceLabelEmotionValue
  voiceLabelStyle: VoiceLabelStyleValue
  createdAt: string
}

const HISTORY_STORAGE_KEY = 'stepfun-tts-history-v1'
const MAX_HISTORY_ITEMS = 10

function getDefaultVoiceLabelLanguage(lang: Locale) {
  return lang === 'jp' ? 'Japanese' : 'Auto'
}

function getOptionLabel<T extends string>(options: ReadonlyArray<VoiceLabelOption<T>>, value: T) {
  return options.find(option => option.value === value)?.label || value
}

function parsePronunciationMap(input: string) {
  const entries = input
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const separatorIndex = line.indexOf('=')
      if (separatorIndex === -1) return null

      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim()
      if (!key || !value) return null
      return [key, value] as const
    })
    .filter((item): item is readonly [string, string] => item !== null)

  if (entries.length === 0) {
    return undefined
  }

  return Object.fromEntries(entries)
}

function parsePronunciationRules(input: string): PronunciationRule[] {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const separatorIndex = line.indexOf('=')
      if (separatorIndex === -1) return null

      const source = line.slice(0, separatorIndex).trim()
      const target = line.slice(separatorIndex + 1).trim()
      if (!source || !target) return null

      return {
        id: `${index}-${source}-${target}`,
        source,
        target,
      }
    })
    .filter((item): item is PronunciationRule => item !== null)
}

function serializePronunciationRules(rules: PronunciationRule[]) {
  return rules
    .map(rule => `${rule.source.trim()}=${rule.target.trim()}`)
    .filter(line => line !== '=' && !line.startsWith('=') && !line.endsWith('='))
    .join('\n')
}

function getVoiceLabelSummary(
  mode: VoiceLabelMode,
  language: VoiceLabelLanguageValue,
  emotion: VoiceLabelEmotionValue,
  style: VoiceLabelStyleValue,
  t: Tran,
) {
  if (mode === 'none') {
    return t['voice-label-current-none']
  }

  if (mode === 'language') {
    return language === 'Auto'
      ? t['voice-label-current-auto']
      : `${t['voice-label-current-prefix']} language = ${language}`
  }

  if (mode === 'emotion') {
    return `${t['voice-label-current-prefix']} emotion = ${emotion}`
  }

  return `${t['voice-label-current-prefix']} style = ${style}`
}

function getVoiceLabelTag(
  mode: VoiceLabelMode,
  language: VoiceLabelLanguageValue,
  emotion: VoiceLabelEmotionValue,
  style: VoiceLabelStyleValue,
  t: Tran,
) {
  if (mode === 'none') {
    return null
  }

  if (mode === 'language') {
    const languageLabel = language === 'Auto' ? t['auto-detect-language'] : language
    return `${t['voice-label']}: ${languageLabel}`
  }

  if (mode === 'emotion') {
    return `${t['voice-label']}: ${getOptionLabel(VOICE_LABEL_EMOTION_OPTIONS, emotion)}`
  }

  return `${t['voice-label']}: ${getOptionLabel(VOICE_LABEL_STYLE_OPTIONS, style)}`
}

function normalizeHistoryItem(item: Partial<GeneratedAudio>): GeneratedAudio | null {
  if (!item.base64Audio || !item.mime_type || !item.input || !item.voice || !item.mimeType || !item.createdAt) {
    return null
  }

  return {
    id: item.id || `${Date.now()}-${Math.random()}`,
    base64Audio: item.base64Audio,
    mime_type: item.mime_type,
    input: item.input,
    voice: item.voice,
    speed: typeof item.speed === 'number' ? item.speed : 1,
    volume: typeof item.volume === 'number' ? item.volume : 1,
    mimeType: item.mimeType,
    sampleRate: item.sampleRate || 'default',
    pronunciationInput: item.pronunciationInput || '',
    voiceLabelMode: item.voiceLabelMode || 'none',
    voiceLabelLanguage: item.voiceLabelLanguage || 'Auto',
    voiceLabelEmotion: item.voiceLabelEmotion || 'Happy',
    voiceLabelStyle: item.voiceLabelStyle || 'Serious',
    createdAt: item.createdAt,
  }
}

function loadStoredHistory() {
  if (typeof window === 'undefined') {
    return [] as GeneratedAudio[]
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed
          .map(item => normalizeHistoryItem(item as Partial<GeneratedAudio>))
          .filter((item): item is GeneratedAudio => item !== null)
      : []
  } catch (error) {
    console.error('Failed to read StepFun history:', error)
    return []
  }
}

function persistHistory(items: GeneratedAudio[]) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)))
  } catch (error) {
    console.error('Failed to persist StepFun history:', error)
    toast.error('History storage is full.')
  }
}

export default function Content({ t, lang }: { t: Tran; lang: Locale }) {
  const [input, setInput] = useState<string>(t['DEFAULT_TEXT'])
  const [isLoading, setLoading] = useState<boolean>(false)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null)
  const [history, setHistory] = useState<GeneratedAudio[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioUrlRef = useRef<string | null>(null)
  const defaultVoiceLabelLanguage = getDefaultVoiceLabelLanguage(lang)

  // StepFun 需要的配置项
  const [voice, setVoice] = useState('zixinnansheng')
  const [speed, setSpeed] = useState(1.0)
  const [volume, setVolume] = useState(1.0)
  const [mimeType, setMimeType] = useState<AudioFormat>('mp3')
  const [sampleRate, setSampleRate] = useState<SampleRateValue>('default')
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [pronunciationRules, setPronunciationRules] = useState<PronunciationRule[]>([])
  const [voiceLabelMode, setVoiceLabelMode] = useState<VoiceLabelMode>(
    defaultVoiceLabelLanguage === 'Japanese' ? 'language' : 'none',
  )
  const [voiceLabelLanguage, setVoiceLabelLanguage] = useState<VoiceLabelLanguageValue>(defaultVoiceLabelLanguage)
  const [voiceLabelEmotion, setVoiceLabelEmotion] = useState<VoiceLabelEmotionValue>('Happy')
  const [voiceLabelStyle, setVoiceLabelStyle] = useState<VoiceLabelStyleValue>('Serious')
  const [customVoices, setCustomVoices] = useState<CustomVoice[]>([])

  useEffect(() => {
    setHistory(loadStoredHistory())
  }, [])

  useEffect(() => {
    setVoiceLabelLanguage(defaultVoiceLabelLanguage)
    setVoiceLabelMode(defaultVoiceLabelLanguage === 'Japanese' ? 'language' : 'none')
  }, [defaultVoiceLabelLanguage])

  useEffect(() => {
    let ignore = false

    async function loadCustomVoices() {
      try {
        const res = await fetch('/api/audio/voices', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (ignore || !Array.isArray(data?.data)) return

        setCustomVoices(
          data.data.map((item: { id: string }) => ({
            value: item.id,
            label: item.id,
          })),
        )
      } catch (error) {
        console.error('Failed to load custom voices:', error)
      }
    }

    loadCustomVoices()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current)
      }
    }
  }, [])

  const translatedVoices = useMemo(
    () =>
      STEPFUN_VOICES.map(voiceItem => ({
        ...voiceItem,
        label: t['voices'][voiceItem.value] || voiceItem.label,
      })),
    [t],
  )
  const voiceNameMap = useMemo(
    () => Object.fromEntries(translatedVoices.map(voiceItem => [voiceItem.value, voiceItem.label])),
    [translatedVoices],
  )
  const sampleRateLabelMap = useMemo(
    () =>
      Object.fromEntries(
        SAMPLE_RATE_OPTIONS.map(item => [item.value, item.value === 'default' ? t['default-setting'] : item.label]),
      ),
    [t],
  )

  const selectedVoiceIsCustom = customVoices.some(item => item.value === voice)
  const voiceLabelModeLabels = t['voice-label-modes'] || {
    none: 'None',
    language: 'Language',
    emotion: 'Emotion',
    style: 'Style',
  }
  const activeVoiceLabelSummary = getVoiceLabelSummary(
    voiceLabelMode,
    voiceLabelLanguage,
    voiceLabelEmotion,
    voiceLabelStyle,
    t,
  )

  const currentVoiceLabel = useMemo<VoiceLabelPayload | undefined>(() => {
    if (voiceLabelMode === 'language' && voiceLabelLanguage !== 'Auto') {
      return { language: voiceLabelLanguage }
    }

    if (voiceLabelMode === 'emotion') {
      return { emotion: voiceLabelEmotion }
    }

    if (voiceLabelMode === 'style') {
      return { style: voiceLabelStyle }
    }

    return undefined
  }, [voiceLabelEmotion, voiceLabelLanguage, voiceLabelMode, voiceLabelStyle])

  const playAudio = async (base64Audio: string, audioMimeType: string) => {
    if (audioMimeType === 'audio/pcm') {
      toast.warning(t['pcm-preview-warning'])
      return
    }

    const url = base64AudioToBlobUrl(base64Audio, audioMimeType)

    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current)
    }
    currentAudioUrlRef.current = url

    if (!audioRef.current) {
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => setIsPlaying(false)
    } else {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = url
    }

    setIsPlaying(true)
    await audioRef.current.play()
  }

  const saveHistoryItem = (item: GeneratedAudio) => {
    const nextHistory = [item, ...history.filter(historyItem => historyItem.id !== item.id)].slice(0, MAX_HISTORY_ITEMS)
    setHistory(nextHistory)
    persistHistory(nextHistory)
  }

  const fetchAudio = async () => {
    if (selectedVoiceIsCustom && !currentVoiceLabel) {
      toast.error(t['voice-label-required'])
      return null
    }

    const pronunciationInput = serializePronunciationRules(pronunciationRules)
    const pronunciationMap = parsePronunciationMap(pronunciationInput)

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
          voice_label: currentVoiceLabel,
          sample_rate: sampleRate === 'default' ? undefined : Number(sampleRate),
          pronunciation_map: pronunciationMap,
        },
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      toast.error(errorData?.error || `${t['fetch-audio-error']} Code: ${res.status}`)
      return null
    }

    const data = await res.json()
    return {
      ...data,
      id: `${Date.now()}`,
      input,
      voice,
      speed,
      volume,
      mimeType,
      sampleRate,
      pronunciationInput,
      voiceLabelMode,
      voiceLabelLanguage,
      voiceLabelEmotion,
      voiceLabelStyle,
      createdAt: new Date().toISOString(),
    } as GeneratedAudio
  }

  const generateAudio = async (autoPlay: boolean) => {
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

      setGeneratedAudio(data)
      saveHistoryItem(data)

      if (autoPlay) {
        await playAudio(data.base64Audio, data.mime_type)
      } else {
        toast.success(t['audio-generated'])
      }
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

  const downloadAudio = async (item: GeneratedAudio | null) => {
    if (!item) {
      toast.warning(t['download-fail'])
      return
    }

    const url = base64AudioToBlobUrl(item.base64Audio, item.mime_type)
    const response = await fetch(url)
    const blob = await response.blob()
    URL.revokeObjectURL(url)
    saveAs(blob, `${t['file-name-prefix']}-${item.voice}${getFormatDate(new Date(item.createdAt))}.${item.mimeType}`)
    toast.success(t['download-success'])
  }

  const applyHistoryItem = (item: GeneratedAudio) => {
    setInput(item.input)
    setVoice(item.voice)
    setSpeed(item.speed)
    setVolume(item.volume)
    setMimeType(item.mimeType)
    setSampleRate(item.sampleRate)
    setPronunciationRules(parsePronunciationRules(item.pronunciationInput))
    setVoiceLabelMode(item.voiceLabelMode)
    setVoiceLabelLanguage(item.voiceLabelLanguage)
    setVoiceLabelEmotion(item.voiceLabelEmotion)
    setVoiceLabelStyle(item.voiceLabelStyle)
    setGeneratedAudio(item)
    toast.success(t['history-loaded'])
  }

  const removeHistoryItem = (id: string) => {
    const nextHistory = history.filter(item => item.id !== id)
    setHistory(nextHistory)
    persistHistory(nextHistory)
  }

  const clearHistory = () => {
    setHistory([])
    persistHistory([])
  }

  const addPronunciationRule = () => {
    setPronunciationRules(prev => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        source: '',
        target: '',
      },
    ])
  }

  const updatePronunciationRule = (id: string, field: 'source' | 'target', value: string) => {
    setPronunciationRules(prev => prev.map(rule => (rule.id === id ? { ...rule, [field]: value } : rule)))
  }

  const removePronunciationRule = (id: string) => {
    setPronunciationRules(prev => prev.filter(rule => rule.id !== id))
  }

  return (
    <div className="grow overflow-y-auto flex md:justify-center gap-10 py-5 px-6 flex-col md:flex-row">
      <div className="md:flex-1">
        <Toaster position="top-center" />

        <Textarea
          size="lg"
          disableAutosize
          placeholder={t['input-text']}
          value={input}
          maxLength={STEPFUN_MAX_INPUT_LENGTH}
          onChange={e => setInput(e.target.value)}
          classNames={{ input: 'resize-y min-h-[200px]' }}
        />
        <p className="text-right pt-2">
          {input.length}/{STEPFUN_MAX_INPUT_LENGTH}
        </p>

        <div className="pt-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <Button color="primary" onPress={() => generateAudio(true)} isLoading={isLoading}>
              {t['generate-and-play']}
            </Button>
            <Button variant="flat" onPress={() => generateAudio(false)} isDisabled={isLoading}>
              {t['generate-only']}
            </Button>
            <Button
              variant="flat"
              onPress={() => (generatedAudio ? playAudio(generatedAudio.base64Audio, generatedAudio.mime_type) : null)}
              isDisabled={!generatedAudio || isLoading || generatedAudio.mime_type === 'audio/pcm'}
            >
              {t['play-current']}
            </Button>
            <Button variant="flat" onPress={pause} isDisabled={!isPlaying}>
              {t['pause']}
            </Button>
            <Button variant="flat" onPress={() => downloadAudio(generatedAudio)} isDisabled={!generatedAudio}>
              {t['download']}
            </Button>
          </div>
        </div>

        {generatedAudio && (
          <div className="mt-5 rounded-xl border border-default-200 p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold">{t['latest-result']}</h3>
              <span className="text-sm text-default-500">{new Date(generatedAudio.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-default-600">
              {generatedAudio.voice} · {generatedAudio.mimeType.toUpperCase()} · {t['rate']}{' '}
              {generatedAudio.speed.toFixed(2)} · {t['volume']} {generatedAudio.volume.toFixed(2)}
            </p>
            <div className="flex gap-3 text-blue-600">
              <button type="button" onClick={() => playAudio(generatedAudio.base64Audio, generatedAudio.mime_type)}>
                <FontAwesomeIcon icon={faCirclePlay} className="w-6 h-6" />
              </button>
              <button type="button" onClick={pause}>
                <FontAwesomeIcon icon={faCirclePause} className="w-6 h-6" />
              </button>
              <button type="button" onClick={() => downloadAudio(generatedAudio)}>
                <FontAwesomeIcon icon={faCircleDown} className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 rounded-xl border border-default-200 p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">{t['history-title']}</h3>
              <p className="text-sm text-default-500">{t['history-description']}</p>
            </div>
            <Button variant="light" color="danger" onPress={clearHistory} isDisabled={history.length === 0}>
              {t['clear-history']}
            </Button>
          </div>

          {history.length === 0 ? (
            <p className="text-sm text-default-500">{t['no-history']}</p>
          ) : (
            <div className="space-y-3">
              {history.map(item => {
                const voiceLabelTag = getVoiceLabelTag(
                  item.voiceLabelMode,
                  item.voiceLabelLanguage,
                  item.voiceLabelEmotion,
                  item.voiceLabelStyle,
                  t,
                )
                const pronunciationRuleCount = parsePronunciationRules(item.pronunciationInput).length

                return (
                  <div key={item.id} className="rounded-lg border border-default-100 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{voiceNameMap[item.voice] || item.voice}</p>
                        <p className="text-xs text-default-500">{item.voice}</p>
                        <p className="text-xs text-default-500">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-3 text-default-500">
                        <button type="button" onClick={() => applyHistoryItem(item)} title={t['use-history']}>
                          <FontAwesomeIcon icon={faClockRotateLeft} className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeHistoryItem(item.id)}
                          title={t['delete-history-item']}
                        >
                          <FontAwesomeIcon icon={faTrashCan} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs text-default-700">
                        {item.mimeType.toUpperCase()}
                      </span>
                      <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs text-default-700">
                        {t['rate']} {item.speed.toFixed(2)}
                      </span>
                      <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs text-default-700">
                        {t['volume']} {item.volume.toFixed(2)}
                      </span>
                      <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs text-default-700">
                        {t['sample-rate']} {sampleRateLabelMap[item.sampleRate] || item.sampleRate}
                      </span>
                      {voiceLabelTag && (
                        <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs text-default-700">
                          {voiceLabelTag}
                        </span>
                      )}
                      {pronunciationRuleCount > 0 && (
                        <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs text-default-700">
                          {t['pronunciation-map']} {pronunciationRuleCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2 text-default-700">{item.input}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="flat" onPress={() => playAudio(item.base64Audio, item.mime_type)}>
                        {t['play']}
                      </Button>
                      <Button size="sm" variant="flat" onPress={() => downloadAudio(item)}>
                        {t['download']}
                      </Button>
                      <Button size="sm" variant="flat" onPress={() => applyHistoryItem(item)}>
                        {t['use-history']}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="md:flex-1 flex flex-col gap-4">
        <div>
          <h3 className="font-bold mb-2">{t['audio-format']}</h3>
          <div className="flex flex-wrap gap-2 pb-3">
            {MIME_TYPES.map(item => (
              <Button
                key={item.value}
                color={item.value === mimeType ? 'primary' : 'default'}
                onPress={() => setMimeType(item.value as AudioFormat)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-2">{t['official-voices']}</h3>
          <div className="flex flex-wrap gap-2 pb-3">
            {translatedVoices.map(item => (
              <VoiceCard
                key={item.value}
                voiceItem={item}
                selectedVoice={voice}
                onSelect={voiceValue => setVoice(voiceValue)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-2">{t['custom-voices']}</h3>
          {customVoices.length > 0 ? (
            <div className="flex flex-wrap gap-2 pb-3">
              {customVoices.map(item => (
                <Button
                  key={item.value}
                  color={item.value === voice ? 'primary' : 'default'}
                  onPress={() => setVoice(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-default-500 pb-3">{t['no-custom-voices']}</p>
          )}
        </div>

        <div className="rounded-xl border border-default-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">{t['advanced-settings']}</h3>
              <p className="text-sm text-default-500">{t['advanced-settings-description']}</p>
            </div>
            <Button variant="flat" onPress={() => setShowAdvancedSettings(prev => !prev)}>
              {showAdvancedSettings ? t['collapse-advanced'] : t['expand-advanced']}
            </Button>
          </div>

          {showAdvancedSettings && (
            <div className="pt-4 space-y-5">
              <div>
                <h4 className="font-bold mb-2">{t['sample-rate']}</h4>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_RATE_OPTIONS.map(item => (
                    <Button
                      key={item.value}
                      color={item.value === sampleRate ? 'primary' : 'default'}
                      onPress={() => setSampleRate(item.value)}
                    >
                      {item.value === 'default' ? t['default-setting'] : item.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <h4 className="font-bold">{t['pronunciation-map']}</h4>
                    <p className="text-sm text-default-500">{t['pronunciation-map-help']}</p>
                  </div>
                  <Button size="sm" variant="flat" onPress={addPronunciationRule}>
                    {t['add-pronunciation-rule']}
                  </Button>
                </div>

                {pronunciationRules.length === 0 ? (
                  <p className="text-sm text-default-500">{t['no-pronunciation-rules']}</p>
                ) : (
                  <div className="space-y-3">
                    {pronunciationRules.map(rule => (
                      <div key={rule.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                        <input
                          className="w-full rounded-lg border border-default-200 bg-transparent px-3 py-2 text-sm"
                          placeholder={t['pronunciation-source-placeholder']}
                          value={rule.source}
                          onChange={e => updatePronunciationRule(rule.id, 'source', e.target.value)}
                        />
                        <input
                          className="w-full rounded-lg border border-default-200 bg-transparent px-3 py-2 text-sm"
                          placeholder={t['pronunciation-target-placeholder']}
                          value={rule.target}
                          onChange={e => updatePronunciationRule(rule.id, 'target', e.target.value)}
                        />
                        <Button color="danger" variant="light" onPress={() => removePronunciationRule(rule.id)}>
                          {t['remove-pronunciation-rule']}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-bold mb-2">{t['voice-label']}</h3>
          <p className="text-sm text-default-500 pb-3">{t['voice-label-description']}</p>
          <p className="text-sm text-default-500 pb-3">{activeVoiceLabelSummary}</p>
          {selectedVoiceIsCustom && <p className="text-sm text-amber-600 pb-3">{t['voice-label-required']}</p>}

          <div className="flex flex-wrap gap-2 pb-3">
            <Button color={voiceLabelMode === 'none' ? 'primary' : 'default'} onPress={() => setVoiceLabelMode('none')}>
              {voiceLabelModeLabels['none']}
            </Button>
            <Button
              color={voiceLabelMode === 'language' ? 'primary' : 'default'}
              onPress={() => setVoiceLabelMode('language')}
            >
              {voiceLabelModeLabels['language']}
            </Button>
            <Button
              color={voiceLabelMode === 'emotion' ? 'primary' : 'default'}
              onPress={() => setVoiceLabelMode('emotion')}
            >
              {voiceLabelModeLabels['emotion']}
            </Button>
            <Button
              color={voiceLabelMode === 'style' ? 'primary' : 'default'}
              onPress={() => setVoiceLabelMode('style')}
            >
              {voiceLabelModeLabels['style']}
            </Button>
          </div>

          {voiceLabelMode === 'language' && (
            <div className="space-y-2 pb-3">
              <p className="text-sm text-default-500">{t['voice-label-language-help']}</p>
              <div className="flex flex-wrap gap-2">
                {VOICE_LABEL_LANGUAGE_OPTIONS.map((item: VoiceLabelOption<VoiceLabelLanguageValue>) => (
                  <Button
                    key={item.value}
                    color={item.value === voiceLabelLanguage ? 'primary' : 'default'}
                    onPress={() => setVoiceLabelLanguage(item.value)}
                  >
                    {item.value === 'Auto' ? t['auto-detect-language'] : item.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {voiceLabelMode === 'emotion' && (
            <div className="flex flex-wrap gap-2 pb-3">
              {VOICE_LABEL_EMOTION_OPTIONS.map((item: VoiceLabelOption<VoiceLabelEmotionValue>) => (
                <Button
                  key={item.value}
                  color={item.value === voiceLabelEmotion ? 'primary' : 'default'}
                  onPress={() => setVoiceLabelEmotion(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          )}

          {voiceLabelMode === 'style' && (
            <div className="flex flex-wrap gap-2 pb-3">
              {VOICE_LABEL_STYLE_OPTIONS.map((item: VoiceLabelOption<VoiceLabelStyleValue>) => (
                <Button
                  key={item.value}
                  color={item.value === voiceLabelStyle ? 'primary' : 'default'}
                  onPress={() => setVoiceLabelStyle(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-bold mb-2">{t['rate']} (0.50 ~ 2.00)</h3>
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
            {t['current']}: {speed.toFixed(2)}
          </p>
        </div>

        <div>
          <h3 className="font-bold mb-2">{t['volume']} (0.10 ~ 2.00)</h3>
          <Slider
            step={0.01}
            minValue={0.1}
            maxValue={2.0}
            value={volume}
            onChange={(val: number | number[]) => {
              if (typeof val === 'number') setVolume(parseFloat(val.toFixed(2)))
            }}
            aria-label={t['volume']}
          />
          <p className="mt-1">
            {t['current']}: {volume.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
