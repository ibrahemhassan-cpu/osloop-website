import { lazy, Suspense, useCallback, useRef, useState } from 'react'
import { Header, type NavLink } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { ReelModal } from '../../components/ReelModal'
import { Button } from '../../components/ui'
import { useExperience, TransitionLink } from '../../providers/Experience'
import { useSmoothScroll } from '../../providers/SmoothScroll'
import { useAutoReveal } from '../../lib/useAutoReveal'
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap'
import { brand } from '../../lib/content'
import { chapters, shapeOrder, viewOrder } from './chapters'
import { useTheme } from '../../providers/Theme'
import { ChapterView, RichTitle } from './ChapterView'
import './v2.css'

const ParticleField = lazy(() => import('../../particles/ParticleField'))

const CH_VH = 120 // section height per chapter, in vh
// Scroll distance actually travelled per chapter (the sticky stage eats one viewport).
const SPAN_VH = (chapters.length * CH_VH - 100) / chapters.length
const FILM_SECONDS = 150

const LINKS: NavLink[] = [
  { label: 'Prologue', target: '#ch-prologue' },
  { label: 'The Idea', target: '#ch-idea' },
  { label: 'The Craft', target: '#ch-script' },
  { label: 'Promise', target: '#ch-promise' },
  { label: 'World', target: '#ch-world' },
  { label: 'Contact', target: '#contact' },
]

const smoothstep = (x: number) => x * x * (3 - 2 * x)

function timecode(r: number) {
  const t = r * FILM_SECONDS
  const mm = Math.floor(t / 60)
  const ss = Math.floor(t % 60)
  const ff = Math.floor((t % 1) * 24)
  const p = (n: number) => String(n).padStart(2, '0')
  return `00:${p(mm)}:${p(ss)}:${p(ff)}`
}

