'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@nextui-org/button'
import { Textarea } from '@nextui-org/input'
import Link from 'next/link'
import { toast, Toaster } from 'sonner'
import FileUploader from '@/app/[lang]/ui/components/voice-clone/FileUploader'
import Recorder from '@/app/[lang]/ui/components/voice-clone/Recorder'
import { saveAs } from '@/app/lib/tools'
import type { Locale } from '@/app/lib/i18n/i18n-config'

type VoiceCloneClientProps = {
  lang: Locale
}

type VoiceCloneResult = {
  duplicated?: boolean
  id: string
  sample_audio?: string
  sample_text?: string
}

type CustomVoice = {
  created_at?: number
  id: string
}

type PageCopy = {
  accountVoices: string
  accountVoicesDesc: string
  autoTranscribe: string
  changeAudio: string
  cloneSuccess: string
  cloneStepsDone: string
  cloneStepsIdle: string
  cloneStepsWorking: string
  cloning: string
  copyVoiceId: string
  copyVoiceIdFailed: string
  copied: string
  currentClip: string
  downloadPreview: string
  downloadPreviewError: string
  downloadPreviewSuccess: string
  emptyVoices: string
  fillPreviewFromTranscript: string
  generateVoice: string
  generateVoiceHint: string
  intro: string
  jumpReady: string
  noPreviewAudio: string
  optional: string
  pageTitle: string
  previewAudio: string
  previewText: string
  previewTextHelp: string
  previewTooLong: string
  readyForGenerate: string
  recordLabel: string
  recordStart: string
  recordStop: string
  resetForm: string
  refreshVoices: string
  resultTitle: string
  sampleLimit: string
  selectAudioFirst: string
  sourceAudio: string
  sourceAudioHelp: string
  transcript: string
  transcriptHelp: string
  transcriptPlaceholder: string
  transcriptRequired: string
  unsupportedRecorder: string
  uploadAudio: string
  uploadStep: string
  useInGenerate: string
  useThisVoice: string
  voiceId: string
  voiceReadyToast: string
  waitingForFile: string
  cloneCreating: string
  transcriptStep: string
  resultStep: string
  suggestedPreview: string
}

const SAMPLE_TEXT_MAX_LENGTH = 50
const FILE_READY_POLL_INTERVAL_MS = 1000
const FILE_READY_POLL_ATTEMPTS = 15

