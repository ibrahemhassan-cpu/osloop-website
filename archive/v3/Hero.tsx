import { useRef } from 'react'
import { gsap, SplitText, useGSAP } from '../../lib/gsap'
import { useExperience } from '../../providers/Experience'
import { useSmoothScroll } from '../../providers/SmoothScroll'
import { services } from '../../lib/content'
import { Arrow, Button } from '../../components/ui'

const ICONS = [
  <path key="e" d="M4 5h16v11H4zM9 20h6M12 16v4M10 8.5l4 2.5-4 2.5z" />,
  <path key="3" d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5" />,
  <path key="w" d="M3 5h18v14H3zM3 9h18M7 7h.01M10 7h.01M7 13h6M7 16h4" />,
]

export function Hero({ onReel }: { onReel: () => void }) {
  const root = useRef<HTMLElement>(null)
  const { ready } = useExperience()
  const { scrollTo } = useSmoothScroll()

  useGSAP(
    () => {
      if (!ready) return
      const title = SplitText.create('.v3-hero__title', { type: 'lines,words', mask: 'lines', linesClass: 'split-line' })
      gsap
        .timeline({ delay: 0.15 })
        .set('.v3-hero__copy, .v3-hero__cards, .v3-hero__scroll', { visibility: 'visible' })
        .from('.v3-hero__kicker', { autoAlpha: 0, y: 14, duration: 1 }, 0)
        .from(title.words, { yPercent: 120, duration: 1.4, stagger: 0.045 }, 0.15)
        .from('.v3-hero__sub, .v3-hero__ctas, .v3-hero__proof > *', { autoAlpha: 0, y: 26, duration: 1.2, stagger: 0.08 }, 0.6)
        .from('.v3-qcard', { autoAlpha: 0, y: 60, duration: 1.3, stagger: 0.1 }, 0.8)
        .from('.v3-hero__scroll', { autoAlpha: 0, duration: 1 }, 1.4)

      gsap.to('.v3-hero__copy', {
        yPercent: -12,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom 20%', scrub: true },
      })
    },
    { scope: root, dependencies: [ready] },
  )

  return (
    <section className="v3-hero" id="top" ref={root} data-header-theme="auto">
      <div className="v3-hero__copy">
        <p className="v3-hero__kicker mono">
          <span className="v3-dot" /> OsLoop Media Production · Animation studio
        </p>
        <h1 className="v3-hero__title">
          We turn complex ideas into <span className="serif">animated stories</span> people remember.
        </h1>
        <p className="v3-hero__sub">
          Explainer videos, 3D production and animated websites — scripted, designed, animated and sound-designed by one
          team, from Alexandria to the world.
        </p>
        <div className="v3-hero__ctas">
          <Button label="Request your video" variant="blue" onClick={() => scrollTo('#contact', { duration: 2.6 })} />
          <Button label="Watch the reel" variant="ghost" cursor="Play" onClick={onReel} />
        </div>
        <ul className="v3-hero__proof">
          <li>
            <strong className="v3-stars">★★★★★</strong>
            <span>Five-star client reviews</span>
          </li>
          <li>
            <strong>7</strong>
            <span>Production stages, one team</span>
          </li>
          <li>
            <strong>5</strong>
            <span>Animation styles</span>
          </li>
        </ul>
      </div>

      <div className="v3-hero__cards">
        {services.map((s, i) => (
          <a
            key={s.id}
            href="#services"
            className="v3-qcard"
            onClick={(e) => {
              e.preventDefault()
              scrollTo(`#svc-${s.id}`, { duration: 2, offset: -120 })
            }}
          >
            <span className="v3-qcard__icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {ICONS[i]}
              </svg>
            </span>
            <span className="v3-qcard__text">
              <strong>{s.title}</strong>
              <span>{s.lead}</span>
            </span>
            <span className="v3-qcard__arrow">
              <Arrow rotate={-45} />
            </span>
          </a>
        ))}
      </div>

      <button className="v3-hero__scroll mono" onClick={() => scrollTo('#about', { duration: 2 })}>
        <span className="v3-hero__scroll-line" />
        Scroll — this is how a story gets made
      </button>
    </section>
  )
}
