import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { brand, legal, socials } from '../lib/content'
import { useClock } from '../lib/useClock'
import { useNavTo } from '../lib/useNavTo'
import { useSmoothScroll } from '../providers/SmoothScroll'
import type { NavLink } from './Header'
import { Arrow, Magnetic, RollText } from './ui'
import './footer.css'

/*
 * Cuts between the letters of the white OsLoop logo (o | s | L | ∞ | p), as % of its width for each of
 * 24 horizontal bands — measured from the logo file. They let every letter rise on its own, like the
 * original character-by-character reveal, while the logo itself stays untouched.
 */
const BANDS = 24
const CUTS = [
  [18.48, 18.48, 18.48, 18.48, 18.59, 18.73, 18.81, 18.92, 19.06, 19.17, 19.23, 19.34, 19.56, 19.5, 18.59, 17.51, 16.9, 16.76, 16.76, 16.76, 16.76, 16.76, 16.76, 16.76],
  [39.09, 37.51, 36.35, 33.25, 33.94, 33.91, 33.25, 32.45, 32.34, 32.5, 32.53, 32.42, 32.28, 32.12, 31.78, 31.34, 30.68, 29.76, 29.76, 29.76, 29.76, 29.76, 29.76, 29.76],
  [42.82, 42.66, 42.41, 46.28, 44.95, 44.12, 43.49, 43.07, 42.71, 42.46, 42.3, 42.21, 42.16, 44.62, 45.2, 46.03, 47.28, 48.69, 48.69, 48.69, 48.69, 48.69, 48.69, 48.69],
  [80.66, 80.66, 80.66, 80.66, 80.55, 80.5, 80.5, 80.47, 80.47, 80.47, 80.33, 80.22, 79.97, 79.67, 79.25, 78.73, 77.9, 76.76, 78.67, 78.34, 78.09, 77.84, 77.59, 77.34],
]
const stairs = (xs: number[]) => xs.flatMap((x, i) => [`${x}% ${((i * 100) / BANDS).toFixed(3)}%`, `${x}% ${(((i + 1) * 100) / BANDS).toFixed(3)}%`])
const LETTERS = Array.from({ length: CUTS.length + 1 }, (_, k) => {
  const right = k < CUTS.length ? stairs(CUTS[k]) : ['100% 0%', '100% 100%']
  const left = k > 0 ? stairs(CUTS[k - 1]).reverse() : ['0% 100%', '0% 0%']
  return `polygon(${[...right, ...left].join(',')})`
})

export function Footer({ links }: { links: NavLink[] }) {
  const root = useRef<HTMLElement>(null)
  const { scrollTo } = useSmoothScroll()
  const navTo = useNavTo()
  const time = useClock(brand.timeZone)

  useGSAP(
    () => {
      gsap.from('.ftr__letter', {
        yPercent: 100,
        ease: 'none',
        stagger: 0.05,
        scrollTrigger: { trigger: '.ftr__mark', start: 'top bottom', end: 'bottom bottom', scrub: 1.2 },
      })
      gsap.from('.ftr__inner', {
        yPercent: -25,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom bottom', scrub: true },
      })
    },
    { scope: root },
  )

  const link = (target: string, label: string) => (
    <a
      key={label}
      href={target.startsWith('#') ? `/${target}` : target}
      className="roll-host"
      onClick={(e) => {
        e.preventDefault()
        navTo(target)
      }}
    >
      <RollText text={label} />
    </a>
  )

  return (
    <footer className="ftr" ref={root} data-header-theme="dark" data-theme="dark">
      <div className="ftr__inner">
        <div className="ftr__grid">
          <div className="ftr__col ftr__col--lead">
            <p className="ftr__lead">
              Animation & video production studio crafting explainer videos, 3D productions and animated websites —
              <span className="serif"> for brands with a story.</span>
            </p>
            <Magnetic strength={0.2}>
              <a
                className="btn btn--blue roll-host"
                href="/#contact"
                onClick={(e) => {
                  e.preventDefault()
                  navTo('#contact')
                }}
              >
                <RollText text="Start a project" />
                <span className="btn__icon">
                  <Arrow />
                </span>
              </a>
            </Magnetic>
          </div>
          <div className="ftr__col">
            <p className="mono ftr__kicker">Explore</p>
            {links.map((l) => link(l.target, l.label))}
            {link('/projects', 'All projects')}
          </div>
          <div className="ftr__col">
            <p className="mono ftr__kicker">Contact</p>
            <a href={`mailto:${brand.email}`} className="roll-host">
              <RollText text={brand.email} />
            </a>
            <a href={brand.mapUrl} target="_blank" rel="noreferrer" className="roll-host">
              <RollText text={brand.location} />
            </a>
            <span className="ftr__muted">Local time {time}</span>
          </div>
          <div className="ftr__col">
            <p className="mono ftr__kicker">Follow</p>
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="roll-host">
                <RollText text={s.label} />
              </a>
            ))}
          </div>
        </div>

        <div className="ftr__mark" role="img" aria-label={brand.name}>
          {LETTERS.map((clip, i) => (
            <img key={i} className="ftr__letter" src={brand.logoWhite} alt="" style={{ clipPath: clip }} draggable={false} decoding="async" />
          ))}
        </div>

        <div className="ftr__bottom mono">
          <span>
            © {new Date().getFullYear()} {brand.fullName}. All rights reserved.
          </span>
          <span className="ftr__legal">
            {legal.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
          </span>
          <Magnetic strength={0.4}>
            <button className="ftr__top" onClick={() => scrollTo(0, { duration: 2.6 })} aria-label="Back to top">
              <Arrow rotate={-90} />
            </button>
          </Magnetic>
        </div>
      </div>
    </footer>
  )
}