const PAGE_COPY: Record<Locale, PageCopy> = {
  cn: {
    accountVoices: '我的可用音色',
    accountVoicesDesc: '成功克隆后，这里会刷新当前账号下可用的自定义音色。',
    autoTranscribe: '自动识别文本',
    changeAudio: '更换音频',
    cloneSuccess: '音色克隆成功。',
    cloneStepsDone: '已完成',
    cloneStepsIdle: '待处理',
    cloneStepsWorking: '进行中',
    cloning: '开始克隆',
    copyVoiceId: '复制 Voice ID',
    copyVoiceIdFailed: '复制 Voice ID 失败。',
    copied: '已复制',
    currentClip: '当前音频',
    downloadPreview: '下载试听音频',
    downloadPreviewError: '下载试听音频失败。',
    downloadPreviewSuccess: '试听音频已开始下载。',
    emptyVoices: '当前账号下还没有可用的自定义音色。',
    fillPreviewFromTranscript: '用文本前 50 字生成试听',
    generateVoice: '去生成语音页使用',
    generateVoiceHint: '克隆结果可直接拿到生成语音页面使用，试听文本是可选项。',
    intro:
      '按照最新接口流程：先上传 5~10 秒的 MP3/WAV 音频，再提供对应文本，' +
      '可选填写 50 字以内的试听文本生成预览音频。',
    jumpReady: '克隆成功后会自动刷新右侧音色列表，你也可以直接把 Voice ID 带到生成页继续使用。',
    noPreviewAudio: '本次未返回试听音频，可直接复制 Voice ID 到生成语音页面使用。',
    optional: '可选',
    pageTitle: '声音克隆',
    previewAudio: '试听音频',
    previewText: '试听文本',
    previewTextHelp: '可留空；如果填写，建议控制在 50 字以内，用来生成 sample_audio 试听。',
    previewTooLong: '试听文本最多 50 个字符。',
    readyForGenerate: '音色已生成，可以复制 Voice ID 或直接跳到生成语音页面继续使用。',
    recordLabel: '录音',
    recordStart: '开始录音',
    recordStop: '停止录音',
    resetForm: '重置',
    refreshVoices: '刷新列表',
    resultTitle: '克隆结果',
    sampleLimit: '建议 5~10 秒，语音清晰、单人说话，尽量避免噪音。',
    selectAudioFirst: '请先录音或上传音频。',
    sourceAudio: '音频样本',
    sourceAudioHelp: '支持 MP3/WAV。录音后会自动转成标准 WAV，方便直接上传到最新接口。',
    transcript: '音频对应文本',
    transcriptHelp: '这是克隆时的必填文本，需要和音频内容一致。你可以手动填写，也可以先自动识别。',
    transcriptPlaceholder: '请输入音频里说的内容',
    transcriptRequired: '请先填写或识别音频文本。',
    unsupportedRecorder: '当前浏览器不支持可用的录音格式，请尝试更新或更换浏览器。',
    uploadAudio: '上传音频',
    uploadStep: '准备音频',
    useInGenerate: '立即去生成语音',
    useThisVoice: '用这个音色生成',
    voiceId: 'Voice ID',
    voiceReadyToast: '已自动带入刚克隆的音色。',
    waitingForFile: '音频已上传，正在等待 StepFun 处理文件…',
    cloneCreating: '文件已就绪，正在创建音色…',
    transcriptStep: '填写文本',
    resultStep: '使用结果',
    suggestedPreview: '填入推荐试听文本',
  },
  en: {
    accountVoices: 'Available custom voices',
    accountVoicesDesc: 'After cloning succeeds, this list refreshes the custom voices available on your account.',
    autoTranscribe: 'Auto transcribe',
    changeAudio: 'Replace audio',
    cloneSuccess: 'Voice cloned successfully.',
    cloneStepsDone: 'Done',
    cloneStepsIdle: 'Pending',
    cloneStepsWorking: 'Working',
    cloning: 'Clone voice',
    copyVoiceId: 'Copy Voice ID',
    copyVoiceIdFailed: 'Failed to copy Voice ID.',
    copied: 'Copied',
    currentClip: 'Current clip',
    downloadPreview: 'Download preview audio',
    downloadPreviewError: 'Failed to download preview audio.',
    downloadPreviewSuccess: 'Preview audio download started.',
    emptyVoices: 'No custom voices are available for this account yet.',
    fillPreviewFromTranscript: 'Use first 50 chars from transcript',
    generateVoice: 'Open generate voice page',
    generateVoiceHint: 'You can use the cloned voice directly on the generate-voice page. Preview text is optional.',
    intro:
      'The latest flow is simple: upload a 5-10 second MP3/WAV clip, provide the matching transcript, ' +
      'and optionally add preview text within 50 characters to get sample audio.',
    jumpReady:
      'After cloning, the custom voice list refreshes automatically, and you can jump straight into the generate page with the new Voice ID.',
    noPreviewAudio:
      'No preview audio was returned this time. You can still copy the Voice ID and use it on the generate-voice page.',
    optional: 'Optional',
    pageTitle: 'Voice Clone',
    previewAudio: 'Preview audio',
    previewText: 'Preview text',
    previewTextHelp:
      'You can leave this empty. If provided, keep it within 50 characters so the API can return sample_audio.',
    previewTooLong: 'Preview text must be 50 characters or fewer.',
    readyForGenerate: 'Your cloned voice is ready. Copy the Voice ID or jump to the generate-voice page.',
    recordLabel: 'Record',
    recordStart: 'Start recording',
    recordStop: 'Stop recording',
    resetForm: 'Reset',
    refreshVoices: 'Refresh',
    resultTitle: 'Clone result',
    sampleLimit: 'Recommended: 5-10 seconds, one speaker, clear speech, low background noise.',
    selectAudioFirst: 'Please record or upload audio first.',
    sourceAudio: 'Voice sample',
    sourceAudioHelp: 'MP3 and WAV are supported. Recorded clips are converted into standard WAV before upload.',
    transcript: 'Matching transcript',
    transcriptHelp: 'This is required for voice cloning and should match the spoken content in the audio.',
    transcriptPlaceholder: 'Enter the spoken transcript from the audio clip',
    transcriptRequired: 'Please enter or transcribe the audio text first.',
    unsupportedRecorder: 'This browser does not support a usable recording format. Please try another browser.',
    uploadAudio: 'Upload audio',
    uploadStep: 'Prepare sample',
    useInGenerate: 'Use it now',
    useThisVoice: 'Generate with this voice',
    voiceId: 'Voice ID',
    voiceReadyToast: 'The cloned voice has already been selected for you.',
    waitingForFile: 'Audio uploaded. Waiting for StepFun to finish processing the file...',
    cloneCreating: 'File is ready. Creating the cloned voice...',
    transcriptStep: 'Write transcript',
    resultStep: 'Use the result',
    suggestedPreview: 'Use suggested preview text',
  },
  jp: {
    accountVoices: '利用可能なカスタム音色',
    accountVoicesDesc: 'クローン成功後、この一覧に現在のアカウントで使えるカスタム音色を再読み込みします。',
    autoTranscribe: '音声を文字起こし',
    changeAudio: '音声を差し替える',
    cloneSuccess: '音色クローンが完了しました。',
    cloneStepsDone: '完了',
    cloneStepsIdle: '未処理',
    cloneStepsWorking: '進行中',
    cloning: '音色を作成',
    copyVoiceId: 'Voice ID をコピー',
    copyVoiceIdFailed: 'Voice ID のコピーに失敗しました。',
    copied: 'コピーしました',
    currentClip: '現在の音声',
    downloadPreview: '試聴音声をダウンロード',
    downloadPreviewError: '試聴音声のダウンロードに失敗しました。',
    downloadPreviewSuccess: '試聴音声のダウンロードを開始しました。',
    emptyVoices: 'このアカウントではまだ使えるカスタム音色がありません。',
    fillPreviewFromTranscript: '文字起こし先頭 50 文字を使う',
    generateVoice: '音声生成ページで使う',
    generateVoiceHint: 'クローンした音色はそのまま音声生成ページで使えます。試聴テキストは任意です。',
    intro:
      '最新の流れはシンプルです。5〜10 秒の MP3/WAV 音声をアップロードし、対応する文字起こしを入力し、' +
      '必要なら 50 文字以内の試聴テキストで sample_audio を生成します。',
    jumpReady: 'クローン成功後は右側の音色一覧も自動更新され、そのまま新しい Voice ID を生成ページへ引き継げます。',
    noPreviewAudio: '今回は試聴音声が返っていません。Voice ID をコピーして音声生成ページでそのまま利用できます。',
    optional: '任意',
    pageTitle: '音声クローン',
    previewAudio: '試聴音声',
    previewText: '試聴テキスト',
    previewTextHelp: '空でもかまいません。入力する場合は 50 文字以内にすると sample_audio を返しやすくなります。',
    previewTooLong: '試聴テキストは 50 文字以内で入力してください。',
    readyForGenerate: '音色の作成が完了しました。Voice ID をコピーするか、音声生成ページに移動してください。',
    recordLabel: '録音',
    recordStart: '録音開始',
    recordStop: '録音停止',
    resetForm: 'リセット',
    refreshVoices: '再読み込み',
    resultTitle: 'クローン結果',
    sampleLimit: '推奨: 5〜10 秒、1 人の音声、はっきりした発話、少ないノイズ。',
    selectAudioFirst: '先に録音または音声アップロードをしてください。',
    sourceAudio: '音声サンプル',
    sourceAudioHelp: 'MP3/WAV に対応しています。録音した音声はアップロード前に標準 WAV に変換します。',
    transcript: '音声に対応するテキスト',
    transcriptHelp: '音色クローンでは必須です。音声で話している内容と一致させてください。',
    transcriptPlaceholder: '音声で話している内容を入力してください',
    transcriptRequired: '先に文字起こしするか、テキストを入力してください。',
    unsupportedRecorder: 'このブラウザでは利用できる録音形式が見つかりません。別のブラウザをお試しください。',
    uploadAudio: '音声をアップロード',
    uploadStep: '音声を用意',
    useInGenerate: '今すぐ使う',
    useThisVoice: 'この音色で生成する',
    voiceId: 'Voice ID',
    voiceReadyToast: 'クローンした音色を自動で選択しました。',
    waitingForFile: '音声をアップロードしました。StepFun 側での処理完了を待っています…',
    cloneCreating: 'ファイルの準備ができました。音色を作成しています…',
    transcriptStep: 'テキストを確認',
    resultStep: '結果を使う',
    suggestedPreview: 'おすすめの試聴テキストを入れる',
  },
}

