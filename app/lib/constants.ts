// app/lib/constants.ts
export const STEPFUN_API_KEY = process.env.STEPFUN_API_KEY || ''
export const STEPFUN_API_URL = process.env.STEPFUN_API_URL || ''
export const STEPFUN_TTS_MODEL = 'step-tts-2'

export const STEPFUN_VOICES = [
  { value: 'lively-girl', label: '活力少女', gender: 'female' },
  { value: 'vibrant-youth', label: '活力青年', gender: 'male' },
  { value: 'soft-spoken-gentleman', label: '轻柔绅士', gender: 'male' },
  { value: 'magnetic-voiced-male', label: '磁性男声', gender: 'male' },
  { value: 'elegantgentle-female', label: '优雅温柔女声', gender: 'female' },
  { value: 'livelybreezy-female', label: '轻快女声', gender: 'female' },
  { value: 'zixinnansheng', label: '自信男声', gender: 'male' },
] as const

export const VOICE_LABEL_LANGUAGE_OPTIONS = [
  { value: 'Auto', label: 'Auto' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Cantonese', label: 'Cantonese' },
  { value: 'Sichuanese', label: 'Sichuanese' },
] as const

export const VOICE_LABEL_EMOTION_OPTIONS = [
  { value: 'Happy', label: 'Happy' },
  { value: 'Neutral', label: 'Neutral' },
  { value: 'Serious', label: 'Serious' },
  { value: 'Angry', label: 'Angry' },
  { value: 'Sad', label: 'Sad' },
  { value: 'Calm', label: 'Calm' },
  { value: 'Fear', label: 'Fear' },
  { value: 'Disgust', label: 'Disgust' },
  { value: 'Surprised', label: 'Surprised' },
  { value: 'Excited', label: 'Excited' },
  { value: 'Admiring', label: 'Admiring' },
  { value: 'Confused', label: 'Confused' },
] as const

export const VOICE_LABEL_STYLE_OPTIONS = [
  { value: 'Slow', label: 'Slow' },
  { value: 'Very Slow', label: 'Very Slow' },
  { value: 'Fast', label: 'Fast' },
  { value: 'Very Fast', label: 'Very Fast' },
  { value: 'Cold', label: 'Cold' },
  { value: 'Embarrassed', label: 'Embarrassed' },
  { value: 'Frustrated', label: 'Frustrated' },
  { value: 'Proud', label: 'Proud' },
  { value: 'Tender', label: 'Tender' },
  { value: 'Sweet', label: 'Sweet' },
  { value: 'Outgoing', label: 'Outgoing' },
  { value: 'Serious', label: 'Serious' },
  { value: 'Arrogant', label: 'Arrogant' },
  { value: 'Elderly', label: 'Elderly' },
  { value: 'Shouting', label: 'Shouting' },
  { value: 'Sarcastic', label: 'Sarcastic' },
  { value: 'Stuttering', label: 'Stuttering' },
] as const

// StepFun 最大输入长度
export const STEPFUN_MAX_INPUT_LENGTH = 10000

export const GITHUB_URL = 'https://github.com/owenshen0907/tts-stepfun-web'

export const DEFAULT_TEXT = {
  CN:
    '《将进酒》：李白； \n' +
    '君不见，黄河之水天上来，奔流到海不复回。\n' +
    '君不见，高堂明镜悲白发，朝如青丝暮成雪。\n',
  EN: "Hmm, I'm not sure",
}

export const LANGS = [
  {
    label: '中文',
    value: 'cn',
  },
  {
    label: 'English',
    value: 'en',
  },
  {
    label: '日本語',
    value: 'jp',
  },
]

export const TIMES = ['200', '300', '500', '1000', '2000', '5000']

export const MIME_TYPES = [
  { value: 'wav', label: 'WAV' },
  { value: 'mp3', label: 'MP3' },
  { value: 'aac', label: 'AAC' },
  { value: 'flac', label: 'FLAC' },
  { value: 'opus', label: 'OPUS' },
  { value: 'pcm', label: 'PCM' },
]

export const SAMPLE_RATE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: '8000', label: '8 kHz' },
  { value: '16000', label: '16 kHz' },
  { value: '22050', label: '22.05 kHz' },
  { value: '24000', label: '24 kHz' },
  { value: '32000', label: '32 kHz' },
  { value: '44100', label: '44.1 kHz' },
  { value: '48000', label: '48 kHz' },
] as const

export const AUDIO_CONTENT_TYPES: Record<string, string> = {
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
  flac: 'audio/flac',
  opus: 'audio/opus',
  pcm: 'audio/pcm',
}
