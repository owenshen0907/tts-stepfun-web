// app/[lang]/usage-case/page.tsx
import { getLocale } from '@/app/lib/i18n/get-locale'
import type { Locale } from '@/app/lib/i18n/i18n-config'

export default async function UsageCasePage({ params: { lang } }: { params: { lang: Locale } }) {
  const t = await getLocale(lang)
  return (
    <div className="flex items-center justify-center w-full h-full">
      <h2 className="text-2xl font-semibold">实用案例（空白页面）</h2>
    </div>
  )
}