function getSuggestedPreviewText(lang: Locale) {
  if (lang === 'cn') {
    return '你好，欢迎体验这个刚刚克隆好的声音。'
  }

  if (lang === 'jp') {
    return 'こんにちは、新しく作成した音色の試聴です。'
  }

  return 'Hello, this is a quick preview of the cloned voice.'
}

function formatVoiceCreatedAt(value?: number) {
  if (!value) return null
  return new Date(value * 1000).toLocaleString()
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

function formatDuration(seconds?: number | null) {
  if (!seconds || Number.isNaN(seconds)) return null

  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainSeconds = Math.round(seconds % 60)
  return `${minutes}m ${String(remainSeconds).padStart(2, '0')}s`
}

function getAudioDurationFeedback(lang: Locale, seconds?: number | null) {
  if (!seconds || Number.isNaN(seconds)) {
    return {
      tone: 'neutral' as const,
      message:
        lang === 'cn'
          ? '已选择音频，可以继续文字识别或直接填写文本。'
          : lang === 'jp'
            ? '音声を選択しました。文字起こしか手入力を続けてください。'
            : 'Audio is ready. You can transcribe it or type the transcript directly.',
    }
  }

  if (seconds < 3) {
    return {
      tone: 'warning' as const,
      message:
        lang === 'cn'
          ? '这段音频偏短，建议换成更完整的 5~10 秒样本，克隆稳定性会更好。'
          : lang === 'jp'
            ? 'この音声は少し短めです。5〜10 秒程度のサンプルにすると、クローンが安定しやすくなります。'
            : 'This clip is short. A clearer 5-10 second sample usually gives better cloning results.',
    }
  }

  if (seconds >= 5 && seconds <= 10) {
    return {
      tone: 'success' as const,
      message:
        lang === 'cn'
          ? '时长很合适，接下来补上准确文本即可开始克隆。'
          : lang === 'jp'
            ? '長さはちょうど良いです。あとは正確なテキストを入れればクローンを始められます。'
            : 'The duration looks ideal. Add the matching transcript and you are ready to clone.',
    }
  }

  if (seconds > 15) {
    return {
      tone: 'warning' as const,
      message:
        lang === 'cn'
          ? '这段音频偏长，建议裁成 5~10 秒的单人清晰语音，通常更稳定。'
          : lang === 'jp'
            ? 'この音声はやや長めです。5〜10 秒ほどの、1 人で明瞭な音声にすると安定しやすいです。'
            : 'This clip is longer than needed. A clean 5-10 second single-speaker sample is usually more reliable.',
    }
  }

  return {
    tone: 'neutral' as const,
    message:
      lang === 'cn'
        ? '时长可以使用。如果效果不理想，优先尝试更清晰、单人、5~10 秒的片段。'
        : lang === 'jp'
          ? 'この長さでも使えます。結果が不安定な場合は、より明瞭で 1 人の 5〜10 秒音声を試してください。'
          : 'This duration can work. If the result feels unstable, try a clearer 5-10 second single-speaker clip.',
  }
}

function getNextStepHint(lang: Locale, hasAudio: boolean, transcript: string, hasResult: boolean) {
  if (hasResult) {
    return lang === 'cn'
      ? '已经完成。你可以直接复制 Voice ID、下载试听，或去生成语音页继续创作。'
      : lang === 'jp'
        ? '準備完了です。Voice ID のコピー、試聴音声の保存、そのまま音声生成ページへの移動ができます。'
        : 'Everything is ready. Copy the Voice ID, download the preview, or continue on the generate page.'
  }

  if (!hasAudio) {
    return lang === 'cn'
      ? '先准备一段 5~10 秒、单人、清晰的语音样本。'
      : lang === 'jp'
        ? 'まずは 5〜10 秒ほどの、1 人で明瞭な音声サンプルを用意してください。'
        : 'Start with a clean 5-10 second single-speaker sample.'
  }

  if (!transcript.trim()) {
    return lang === 'cn'
      ? '下一步建议先自动识别文本，再快速检查一遍是否与音频一致。'
      : lang === 'jp'
        ? '次は文字起こしを使って下書きを作り、音声内容と一致しているかを軽く確認するのがおすすめです。'
        : 'Next, use auto-transcribe and quickly verify that the transcript matches the audio.'
  }

  return lang === 'cn'
    ? '文本已经准备好了，现在可以直接创建音色；试听文本仍然是可选项。'
    : lang === 'jp'
      ? 'テキストの準備はできています。試聴テキストは任意なので、このまま音色を作成できます。'
      : 'The transcript is ready. Preview text is optional, so you can clone the voice now.'
}

function getFriendlyCloneErrorMessage(lang: Locale, error?: string, code?: string) {
  const normalized = `${code || ''} ${error || ''}`.toLowerCase()

  if (normalized.includes('api key') || normalized.includes('unauthorized') || normalized.includes('invalid_api_key')) {
    if (lang === 'cn') return 'StepFun API Key 可能无效，或当前账号没有相应权限。请检查环境变量配置。'
    if (lang === 'jp') {
      return 'StepFun API Key が無効か、現在のアカウントに必要な権限がない可能性があります。環境変数を確認してください。'
    }
    return 'Your StepFun API key may be invalid, or the current account may not have permission for this request.'
  }

  if (normalized.includes('timed out while waiting for the uploaded file')) {
    if (lang === 'cn') return '音频已上传，但 StepFun 处理文件时间较长。请稍后刷新再试。'
    if (lang === 'jp') {
      return '音声のアップロードは完了しましたが、StepFun 側の処理に時間がかかっています。少し待ってから再試行してください。'
    }
    return 'The audio was uploaded, but StepFun is still processing it. Please wait a moment and try again.'
  }

  return error || ''
}

async function waitForFileReady(fileId: string, initialStatus?: string) {
  const readyStatuses = new Set(['processed', 'success'])

  if (initialStatus && readyStatuses.has(initialStatus)) {
    return
  }

  for (let attempt = 0; attempt < FILE_READY_POLL_ATTEMPTS; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, FILE_READY_POLL_INTERVAL_MS))

    const statusRes = await fetch(`/api/file/upload/status?file_id=${fileId}`, { cache: 'no-store' })
    const statusData = await statusRes.json()

    if (!statusRes.ok) {
      throw new Error(statusData?.error || 'Failed to check file status.')
    }

    if (readyStatuses.has(statusData?.status)) {
      return
    }
  }

  throw new Error('Timed out while waiting for the uploaded file to become ready.')
}

