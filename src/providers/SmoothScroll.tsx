import Lenis from 'lenis'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap'

type ScrollInfo = { scroll: number; velocity: number; direction: 1 | -1 | 0 }
type Listener = (info: ScrollInfo) => void

type Ctx = {
  lenis: Lenis | null
  scrollTo: (target: string | number | HTMLElement, opts?: { offset?: number; immediate?: boolean; duration?: number }) => void
  subscribe: (fn: Listener) => () => void
}

const ScrollCtx = createContext<Ctx>({
  lenis: null,
  scrollTo: () => {},
  subscribe: () => () => {},
})

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)
  const listeners = useRef(new Set<Listener>())

  useEffect(() => {
    const emit = (info: ScrollInfo) => listeners.current.forEach((fn) => fn(info))

    if (prefersReducedMotion()) {
      let last = window.scrollY
      const onScroll = () => {
        const y = window.scrollY
        emit({ scroll: y, velocity: y - last, direction: y > last ? 1 : y < last ? -1 : 0 })
        last = y
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => window.removeEventListener('scroll', onScroll)
    }

    const l = new Lenis({
      lerp: 0.085, // medium glide — smooth but never sluggish
      wheelMultiplier: 0.95,
      touchMultiplier: 1.3,
      smoothWheel: true,
    })
    l.on('scroll', (e: Lenis) => {
      ScrollTrigger.update()
      emit({ scroll: e.scroll, velocity: e.velocity, direction: e.direction as 1 | -1 | 0 })
    })
    const raf = (time: number) => l.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    setLenis(l)

    return () => {
      gsap.ticker.remove(raf)
      l.destroy()
      setLenis(null)
    }
  }, [])

  const scrollTo: Ctx['scrollTo'] = (target, opts = {}) => {
    const { offset = 0, immediate = false, duration = 1.8 } = opts
    if (lenis) {
      lenis.scrollTo(target as never, {
        offset,
        immediate,
        duration,
        force: true,
        easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      })
      return
    }
    let y = 0
    if (typeof target === 'number') y = target
    else {
      const el = typeof target === 'string' ? document.querySelector(target) : target
      if (el) y = el.getBoundingClientRect().top + window.scrollY
    }
    window.scrollTo({ top: y + offset, behavior: immediate ? 'auto' : 'smooth' })
  }

  const subscribe = (fn: Listener) => {
    listeners.current.add(fn)
    return () => {
      listeners.current.delete(fn)
    }
  }

  return <ScrollCtx.Provider value={{ lenis, scrollTo, subscribe }}>{children}</ScrollCtx.Provider>
}

export const useSmoothScroll = () => useContext(ScrollCtx)

export function useScrollListener(fn: Listener) {
  const { subscribe } = useSmoothScroll()
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => subscribe((i) => ref.current(i)), [subscribe])
}
