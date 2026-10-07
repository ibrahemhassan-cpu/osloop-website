import { useEffect, useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { brand, socials } from '../lib/content'
import type { NavLink } from './Header'
import { Arrow, RollText } from './ui'

type Props = {
  open: boolean
  links: NavLink[]
  onNavigate: (target: string) => void
}

/** Full-screen menu — used on tablets and phones, where the inline nav is hidden. */
export function MenuOverlay({ open, links, onNavigate }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const items = [...links, { label: 'Contact', target: '#contact' }]

  useGSAP(
    () => {
      tl.current = gsap
        .timeline({ paused: true, defaults: { ease: 'silk' } })
        .set(root.current, { visibility: 'visible' })
        .fromTo('.menu__panel', { yPercent: -100 }, { yPercent: 0, duration: 1.05, ease: 'drift', stagger: 0.1 })
        .fromTo('.menu__label-inner', { yPercent: 120, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.06 }, '-=0.45')
        .fromTo('.menu__idx', { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.8, stagger: 0.06 }, '<+0.15')
        .fromTo('.menu__rule', { scaleX: 0 }, { scaleX: 1, duration: 1.2, stagger: 0.06, transformOrigin: 'left' }, '<')
        .fromTo('.menu__fade', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.06 }, '<+0.2')
    },
    { scope: root },
  )

  useEffect(() => {
    const t = tl.current
    if (!t) return
    if (open) t.timeScale(1).play()
    else if (t.progress() > 0) t.timeScale(1.6).reverse()
  }, [open])

  return (
    <div id="site-menu" className={`menu${open ? ' is-open' : ''}`} ref={root} aria-hidden={!open}>
      <div className="menu__panel menu__panel--blue" />
      <div className="menu__panel menu__panel--ink">
        <div className="menu__glow" />
      </div>

      <div className="menu__inner" data-lenis-prevent>
        <nav className="menu__nav">
          {items.map((l, i) => (
            <a
              key={l.label}
              href={l.target.startsWith('#') ? `/${l.target}` : l.target}
              className="menu__link"
              onClick={(e) => {
                e.preventDefault()
                onNavigate(l.target)
              }}
              tabIndex={open ? 0 : -1}
            >
              <span className="menu__rule" />
              <span className="menu__idx mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="menu__label">
                <span className="menu__label-inner">{l.label}</span>
              </span>
              <span className="menu__arrow">
                <Arrow size={24} rotate={-45} />
              </span>
            </a>
          ))}
        </nav>

        <aside className="menu__aside">
          <div className="menu__block menu__fade">
            <p className="mono menu__kicker">Say hello</p>
            <a className="menu__mail roll-host" href={`mailto:${brand.email}`} tabIndex={open ? 0 : -1}>
              <RollText text={brand.email} />
            </a>
            <a className="menu__muted" href={brand.mapUrl} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
              {brand.location}
            </a>
          </div>
          <div className="menu__block menu__fade">
            <p className="mono menu__kicker">Follow</p>
            <div className="menu__socials">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="roll-host" tabIndex={open ? 0 : -1}>
                  <RollText text={s.label} />
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