export default function VoiceCloneClient({ lang }: VoiceCloneClientProps) {
  const copy = useMemo(() => PAGE_COPY[lang], [lang])
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [audioDuration, setAudioDuration] = useState<number | null>(null)
  const [fileName, setFileName] = useState('')
  const [transcript, setTranscript] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [isLoadingVoices, setIsLoadingVoices] = useState(false)
  const [customVoices, setCustomVoices] = useState<CustomVoice[]>([])
  const [result, setResult] = useState<VoiceCloneResult | null>(null)
  const [cloneStage, setCloneStage] = useState<'idle' | 'uploading' | 'processing' | 'creating' | 'success'>('idle')

  useEffect(() => {
    if (!audioBlob) {
      setAudioUrl('')
      setAudioDuration(null)
      return
    }

    const url = URL.createObjectURL(audioBlob)
    setAudioUrl(url)
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    audio.src = url
    audio.onloadedmetadata = () => {
      setAudioDuration(Number.isFinite(audio.duration) ? audio.duration : null)
    }
    audio.onerror = () => {
      setAudioDuration(null)
    }

    return () => {
      audio.onloadedmetadata = null
      audio.onerror = null
      URL.revokeObjectURL(url)
    }
  }, [audioBlob])

  const refreshVoices = async () => {
    setIsLoadingVoices(true)
    try {
      const res = await fetch('/api/audio/voices', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load custom voices.')
      }

      setCustomVoices(Array.isArray(data?.data) ? data.data : [])
    } catch (error) {
      console.error('Failed to load custom voices:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load custom voices.')
    } finally {
      setIsLoadingVoices(false)
    }
  }

  useEffect(() => {
    void refreshVoices()
  }, [])

  const handleAudioSelect = (blob: Blob, nextFileName: string) => {
    setAudioBlob(blob)
    setFileName(nextFileName)
    setResult(null)
    setCloneStage('idle')
  }

  const handleUpload = (file: File) => {
    handleAudioSelect(file, file.name)
  }

  const handleRecordingComplete = (blob: Blob) => {
    handleAudioSelect(blob, 'recorded-sample.wav')
  }

  const handleTranscribe = async () => {
    if (!audioBlob) {
      toast.error(copy.selectAudioFirst)
      return
    }

    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, fileName || 'voice-sample.wav')

      const res = await fetch('/api/audio/asr', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to transcribe audio.')
      }

      setTranscript(data.recognizedText || '')
      if (!previewText.trim() && data.recognizedText) {
        setPreviewText(data.recognizedText.slice(0, SAMPLE_TEXT_MAX_LENGTH))
      }
    } catch (error) {
      console.error('Failed to transcribe audio:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to transcribe audio.')
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleClone = async () => {
    if (!audioBlob) {
      toast.error(copy.selectAudioFirst)
      return
    }

    const trimmedTranscript = transcript.trim()
    const trimmedPreviewText = previewText.trim()

    if (!trimmedTranscript) {
      toast.error(copy.transcriptRequired)
      return
    }

    if (trimmedPreviewText.length > SAMPLE_TEXT_MAX_LENGTH) {
      toast.error(copy.previewTooLong)
      return
    }

    setIsCloning(true)
    setCloneStage('uploading')
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', audioBlob, fileName || 'voice-sample.wav')

      const uploadRes = await fetch('/api/file/upload', {
        method: 'POST',
        body: uploadFormData,
      })
      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) {
        throw new Error(uploadData?.error || 'Failed to upload audio file.')
      }

      if (!uploadData?.id) {
        throw new Error('The upload response did not include a file ID.')
      }

      toast.message(copy.waitingForFile)
      setCloneStage('processing')
      await waitForFileReady(uploadData.id, uploadData.status)

      toast.message(copy.cloneCreating)
      setCloneStage('creating')
      const cloneRes = await fetch('/api/audio/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: uploadData.id,
          sample_text: trimmedPreviewText || undefined,
          text: trimmedTranscript,
        }),
      })
      const cloneData = await cloneRes.json()

      if (!cloneRes.ok) {
        throw new Error(
          getFriendlyCloneErrorMessage(lang, cloneData?.error, cloneData?.code) || 'Failed to clone voice.',
        )
      }

      setResult(cloneData)
      setCloneStage('success')
      toast.success(copy.cloneSuccess)
      await refreshVoices()
    } catch (error) {
      console.error('Failed to clone voice:', error)
      setCloneStage('idle')
      toast.error(error instanceof Error ? error.message : 'Failed to clone voice.')
    } finally {
      setIsCloning(false)
    }
  }

  const copyVoiceId = async () => {
    if (!result?.id) return

    try {
      await navigator.clipboard.writeText(result.id)
      toast.success(`${copy.voiceId} ${copy.copied}.`)
    } catch (error) {
      console.error('Failed to copy voice ID:', error)
      toast.error(copy.copyVoiceIdFailed)
    }
  }

  const copySpecificVoiceId = async (voiceId: string) => {
    try {
      await navigator.clipboard.writeText(voiceId)
      toast.success(`${copy.voiceId} ${copy.copied}.`)
    } catch (error) {
      console.error('Failed to copy voice ID:', error)
      toast.error(copy.copyVoiceIdFailed)
    }
  }

  const downloadPreviewAudio = async () => {
    if (!result?.sample_audio) return

    try {
      const response = await fetch(`data:audio/wav;base64,${result.sample_audio}`)
      const blob = await response.blob()
      saveAs(blob, `stepfun-voice-preview-${result.id}.wav`)
      toast.success(copy.downloadPreviewSuccess)
    } catch (error) {
      console.error('Failed to download preview audio:', error)
      toast.error(copy.downloadPreviewError)
    }
  }

  const resetForm = () => {
    setAudioBlob(null)
    setAudioUrl('')
    setFileName('')
    setTranscript('')
    setPreviewText('')
    setResult(null)
    setCloneStage('idle')
  }

  const useTranscriptForPreview = () => {
    setPreviewText(transcript.trim().slice(0, SAMPLE_TEXT_MAX_LENGTH))
  }

  const useSuggestedPreview = () => {
    setPreviewText(getSuggestedPreviewText(lang).slice(0, SAMPLE_TEXT_MAX_LENGTH))
  }

  const stepItems = [
    {
      key: 'audio',
      title: copy.uploadStep,
      active: cloneStage === 'idle' || cloneStage === 'uploading',
      complete: Boolean(audioBlob),
    },
    {
      key: 'text',
      title: copy.transcriptStep,
      active: cloneStage === 'processing' || cloneStage === 'creating' || (!audioBlob && !result),
      complete: Boolean(transcript.trim()),
    },
    {
      key: 'result',
      title: copy.resultStep,
      active: cloneStage === 'success',
      complete: Boolean(result?.id),
    },
  ]

  const generateVoiceHref = result?.id
    ? `/${lang}/generate-voice?from=clone&voice=${encodeURIComponent(result.id)}`
    : `/${lang}/generate-voice`
  const audioFeedback = getAudioDurationFeedback(lang, audioDuration)
  const nextStepHint = getNextStepHint(lang, Boolean(audioBlob), transcript, Boolean(result?.id))
  const audioFeedbackClassName =
    audioFeedback.tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : audioFeedback.tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-default-200 bg-default-50 text-default-600'

  return (
    <div className="grow overflow-y-auto flex justify-center py-6 px-6">
      <Toaster position="top-center" />

      <div className="w-full max-w-5xl space-y-6">
        <div className="rounded-2xl border border-default-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">{copy.pageTitle}</h1>
              <p className="text-sm text-default-600">{copy.intro}</p>
              <p className="text-sm text-default-500">{copy.sampleLimit}</p>
              <p className="text-sm text-default-500">{copy.jumpReady}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="flat" onPress={resetForm}>
                {copy.resetForm}
              </Button>
              <Link
                href={`/${lang}/generate-voice`}
                className="inline-flex items-center rounded-full border border-default-200 px-4 py-2 text-sm text-default-700 hover:bg-default-100"
              >
                {copy.generateVoice}
              </Link>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {stepItems.map((step, index) => {
              const stateLabel = step.complete
                ? copy.cloneStepsDone
                : step.active
                  ? copy.cloneStepsWorking
                  : copy.cloneStepsIdle

              return (
                <div
                  key={step.key}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    step.complete
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : step.active
                        ? 'border-sky-300 bg-sky-50 text-sky-700'
                        : 'border-default-200 bg-default-50 text-default-500'
                  }`}
                >
                  {index + 1}. {step.title} · {stateLabel}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-default-200 p-6">
              <h2 className="text-lg font-semibold">{copy.sourceAudio}</h2>
              <p className="mt-2 text-sm text-default-500">{copy.sourceAudioHelp}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-default-100 p-4">
                  <p className="mb-3 text-sm font-medium">{copy.recordLabel}</p>
                  <Recorder
                    onRecordingComplete={handleRecordingComplete}
                    onError={message => toast.error(message)}
                    startLabel={copy.recordStart}
                    stopLabel={copy.recordStop}
                    unsupportedMessage={copy.unsupportedRecorder}
                  />
                </div>

                <div className="rounded-xl border border-default-100 p-4">
                  <p className="mb-3 text-sm font-medium">{copy.uploadAudio}</p>
                  <FileUploader
                    accept=".wav,.mp3,audio/wav,audio/mpeg"
                    label={copy.uploadAudio}
                    onFileUpload={handleUpload}
                  />
                </div>
              </div>

              {audioUrl && (
                <div className="mt-4 rounded-xl border border-default-100 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-medium">{copy.currentClip}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-default-500">{fileName}</span>
                      <Button size="sm" variant="light" onPress={resetForm}>
                        {copy.changeAudio}
                      </Button>
                    </div>
                  </div>
                  <audio controls className="w-full" src={audioUrl} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formatDuration(audioDuration) && (
                      <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs text-default-700">
                        {formatDuration(audioDuration)}
                      </span>
                    )}
                    {audioBlob && (
                      <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs text-default-700">
                        {formatFileSize(audioBlob.size)}
                      </span>
                    )}
                    {audioBlob?.type && (
                      <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs text-default-700">
                        {audioBlob.type}
                      </span>
                    )}
                  </div>
                  <div className={`mt-3 rounded-xl border px-3 py-2 text-sm ${audioFeedbackClassName}`}>
                    {audioFeedback.message}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-default-200 p-6 space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{copy.transcript}</h2>
                  <p className="mt-1 text-sm text-default-500">{copy.transcriptHelp}</p>
                </div>
                <Button variant="flat" onPress={handleTranscribe} isLoading={isTranscribing} isDisabled={!audioBlob}>
                  {copy.autoTranscribe}
                </Button>
              </div>

              <Textarea
                disableAutosize
                minRows={6}
                placeholder={copy.transcriptPlaceholder}
                value={transcript}
                onChange={event => setTranscript(event.target.value)}
                classNames={{ input: 'resize-y min-h-[180px]' }}
              />
              <div className="flex items-center justify-between gap-3 text-sm text-default-400">
                <span>{nextStepHint}</span>
                <span>{transcript.trim().length}</span>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium">
                      {copy.previewText} <span className="text-sm text-default-400">({copy.optional})</span>
                    </h3>
                    <p className="text-sm text-default-500">{copy.previewTextHelp}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm" variant="light" onPress={useSuggestedPreview}>
                      {copy.suggestedPreview}
                    </Button>
                    <Button size="sm" variant="light" onPress={useTranscriptForPreview} isDisabled={!transcript.trim()}>
                      {copy.fillPreviewFromTranscript}
                    </Button>
                    <span className="text-sm text-default-400">
                      {previewText.length}/{SAMPLE_TEXT_MAX_LENGTH}
                    </span>
                  </div>
                </div>

                <Textarea
                  disableAutosize
                  minRows={3}
                  maxRows={3}
                  value={previewText}
                  onChange={event => setPreviewText(event.target.value)}
                  classNames={{ input: 'resize-y min-h-[96px]' }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  color="primary"
                  onPress={handleClone}
                  isLoading={isCloning}
                  isDisabled={!audioBlob || !transcript.trim()}
                >
                  {copy.cloning}
                </Button>
                <span className="text-sm text-default-500">{copy.generateVoiceHint}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-default-200 p-6">
              <h2 className="text-lg font-semibold">{copy.resultTitle}</h2>

              {!result ? (
                <p className="mt-3 text-sm text-default-500">{copy.readyForGenerate}</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-default-100 p-4">
                    <p className="text-sm text-default-500">{copy.voiceId}</p>
                    <p className="mt-1 break-all font-mono text-sm">{result.id}</p>
                    {result.duplicated && <p className="mt-2 text-sm text-amber-600">Duplicated request result.</p>}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="flat" onPress={copyVoiceId}>
                      {copy.copyVoiceId}
                    </Button>
                    {result.sample_audio && (
                      <Button variant="flat" onPress={downloadPreviewAudio}>
                        {copy.downloadPreview}
                      </Button>
                    )}
                    <Link
                      href={generateVoiceHref}
                      className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-sm text-white"
                    >
                      {copy.useInGenerate}
                    </Link>
                  </div>

                  {result.sample_audio ? (
                    <div className="rounded-xl border border-default-100 p-4">
                      <p className="mb-2 font-medium">{copy.previewAudio}</p>
                      {result.sample_text && <p className="mb-3 text-sm text-default-500">{result.sample_text}</p>}
                      <audio controls className="w-full" src={`data:audio/wav;base64,${result.sample_audio}`} />
                    </div>
                  ) : (
                    <p className="text-sm text-default-500">{copy.noPreviewAudio}</p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-default-200 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{copy.accountVoices}</h2>
                  <p className="mt-1 text-sm text-default-500">{copy.accountVoicesDesc}</p>
                </div>
                <Button size="sm" variant="flat" onPress={refreshVoices} isLoading={isLoadingVoices}>
                  {copy.refreshVoices}
                </Button>
              </div>

              {customVoices.length === 0 ? (
                <p className="mt-4 text-sm text-default-500">{copy.emptyVoices}</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {customVoices.map(voice => (
                    <div key={voice.id} className="rounded-xl border border-default-100 p-4">
                      <p className="break-all font-mono text-sm">{voice.id}</p>
                      {formatVoiceCreatedAt(voice.created_at) && (
                        <p className="mt-2 text-xs text-default-500">{formatVoiceCreatedAt(voice.created_at)}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="flat" onPress={() => copySpecificVoiceId(voice.id)}>
                          {copy.copyVoiceId}
                        </Button>
                        <Link
                          href={`/${lang}/generate-voice?from=clone&voice=${encodeURIComponent(voice.id)}`}
                          className="inline-flex items-center rounded-lg border border-default-200 px-3 py-1.5 text-sm text-default-700 hover:bg-default-100"
                        >
                          {copy.useThisVoice}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
