import { lazy, Suspense, useCallback, useRef, useState } from 'react'
import { Header, type NavLink } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { ReelModal } from '../../components/ReelModal'
import { useExperience } from '../../providers/Experience'
import { useTheme } from '../../providers/Theme'
import { useAutoReveal } from '../../lib/useAutoReveal'
import { ScrollTrigger, useGSAP } from '../../lib/gsap'
import { images, reel } from '../../lib/content'
import { Reel } from '../v1/Reel'
import { Hero } from './Hero'
import { About, Industries, Reviews, Services, Why } from './Sections'
import { Process, PROCESS_ID } from './Process'
import { Contact } from './Contact'
import { FADES, MOBILE_FADES, PROCESS_SLOT, PROCESS_STEPS, SHAPES, VIEWS } from './stage'
import './v3.css'

const ParticleField = lazy(() => import('../../particles/ParticleField'))

const LINKS: NavLink[] = [
  { label: 'About', target: '#about', image: images.explainer },
  { label: 'Services', target: '#services', image: images.videoRoom },
  { label: 'Reel', target: '#reel', image: reel.poster },
  { label: 'Process', target: '#process', image: images.handDrawn },
  { label: 'Why us', target: '#why', image: images.explainer },
  { label: 'Reviews', target: '#reviews', image: reel.poster },
]

const smooth = (x: number) => x * x * (3 - 2 * x)

export default function V3() {
  const { ready } = useExperience()
  const { theme } = useTheme()
  const main = useRef<HTMLElement>(null)
  const progress = useRef(0)
  const fade = useRef(1)
  const [reelOpen, setReelOpen] = useState(false)
  const closeReel = useCallback(() => setReelOpen(false), [])
  useAutoReveal(main, ready)

  // Each section (and each process step) is a "beat" that morphs the particle field.
  useGSAP(
    () => {
      type Range = { start: () => number; end: () => number }
      const section = (sel: string, start = 'top 75%', end = 'top 20%'): Range => {
        const st = ScrollTrigger.create({ trigger: sel, start, end })
        return { start: () => st.start, end: () => st.end }
      }
      const pin = ScrollTrigger.getById(PROCESS_ID)!
      const N = PROCESS_STEPS.length
      const step = (i: number): Range => ({
        start: () => pin.start + ((pin.end - pin.start) * i) / N,
        end: () => pin.start + ((pin.end - pin.start) * (i + 0.4)) / N,
      })

      const ranges: (Range | null)[] = [
        null, // hero
        section('#about'),
        section('#services'),
        section('#process', 'top 85%', 'top top'),
        ...Array.from({ length: N - 1 }, (_, i) => step(i + 1)),
        section('#why'),
        section('#industries'),
        section('#reviews'),
        section('#contact', 'top 80%', 'top 25%'),
      ]
      if (ranges.length !== SHAPES.length || PROCESS_SLOT !== 3) console.warn('V3 stage/slot mismatch')

      const compute = (y: number) => {
        let p = 0
        for (let k = 1; k < ranges.length; k++) {
          const r = ranges[k]!
          const s = r.start()
          if (y < s) break
          p = k - 1 + smooth(Math.min(1, (y - s) / Math.max(1, r.end() - s)))
        }
        progress.current = p
        const k = Math.floor(p)
        const t = p - k
        const F = window.innerWidth < 760 ? MOBILE_FADES : FADES
        fade.current = F[k] + ((F[k + 1] ?? F[k]) - F[k]) * t
      }

      ScrollTrigger.create({
        trigger: main.current,
        start: 'top top',
        end: 'max',
        onUpdate: (self) => compute(self.scroll()),
        onRefresh: (self) => compute(self.scroll()),
      })
    },
    { scope: main },
  )

  return (
    <>
      <Header links={LINKS} version="v3" />
      <main className="v3" ref={main}>
        <div className="v3-canvas" aria-hidden>
          <Suspense fallback={null}>
            <ParticleField progress={progress} fade={fade} shapes={SHAPES} views={VIEWS} theme={theme} />
          </Suspense>
        </div>
        <Hero onReel={() => setReelOpen(true)} />
        <About />
        <Services />
        <Reel label="(03) — Showreel" title="See our work in motion" />
        <Process />
        <Why />
        <Industries />
        <Reviews />
        <Contact />
        <Footer links={LINKS} />
      </main>
      <ReelModal open={reelOpen} onClose={closeReel} />
    </>
  )
}
