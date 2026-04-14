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
import Link from 'next/link'
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
const DRAFT_STORAGE_KEY = 'stepfun-tts-draft-v1'
const MAX_HISTORY_ITEMS = 10

type DraftPayload = {
  input: string
  mimeType: AudioFormat
  pronunciationInput: string
  sampleRate: SampleRateValue
  speed: number
  voice: string
  voiceLabelEmotion: VoiceLabelEmotionValue
  voiceLabelLanguage: VoiceLabelLanguageValue
  voiceLabelMode: VoiceLabelMode
  voiceLabelStyle: VoiceLabelStyleValue
  volume: number
}

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

function normalizeDraftPayload(item: Partial<DraftPayload>): DraftPayload | null {
  if (typeof item.input !== 'string' || !item.voice || !item.mimeType) {
    return null
  }

  return {
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
  }
}

function loadStoredDraft() {
  if (typeof window === 'undefined') {
    return null as DraftPayload | null
  }

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null

    return normalizeDraftPayload(JSON.parse(raw) as Partial<DraftPayload>)
  } catch (error) {
    console.error('Failed to read StepFun draft:', error)
    return null
  }
}

function persistDraft(item: DraftPayload) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(item))
  } catch (error) {
    console.error('Failed to persist StepFun draft:', error)
  }
}

function clearStoredDraft() {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear StepFun draft:', error)
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

function getCloneSourceMessage(lang: Locale, voice: string) {
  if (lang === 'cn') {
    return `已从声音克隆页自动带入音色 ${voice}，现在可以直接生成试听或继续微调参数。`
  }

  if (lang === 'jp') {
    return `音色クローンページで作成した ${voice} を自動で選択しました。このまま試聴を生成するか、各種設定を微調整できます。`
  }

  return `The cloned voice ${voice} has been preselected for you. You can generate audio right away or fine-tune the settings first.`
}

function getHistorySearchPlaceholder(lang: Locale) {
  if (lang === 'cn') return '搜索历史里的文本或音色'
  if (lang === 'jp') return '履歴のテキストや音色を検索'
  return 'Search history by text or voice'
}

function getHistoryEmptySearchMessage(lang: Locale) {
  if (lang === 'cn') return '没有匹配这次搜索的历史记录。'
  if (lang === 'jp') return 'この検索条件に一致する履歴はありません。'
  return 'No history items match this search.'
}

function getDraftAutosaveHint(lang: Locale) {
  if (lang === 'cn') return '当前文本和设置会自动临时保存在浏览器里。'
  if (lang === 'jp') return '現在のテキストと設定はブラウザ内に一時保存されます。'
  return 'Your current text and settings are temporarily saved in this browser.'
}

function getUseDefaultTextLabel(lang: Locale) {
  if (lang === 'cn') return '恢复示例文本'
  if (lang === 'jp') return 'サンプル文を入れる'
  return 'Use sample text'
}

function getResetDraftLabel(lang: Locale) {
  if (lang === 'cn') return '重置当前草稿'
  if (lang === 'jp') return '現在の草稿をリセット'
  return 'Reset current draft'
}

function getDraftResetMessage(lang: Locale) {
  if (lang === 'cn') return '已重置当前文本和设置。'
  if (lang === 'jp') return '現在のテキストと設定をリセットしました。'
  return 'The current text and settings have been reset.'
}

function getVoiceCloneCtaLabel(lang: Locale) {
  if (lang === 'cn') return '去克隆新音色'
  if (lang === 'jp') return '新しい音色を作る'
  return 'Clone a new voice'
}

function getUseLatestHistoryLabel(lang: Locale) {
  if (lang === 'cn') return '恢复最近一次结果'
  if (lang === 'jp') return '直近の結果を復元'
  return 'Restore latest result'
}

function getVoiceLabelAutofillMessage(lang: Locale) {
  if (lang === 'cn') return '选择了自定义音色，已自动补上推荐的 voice_label。'
  if (lang === 'jp') return 'カスタム音色を選択したため、推奨の voice_label を自動設定しました。'
  return 'A recommended voice_label was applied automatically for this custom voice.'
}

function getFriendlyGenerateErrorMessage(lang: Locale, error?: string, code?: string) {
  const normalized = `${code || ''} ${error || ''}`.toLowerCase()

  if (normalized.includes('voice_id_invalid') || normalized.includes('does not exist')) {
    if (lang === 'cn') return '当前音色不可用，可能已被删除，或当前 Key 没有权限访问。请重新选择音色。'
    if (lang === 'jp') {
      return 'この音色は利用できません。削除済みか、この API Key でアクセスできない可能性があります。別の音色を選んでください。'
    }
    return 'This voice is unavailable. It may have been removed, or your API key may not have access to it.'
  }

  if (normalized.includes('voice_label')) {
    if (lang === 'cn') return '当前音色需要设置 voice_label。请在语言、情绪或风格里至少选择一项。'
    if (lang === 'jp') return 'この音色では voice_label が必要です。言語・感情・話し方のいずれかを選択してください。'
    return 'This voice requires a voice_label. Please choose a language, emotion, or style option.'
  }

  if (normalized.includes('api key') || normalized.includes('unauthorized') || normalized.includes('invalid_api_key')) {
    if (lang === 'cn') return 'StepFun API Key 可能无效，或当前账号权限不足。请检查环境变量配置。'
    if (lang === 'jp') {
      return 'StepFun API Key が無効か、現在のアカウント権限が不足している可能性があります。環境変数を確認してください。'
    }
    return 'Your StepFun API key may be invalid, or the current account may not have permission for this request.'
  }

  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    if (lang === 'cn') return '请求过于频繁，请稍等几秒后再试。'
    if (lang === 'jp') return 'リクエストが多すぎます。数秒待ってからもう一度お試しください。'
    return 'You are sending requests too quickly. Please wait a few seconds and try again.'
  }

  return error || ''
}

