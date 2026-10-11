import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { brand, legal, socials } from '../lib/content'
import { useClock } from '../lib/useClock'
import { useNavTo } from '../lib/useNavTo'
import { useSmoothScroll } from '../providers/SmoothScroll'
import type { NavLink } from './Header'
import { Arrow, Magnetic, RollText } from './ui'
import { LogoWhite } from './Logo'
import './footer.css'

export function Footer({ links }: { links: NavLink[] }) {
  const root = useRef<HTMLElement>(null)
  const { scrollTo } = useSmoothScroll()
  const navTo = useNavTo()
  const time = useClock(brand.timeZone)

  useGSAP(
    () => {
      gsap.fromTo(
        '.ftr__logo',
        { clipPath: 'inset(100% 0% 0% 0%)', yPercent: 18 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          yPercent: 0,
          ease: 'none',
          scrollTrigger: { trigger: '.ftr__mark', start: 'top bottom', end: 'bottom bottom', scrub: 1.2 },
        },
      )
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

        <div className="ftr__mark">
          <LogoWhite className="ftr__logo" />
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
