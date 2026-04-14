// app/[lang]/generate-voice/page.tsx
import Content from '@/app/[lang]/ui/content'
import { getLocale } from '@/app/lib/i18n/get-locale'
import type { Locale } from '@/app/lib/i18n/i18n-config'

export default async function GenerateVoicePage({
  params: { lang },
  searchParams,
}: {
  params: { lang: Locale }
  searchParams?: { from?: string; voice?: string }
}) {
  const t = await getLocale(lang)

  return (
    <Content
      t={t}
      lang={lang}
      initialVoice={typeof searchParams?.voice === 'string' ? searchParams.voice : undefined}
      initialSource={typeof searchParams?.from === 'string' ? searchParams.from : undefined}
    />
  )
}