export default function Content({
  t,
  lang,
  initialSource,
  initialVoice,
}: {
  t: Tran
  lang: Locale
  initialSource?: string
  initialVoice?: string
}) {
  const [input, setInput] = useState<string>(t['DEFAULT_TEXT'])
  const [isLoading, setLoading] = useState<boolean>(false)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null)
  const [history, setHistory] = useState<GeneratedAudio[]>([])
  const [historySearch, setHistorySearch] = useState('')
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false)
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
    const draft = loadStoredDraft()
    if (draft) {
      setInput(draft.input)
      setVoice(draft.voice)
      setSpeed(draft.speed)
      setVolume(draft.volume)
      setMimeType(draft.mimeType)
      setSampleRate(draft.sampleRate)
      setPronunciationRules(parsePronunciationRules(draft.pronunciationInput))
      setVoiceLabelMode(draft.voiceLabelMode)
      setVoiceLabelLanguage(draft.voiceLabelLanguage)
      setVoiceLabelEmotion(draft.voiceLabelEmotion)
      setVoiceLabelStyle(draft.voiceLabelStyle)
    }
    setHasLoadedDraft(true)
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
    if (!initialVoice) return
    setVoice(initialVoice)
  }, [initialVoice])

  useEffect(() => {
    if (!hasLoadedDraft) return

    persistDraft({
      input,
      voice,
      speed,
      volume,
      mimeType,
      sampleRate,
      pronunciationInput: serializePronunciationRules(pronunciationRules),
      voiceLabelMode,
      voiceLabelLanguage,
      voiceLabelEmotion,
      voiceLabelStyle,
    })
  }, [
    hasLoadedDraft,
    input,
    mimeType,
    pronunciationRules,
    sampleRate,
    speed,
    voice,
    voiceLabelEmotion,
    voiceLabelLanguage,
    voiceLabelMode,
    voiceLabelStyle,
    volume,
  ])

  useEffect(() => {
    if (initialSource === 'clone' && initialVoice) {
      const message =
        lang === 'cn'
          ? `已自动带入音色 ${initialVoice}`
          : lang === 'jp'
            ? `音色 ${initialVoice} を自動で選択しました`
            : `Voice ${initialVoice} has been selected.`
      toast.success(message)
    }
  }, [initialSource, initialVoice, lang])

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
  const generatedAudioSource = generatedAudio
    ? `data:${generatedAudio.mime_type};base64,${generatedAudio.base64Audio}`
    : ''
  const filteredHistory = useMemo(() => {
    const keyword = historySearch.trim().toLowerCase()
    if (!keyword) return history

    return history.filter(item => {
      const haystack = [item.input, item.voice, voiceNameMap[item.voice] || '', item.mimeType, item.pronunciationInput]
        .join('\n')
        .toLowerCase()

      return haystack.includes(keyword)
    })
  }, [history, historySearch, voiceNameMap])
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

  useEffect(() => {
    if (!selectedVoiceIsCustom || currentVoiceLabel) return

    if (lang === 'jp') {
      setVoiceLabelMode('language')
      setVoiceLabelLanguage('Japanese')
    } else {
      setVoiceLabelMode('emotion')
      setVoiceLabelEmotion('Neutral')
    }

    toast.message(getVoiceLabelAutofillMessage(lang))
  }, [currentVoiceLabel, lang, selectedVoiceIsCustom])

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
      const friendlyMessage = getFriendlyGenerateErrorMessage(lang, errorData?.error, errorData?.code)
      toast.error(friendlyMessage || `${t['fetch-audio-error']} Code: ${res.status}`)
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

  const restoreDefaultText = () => {
    setInput(t['DEFAULT_TEXT'])
  }

  const resetDraft = () => {
    setInput(t['DEFAULT_TEXT'])
    setVoice(initialVoice || 'zixinnansheng')
    setSpeed(1)
    setVolume(1)
    setMimeType('mp3')
    setSampleRate('default')
    setPronunciationRules([])
    setVoiceLabelMode(defaultVoiceLabelLanguage === 'Japanese' ? 'language' : 'none')
    setVoiceLabelLanguage(defaultVoiceLabelLanguage)
    setVoiceLabelEmotion('Happy')
    setVoiceLabelStyle('Serious')
    setGeneratedAudio(null)
    setHistorySearch('')
    clearStoredDraft()
    toast.success(getDraftResetMessage(lang))
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
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-sm text-default-500">
            {input.length}/{STEPFUN_MAX_INPUT_LENGTH} · {getDraftAutosaveHint(lang)}
          </p>
          <div className="flex flex-wrap gap-2">
            {history.length > 0 && (
              <Button size="sm" variant="flat" onPress={() => applyHistoryItem(history[0])}>
                {getUseLatestHistoryLabel(lang)}
              </Button>
            )}
            <Button size="sm" variant="flat" onPress={restoreDefaultText}>
              {getUseDefaultTextLabel(lang)}
            </Button>
            <Button size="sm" color="danger" variant="light" onPress={resetDraft}>
              {getResetDraftLabel(lang)}
            </Button>
          </div>
        </div>

        {initialSource === 'clone' && initialVoice && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {getCloneSourceMessage(lang, initialVoice)}
          </div>
        )}

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
            <p className="text-sm text-default-600">{voiceNameMap[generatedAudio.voice] || generatedAudio.voice}</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs text-default-700">
                {generatedAudio.voice}
              </span>
              <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs text-default-700">
                {generatedAudio.mimeType.toUpperCase()}
              </span>
              <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs text-default-700">
                {t['rate']} {generatedAudio.speed.toFixed(2)}
              </span>
              <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs text-default-700">
                {t['volume']} {generatedAudio.volume.toFixed(2)}
              </span>
              <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs text-default-700">
                {t['sample-rate']} {sampleRateLabelMap[generatedAudio.sampleRate] || generatedAudio.sampleRate}
              </span>
            </div>
            {generatedAudio.mime_type !== 'audio/pcm' && (
              <audio controls className="w-full" src={generatedAudioSource} />
            )}
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

          {history.length > 0 && (
            <input
              className="w-full rounded-xl border border-default-200 bg-transparent px-3 py-2 text-sm"
              placeholder={getHistorySearchPlaceholder(lang)}
              value={historySearch}
              onChange={event => setHistorySearch(event.target.value)}
            />
          )}

          {history.length === 0 ? (
            <p className="text-sm text-default-500">{t['no-history']}</p>
          ) : filteredHistory.length === 0 ? (
            <p className="text-sm text-default-500">{getHistoryEmptySearchMessage(lang)}</p>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map(item => {
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
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="font-bold">{t['custom-voices']}</h3>
            <Link
              href={`/${lang}/voice-clone`}
              className="text-sm text-primary underline underline-offset-4 hover:opacity-80"
            >
              {getVoiceCloneCtaLabel(lang)}
            </Link>
          </div>
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
            <Button
              color={voiceLabelMode === 'none' ? 'primary' : 'default'}
              isDisabled={selectedVoiceIsCustom}
              onPress={() => setVoiceLabelMode('none')}
            >
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
