// app/[lang]/layout.tsx

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Metadata } from 'next'
import { OverlayScrollbar } from './overlay-scrollbar'
import { Providers } from './providers'
import '@/styles/globals.css'
import Nav from './ui/nav'
import SideNav from './ui/side-nav'
import { getLocale } from '@/app/lib/i18n/get-locale'
import { i18n, type Locale } from '@/app/lib/i18n/i18n-config'

export const metadata: Metadata = {
  title: 'StepFun Text To Speech(TTS)',
  description: 'Free StepFun Text To Speech(TTS)',
}

export async function generateStaticParams() {
  return i18n.locales.map(locale => ({ lang: locale }))
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: Locale }
}) {
  // 1. 获取 lang，并获取翻译
  const lang = params.lang
  const t = await getLocale(lang)

  // 2. 处理 <html lang="...">
  const langAttr = lang === 'cn' ? 'zh-CN' : 'en'

  return (
    <html lang={langAttr} data-overlayscrollbars-initialize>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />

        <meta name="msapplication-TileColor" content="#603cba" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1d2127" media="(prefers-color-scheme: dark)" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Stepfun TTS" />
      </head>
      <body data-overlayscrollbars-initialize>
        <Analytics />
        <SpeedInsights />
        <OverlayScrollbar />
        <Providers>
          {/* 顶部导航 */}
          <Nav t={t} />

          <div className="flex min-h-screen">
            {/* 侧边导航：传递 lang 和 t，就能生成链接及多语言文本 */}
            <SideNav lang={lang} t={t} />

            {/* 右侧内容 */}
            <main className="flex-1 p-4 bg-white dark:bg-gray-900">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
