import { useRef } from 'react'
import { Header } from '../components/Header'
import { useExperience, TransitionLink } from '../providers/Experience'
import { gsap, SplitText, useGSAP } from '../lib/gsap'
import { Arrow } from '../components/ui'
import './home.css'

const cuts = [
  {
    to: '/v1',
    n: 'V1',
    title: 'The Studio',
    body: 'The homepage, reimagined. A refractive glass loop in real-time 3D, crossing ribbons, a 3D production ring, horizontal services and stacked values.',
    tags: ['Glass 3D hero', '3D process ring', 'Horizontal scroll', 'Stacked cards'],
  },
  {
    to: '/v2',
    n: 'V2',
    title: 'The Story',
    body: 'The director’s cut. One continuous scroll film where thousands of particles become an idea, a script, a storyboard, a voice, a loop — and finally, OsLoop.',
    tags: ['Particle morphing', 'Scroll film', 'Timeline HUD', '10 chapters'],
  },
  {
    to: '/v3',
    n: 'V3',
    title: 'The Hybrid',
    body: 'Story meets studio. Who OsLoop is, what it makes and why clients stay — told as one scroll, with the particle story reacting to every section.',
    tags: ['Clear services', '7-step story', 'Bento strengths', 'Brief builder'],
    badge: 'Recommended',
  },
]

const NO_LINKS: never[] = []

export default function Home() {
  const { ready } = useExperience()
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!ready) return
      const split = SplitText.create('.home__title', { type: 'lines,words', mask: 'lines', linesClass: 'split-line' })
      gsap
        .timeline({ delay: 0.2 })
        .set('.home__title, .home__kicker, .home__cut, .home__foot', { visibility: 'visible' })
        .from(split.words, { yPercent: 120, duration: 1.3, stagger: 0.06 })
        .from('.home__kicker', { autoAlpha: 0, y: 16, duration: 1 }, 0.2)
        .from('.home__cut', { yPercent: 18, autoAlpha: 0, duration: 1.4, stagger: 0.14 }, 0.35)
        .from('.home__foot > *', { autoAlpha: 0, y: 16, duration: 1, stagger: 0.08 }, 0.8)
    },
    { scope: root, dependencies: [ready] },
  )

  return (
    <>
      <Header links={NO_LINKS} version="home" ctaTarget="#cuts" />
      <main className="home" ref={root} data-header-theme="auto">
        <div className="home__aurora" aria-hidden />
        <div className="home__intro">
          <p className="mono home__kicker">OsLoop — Landing concepts · 2026</p>
          <h1 className="home__title">
            Three cuts. <span className="serif">One story.</span>
          </h1>
        </div>
        <div className="home__cuts" id="cuts">
          {cuts.map((c) => (
            <TransitionLink key={c.to} to={c.to} className={`home__cut home__cut--${c.n.toLowerCase()}`} data-cursor="Enter">
              <div className="home__cut-bg" aria-hidden>
                {c.n !== 'V2' && <div className="home__ring" />}
                {c.n !== 'V1' && <div className="home__stars" />}
              </div>
              <div className="home__cut-top">
                <span className="home__cut-n">
                  {c.n}
                  {'badge' in c && <span className="home__badge mono">{c.badge}</span>}
                </span>
                <span className="home__cut-go">
                  <Arrow size={20} rotate={-45} />
                </span>
              </div>
              <div className="home__cut-body">
                <h2>{c.title}</h2>
                <p>{c.body}</p>
                <ul>
                  {c.tags.map((t) => (
                    <li key={t} className="mono">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </TransitionLink>
          ))}
        </div>
        <div className="home__foot mono">
          <span>React · GSAP · Lenis · Three.js · Motion</span>
          <span>Best experienced on desktop, scrolled slowly</span>
        </div>
      </main>
    </>
  )
}
