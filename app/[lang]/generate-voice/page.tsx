// app/[lang]/generate-voice/page.tsx
import Content from '@/app/[lang]/ui/content'
import { getLocale } from '@/app/lib/i18n/get-locale'
import type { Locale } from '@/app/lib/i18n/i18n-config'

export default async function GenerateVoicePage({ params: { lang } }: { params: { lang: Locale } }) {
  // 获取翻译
  const t = await getLocale(lang)

  // 在服务器端渲染 Content
  return <Content t={t} />
}
