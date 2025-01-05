// app/[lang]/ui/side-nav.tsx

'use client' // <-- 关键：让它成为客户端组件
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@/app/lib/i18n/i18n-config'
import type { Tran } from '@/app/lib/types'

interface SideNavProps {
  lang: Locale
  t: Tran
}

export default function SideNav({ lang, t }: SideNavProps) {
  // 1. 获取当前页面路径
  const pathname = usePathname() // e.g. "/cn/generate-voice"

  // 2. 定义侧边导航的列表
  const navItems = [
    { href: `/${lang}/generate-voice`, label: t['side-nav']['generate-voice'] },
    { href: `/${lang}/voice-clone`, label: t['side-nav']['voice-clone'] },
    { href: `/${lang}/usage-case`, label: t['side-nav']['usage-case'] },
  ]

  return (
    <aside className="w-30 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <ul className="space-y-2">
        {navItems.map(item => {
          // 3. 判断该链接是否是激活状态
          //    - 当 pathname === item.href 或 pathname 以 item.href + "/" 开头时，都视为激活
          const isActive = pathname === item.href || (pathname && pathname.startsWith(item.href + '/'))

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx('block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700', {
                  'bg-gray-200 dark:bg-gray-700 font-semibold': isActive,
                })}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
