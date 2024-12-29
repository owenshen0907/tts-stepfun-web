// app/lib/i18n
export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'cn', 'jp'],
} as const

export type Locale = (typeof i18n)['locales'][number]