export default function V2() {
  const { ready } = useExperience()
  const { theme } = useTheme()
  const { scrollTo } = useSmoothScroll()
  const main = useRef<HTMLElement>(null)
  const story = useRef<HTMLElement>(null)
  const hud = useRef<HTMLDivElement>(null)
  const progress = useRef(0)
  const storyP = useRef(0)
  const finaleP = useRef(0)
  const [active, setActive] = useState(0)
  const [reelOpen, setReelOpen] = useState(false)
  const closeReel = useCallback(() => setReelOpen(false), [])
  useAutoReveal(main, ready)

  useGSAP(
    () => {
      const N = chapters.length
      const tc = hud.current!.querySelector('.v2-hud__tc')!
      const head = hud.current!.querySelector<HTMLElement>('.v2-hud__head')!
      const fill = hud.current!.querySelector<HTMLElement>('.v2-hud__fill')!
      let idleTimer = 0

      ScrollTrigger.create({
        trigger: story.current,
        start: 'top top',
        end: 'bottom bottom',
        onToggle: (self) => hud.current!.classList.toggle('is-on', self.isActive),
        onUpdate: (self) => {
          const r = self.progress
          const x = Math.min(r * N, N - 0.0001)
          const k = Math.floor(x)
          const s = x - k
          storyP.current = k === 0 ? 0 : k - 1 + smoothstep(Math.min(s / 0.45, 1))
          progress.current = storyP.current + finaleP.current
          setActive((a) => (a === k ? a : k))
          tc.textContent = timecode(r)
          head.style.transform = `translateX(${r * 100}%)`
          fill.style.transform = `scaleX(${r})`
          hud.current!.classList.add('is-playing')
          window.clearTimeout(idleTimer)
          idleTimer = window.setTimeout(() => hud.current?.classList.remove('is-playing'), 700)
        },
      })

      ScrollTrigger.create({
        trigger: '.v2-finale',
        start: 'top bottom',
        end: 'top top',
        onUpdate: (self) => {
          finaleP.current = smoothstep(self.progress)
          progress.current = storyP.current + finaleP.current
        },
      })

      gsap.to('.v2-canvas', {
        opacity: 0.35,
        ease: 'none',
        scrollTrigger: { trigger: '.v2-finale', start: 'center center', end: 'bottom top', scrub: true },
      })
    },
    { scope: main },
  )

  const jump = (i: number) => {
    const el = document.getElementById(`ch-${chapters[i].id}`)
    if (el) scrollTo(el, { duration: 2.2 })
  }

  return (
    <>
      <Header links={LINKS} version="v2" />
      <main className="v2" ref={main}>
        <div className="v2-canvas" aria-hidden>
          <Suspense fallback={null}>
            <ParticleField progress={progress} shapes={shapeOrder} views={viewOrder} theme={theme} />
          </Suspense>
        </div>
        <div className="v2-vignette" aria-hidden />

        <section className="v2-story" ref={story} style={{ height: `${chapters.length * CH_VH}vh` }} data-header-theme="auto">
          {chapters.map((c, i) => (
            <div
              key={c.id}
              id={`ch-${c.id}`}
              className="v2-marker"
              style={{ top: `${i * SPAN_VH + (i === 0 ? 0 : SPAN_VH * 0.5)}vh`, height: `${SPAN_VH * (i === 0 ? 1 : 0.5)}vh` }}
            />
          ))}
          <div className="v2-stage">
            {chapters.map((c, i) => (
              <ChapterView
                key={c.id}
                chapter={c}
                index={i}
                active={ready && i === active}
                onCta={(k) => (k === 'reel' ? setReelOpen(true) : scrollTo('#contact', { duration: 2.2 }))}
              />
            ))}
          </div>
        </section>

        <section className="v2-finale" id="contact" data-header-theme="auto">
          <p className="mono v2-finale__kicker" data-reveal="fade">
            Fin. — or just the beginning
          </p>
          <h2 className="v2-finale__title" data-reveal="lines">
            <RichTitle text="Ready to write *your story?*" />
          </h2>
          <div className="v2-finale__row">
            <p className="v2-finale__p" data-reveal="fade">
              Tell us about your product, your audience and your deadline. We’ll come back with a creative direction and a
              clear plan to bring it to life.
            </p>
            <div className="v2-finale__ctas" data-reveal="fade" data-delay="0.15">
              <Button label="Request your video" variant="blue" href={`mailto:${brand.email}?subject=Video%20request`} />
              <Button label="Watch the reel" variant="ghost" onClick={() => setReelOpen(true)} />
            </div>
          </div>
          <div className="v2-finale__meta" data-reveal="fade">
            <a href={`mailto:${brand.email}`}>{brand.email}</a>
            <span>{brand.location}</span>
            <TransitionLink to="/v1">Switch to V1 — The Studio →</TransitionLink>
          </div>
        </section>

        <Footer links={LINKS} />
      </main>

      {/* Story HUD: chapter rail + editing timeline */}
      <div className="v2-hud" ref={hud} aria-label="Story navigation">
        <div className="v2-hud__corners" aria-hidden>
          <i />
          <i />
          <i />
          <i />
        </div>
        <ol className="v2-rail">
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button className={i === active ? 'is-on' : i < active ? 'is-past' : ''} onClick={() => jump(i)}>
                <span className="mono">{String(i).padStart(2, '0')}</span>
                <em>{c.nav}</em>
              </button>
            </li>
          ))}
        </ol>
        <div className="v2-hud__bar">
          <div className="v2-hud__left mono">
            <span className="v2-hud__rec" />
            <span className="v2-hud__state" />
            <span className="v2-hud__tc">00:00:00:00</span>
          </div>
          <div className="v2-hud__track">
            <div className="v2-hud__fill" />
            {chapters.map((c, i) => (
              <button
                key={c.id}
                className="v2-hud__tick"
                style={{ left: `${(i / chapters.length) * 100}%` }}
                onClick={() => jump(i)}
                aria-label={`Jump to ${c.nav}`}
              >
                <span className="mono">{c.nav}</span>
              </button>
            ))}
            <div className="v2-hud__head" />
          </div>
          <div className="v2-hud__right mono">
            <span>
              CH {String(active).padStart(2, '0')} / {String(chapters.length - 1).padStart(2, '0')}
            </span>
            <span className="v2-hud__muted">4K · 24 FPS</span>
          </div>
        </div>
      </div>

      <ReelModal open={reelOpen} onClose={closeReel} />
    </>
  )
}
