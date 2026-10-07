import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { prefersReducedMotion } from '../lib/gsap'

export type Theme = 'light' | 'dark'

type Ctx = { theme: Theme; toggle: (origin?: { x: number; y: number }) => void }

const ThemeCtx = createContext<Ctx>({ theme: 'light', toggle: () => {} })

function apply(t: Theme) {
  document.documentElement.dataset.theme = t
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#050b24' : '#f4f5fa')
  try {
    localStorage.setItem('osloop-theme', t)
  } catch {
    /* private mode */
  }
}

type VTDocument = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'))

  const toggle = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = theme === 'dark' ? 'light' : 'dark'
      const doc = document as VTDocument
      if (!doc.startViewTransition || prefersReducedMotion()) {
        apply(next)
        setTheme(next)
        return
      }
      const x = origin?.x ?? window.innerWidth - 80
      const y = origin?.y ?? 40
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
      const vt = doc.startViewTransition(() => {
        apply(next)
        flushSync(() => setTheme(next))
      })
      vt.ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 1100, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
    },
    [theme],
  )

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
