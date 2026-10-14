import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useLocation } from 'react-router-dom'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { brand } from '../lib/content'
import { useNavTo } from '../lib/useNavTo'
import { useExperience } from '../providers/Experience'
import { useScrollListener, useSmoothScroll } from '../providers/SmoothScroll'
import { useTheme } from '../providers/Theme'
import { Magnetic, RollText } from './ui'
import { MenuOverlay } from './MenuOverlay'
import { MediaLogo, MediaLogoWhite } from './Logo'
import './header.css'

export type NavLink = { label: string; target: string; image?: string }

export function Header({ links }: { links: NavLink[] }) {
  const { ready } = useExperience()
  const { pathname } = useLocation()
  const { scrollTo, lenis } = useSmoothScroll()
  const navTo = useNavTo()
  const { theme: globalTheme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  // Tone of the section under the header: 'auto' follows the global theme.
  const [tone, setTone] = useState<'auto' | 'dark' | 'light'>('auto')
  const theme = tone === 'auto' ? globalTheme : tone
  const [active, setActive] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const root = useRef<HTMLElement>(null)
  const progress = useRef<HTMLDivElement>(null)

  useScrollListener(({ scroll, direction }) => {
    setScrolled(scroll > 40)
    if (scroll < 160) setHidden(false)
    else if (direction === 1) setHidden(true)
    else if (direction === -1) setHidden(false)
    const max = document.documentElement.scrollHeight - window.innerHeight
    if (progress.current) progress.current.style.transform = `scaleX(${max > 0 ? scroll / max : 0})`
  })

  // Header theme follows the section underneath it; nav highlights the section in view.
  useEffect(() => {
    if (!ready) return
    setTone('auto')
    setActive(null)
    const triggers: ScrollTrigger[] = []
    document.querySelectorAll<HTMLElement>('[data-header-theme]').forEach((el) => {
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: 'top top+=44',
          end: 'bottom top+=44',
          refreshPriority: -1,
          onToggle: (self) => self.isActive && setTone((el.dataset.headerTheme ?? 'auto') as 'auto' | 'dark' | 'light'),
        }),
      )
    })
    links.forEach((l) => {
      if (!l.target.startsWith('#')) return
      const el = document.querySelector(l.target)
      if (!el) return
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          refreshPriority: -1,
          onToggle: (self) => {
            if (self.isActive) setActive(l.label)
            else setActive((a) => (a === l.label ? null : a))
          },
        }),
      )
    })
    return () => triggers.forEach((t) => t.kill())
  }, [ready, links, pathname])

  // Entrance
  useEffect(() => {
    if (!ready || !root.current) return
    const items = root.current.querySelectorAll('.hdr__logo, .hdr__link, .hdr__right > *')
    const tween = gsap.fromTo(
      items,
      { yPercent: -140, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 1.2, stagger: 0.06, ease: 'silk', delay: 0.35 },
    )
    return () => {
      tween.kill()
    }
  }, [ready])

  useEffect(() => {
    if (menuOpen) lenis?.stop()
    else lenis?.start()
  }, [menuOpen, lenis])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    const onResize = () => window.innerWidth > 980 && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const goTo = (target: string) => {
    if (menuOpen) {
      // Re-enable smooth scroll first — starting Lenis later would cancel the scroll.
      setMenuOpen(false)
      lenis?.start()
      window.setTimeout(() => navTo(target), 60)
      return
    }
    navTo(target)
  }

  const pillFor = hovered ?? active

  return (
    <>
      <header
        ref={root}
        className={`hdr${hidden && !menuOpen ? ' is-hidden' : ''}${scrolled ? ' is-scrolled' : ''}${menuOpen ? ' is-menu' : ''}`}
        data-theme={menuOpen ? 'dark' : theme}
      >
        <div className="hdr__bar">
          <a
            href="/"
            className="hdr__logo"
            aria-label={`${brand.name} home`}
            onClick={(e) => {
              e.preventDefault()
              setMenuOpen(false)
              if (pathname === '/') scrollTo(0, { duration: 2.2 })
              else navTo('/')
            }}
          >
            <MediaLogoWhite small className="hdr__logo-img hdr__logo-img--white" />
            <MediaLogo small className="hdr__logo-img hdr__logo-img--color" hidden />
          </a>

          <nav className="hdr__nav" aria-label="Primary" onMouseLeave={() => setHovered(null)}>
            {links.map((l) => (
              <a
                key={l.label}
                href={l.target.startsWith('#') ? `/${l.target}` : l.target}
                className={`hdr__link roll-host${active === l.label ? ' is-active' : ''}`}
                onMouseEnter={() => setHovered(l.label)}
                onFocus={() => setHovered(l.label)}
                onBlur={() => setHovered(null)}
                onClick={(e) => {
                  e.preventDefault()
                  goTo(l.target)
                }}
              >
                {pillFor === l.label && (
                  <motion.span
                    layoutId="hdr-pill"
                    className="hdr__pill"
                    transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
                  />
                )}
                <RollText text={l.label} />
              </a>
            ))}
          </nav>

          <div className="hdr__right">
            <button
              className={`hdr__theme${globalTheme === 'dark' ? ' is-dark' : ''}`}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
              }}
              aria-label={`Switch to ${globalTheme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${globalTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span className="hdr__theme-knob">
                <svg className="hdr__sun" viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="4.2" fill="currentColor" />
                  <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
                  </g>
                </svg>
                <svg className="hdr__moon" viewBox="0 0 24 24" aria-hidden>
                  <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor" />
                </svg>
              </span>
            </button>
            <Magnetic strength={0.3} className="hdr__cta-wrap">
              <a
                href="/#contact"
                className="hdr__cta roll-host"
                onClick={(e) => {
                  e.preventDefault()
                  goTo('#contact')
                }}
              >
                <RollText text="Let’s talk" />
                <span className="hdr__cta-dot" aria-hidden />
              </a>
            </Magnetic>
            <Magnetic strength={0.3} className="hdr__burger-wrap">
              <button
                className="hdr__burger roll-host"
                aria-expanded={menuOpen}
                aria-controls="site-menu"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMenuOpen((o) => !o)}
              >
                <span className="hdr__burger-text">
                  <RollText text={menuOpen ? 'Close' : 'Menu'} key={menuOpen ? 'c' : 'm'} />
                </span>
                <span className="hdr__burger-lines" aria-hidden>
                  <i />
                  <i />
                </span>
              </button>
            </Magnetic>
          </div>
        </div>
        <div className="hdr__progress" aria-hidden>
          <div ref={progress} className="hdr__progress-bar" />
        </div>
      </header>
      <MenuOverlay open={menuOpen} links={links} onNavigate={goTo} />
    </>
  )
}
