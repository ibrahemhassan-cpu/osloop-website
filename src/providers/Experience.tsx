import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { useSmoothScroll } from './SmoothScroll'
import { Preloader } from '../components/Preloader'
import { MediaLogoWhite } from '../components/Logo'
import { brand } from '../lib/content'
import './experience.css'

type Ctx = {
  /** true once the preloader / page curtain has revealed the current page */
  ready: boolean
  /** Navigate with the curtain. `to` may include a hash (e.g. "/#team"). */
  go: (to: string, label?: string) => void
}

const ExperienceCtx = createContext<Ctx>({ ready: false, go: () => {} })

const LABELS: Record<string, string> = {
  '/': 'Your story, our expertise',
  '/projects': 'Selected work',
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { lenis } = useSmoothScroll()
  const [ready, setReady] = useState(false)
  const [booted, setBooted] = useState(false)
  const curtain = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const busy = useRef(false)
  const covered = useRef(false)
  const prevPath = useRef(location.pathname)

  const go = useCallback(
    (to: string, text?: string) => {
      if (busy.current) return
      const path = to.split('#')[0] || '/'
      if (path === location.pathname) {
        const hash = to.includes('#') ? '#' + to.split('#')[1] : ''
        lenis?.scrollTo(hash || 0, { duration: 1.8 })
        return
      }
      busy.current = true
      lenis?.stop()
      const el = curtain.current!
      const layers = el.querySelectorAll('.curtain__layer')
      if (label.current) label.current.textContent = text ?? LABELS[path] ?? brand.name
      gsap
        .timeline({
          onComplete: () => {
            covered.current = true
            setReady(false)
            navigate(to)
          },
        })
        .set(el, { visibility: 'visible' })
        .fromTo(layers, { yPercent: 100 }, { yPercent: 0, duration: 1, ease: 'drift', stagger: 0.12 })
        .fromTo(
          el.querySelector('.curtain__content'),
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 0.7 },
          '-=0.45',
        )
    },
    [location.pathname, lenis, navigate],
  )

  // After the route changed: reset scroll, refresh triggers, lift the curtain.
  useLayoutEffect(() => {
    if (prevPath.current === location.pathname) return
    prevPath.current = location.pathname
    lenis?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)

    if (!covered.current) {
      // Back/forward navigation — no curtain was played.
      setReady(true)
      requestAnimationFrame(() => ScrollTrigger.refresh())
      return
    }

    const el = curtain.current!
    const layers = Array.from(el.querySelectorAll('.curtain__layer')).reverse()
    const tl = gsap.timeline({
      delay: 0.25,
      onComplete: () => {
        gsap.set(el, { visibility: 'hidden' })
        busy.current = false
        covered.current = false
        lenis?.start()
      },
    })
    tl.add(() => ScrollTrigger.refresh())
      .to(el.querySelector('.curtain__content'), { autoAlpha: 0, y: -30, duration: 0.5, ease: 'power2.in' })
      .to(layers, { yPercent: -100, duration: 1.1, ease: 'drift', stagger: 0.12 }, '-=0.1')
      .add(() => setReady(true), '-=0.75')
    return () => {
      tl.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <ExperienceCtx.Provider value={{ ready, go }}>
      {children}
      {!booted && (
        <Preloader
          onReveal={() => setReady(true)}
          onDone={() => {
            setBooted(true)
            ScrollTrigger.refresh()
          }}
        />
      )}
      <div className="curtain" ref={curtain} aria-hidden>
        <div className="curtain__layer curtain__layer--blue" />
        <div className="curtain__layer curtain__layer--ink">
          <div className="curtain__content">
            <MediaLogoWhite className="curtain__logo" hidden />
            <span className="mono curtain__label" ref={label} />
          </div>
        </div>
      </div>
    </ExperienceCtx.Provider>
  )
}

export const useExperience = () => useContext(ExperienceCtx)

/** Anchor that plays the curtain transition for internal routes. */
export function TransitionLink({
  to,
  label,
  children,
  className,
  onClick,
  ...rest
}: { to: string; label?: string; children: ReactNode; className?: string; onClick?: () => void } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'onClick'
>) {
  const { go } = useExperience()
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        onClick?.()
        go(to, label)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
