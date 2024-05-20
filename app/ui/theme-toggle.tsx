import React, { useState, useEffect } from 'react'
import useTheme from '../lib/useTheme'

export function ThemeToggle() {
  const [theme, setTheme] = useState('light')

  const browserTheme = useTheme()
  useEffect(() => {
    setTheme(browserTheme)
    document.documentElement.classList.toggle('dark', browserTheme === 'dark')
  }, [browserTheme])

  const toggleTheme = (event: MouseEvent) => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    // @ts-ignore
    // document.startViewTransition fallback
    if (!document.startViewTransition) {
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      return
    }

    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

    let isDark: boolean

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      const root = document.documentElement
      isDark = root.classList.contains('dark')
      root.classList.remove(isDark ? 'dark' : 'light')
      root.classList.add(isDark ? 'light' : 'dark')
    })

    transition.ready.then(() => {
      const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]
      document.documentElement.animate(
        {
          clipPath: isDark ? clipPath.reverse() : clipPath,
        },
        {
          duration: 500,
          easing: 'ease-in',
          pseudoElement: isDark ? '::view-transition-old(root)' : '::view-transition-new(root)',
        },
      )
    })
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      id="theme-toggle"
      title="Toggles light & dark"
      aria-label={theme}
      aria-live="polite"
      onClick={e => toggleTheme(e.nativeEvent)}
    >
      <svg className="sun-and-moon" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
        <mask className="moon" id="moon-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white"></rect>
          <circle cx="24" cy="10" r="6" fill="black"></circle>
        </mask>
        <circle className="sun" cx="12" cy="12" r="6" mask="url(#moon-mask)" fill="currentColor"></circle>
        <g className="sun-beams" stroke="currentColor">
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </g>
      </svg>
    </button>
  )
}
