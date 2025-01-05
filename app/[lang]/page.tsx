// app/[lang]/page.tsx
import { redirect } from 'next/navigation'
import type { Locale } from '@/app/lib/i18n/i18n-config'

export default async function LangHome({ params: { lang } }: { params: { lang: Locale } }) {
  // 例如：让它直接重定向到 /[lang]/generate-voice
  redirect(`/${lang}/generate-voice`)
}
