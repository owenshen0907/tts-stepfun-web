import VoiceCloneClient from './voice-clone-client'
import type { Locale } from '@/app/lib/i18n/i18n-config'

export default function VoiceClonePage({ params: { lang } }: { params: { lang: Locale } }) {
  return <VoiceCloneClient lang={lang} />
}
