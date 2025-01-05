// app/[lang]/voice-clone/page.tsx
import VoiceCloneClient from './voice-clone-client'
import { getLocale } from '@/app/lib/i18n/get-locale'
import type { Locale } from '@/app/lib/i18n/i18n-config'
// 注意，这里没有 'use client'
// 因为这个文件是 Server Component
// 它可以安全地调用 getLocale、访问后端接口等
// 当然，这里也可以使用 Next.js 13+ 的特殊用法:
// export const dynamic = 'force-static' 或 'force-dynamic' 等，视业务需求而定

export default async function VoiceClonePage({ params: { lang } }: { params: { lang: Locale } }) {
  // 在服务器端获取翻译
  const t = await getLocale(lang)

  // 把翻译内容（和 lang）传递给客户端组件
  // 后续要在客户端做录音、上传等交互
  return <VoiceCloneClient t={t} lang={lang} />
}
