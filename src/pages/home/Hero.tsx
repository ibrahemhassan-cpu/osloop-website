import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../lib/gsap'
import { useExperience } from '../../providers/Experience'
import { useSmoothScroll } from '../../providers/SmoothScroll'
import { useMedia } from '../../lib/useMedia'
import { useTheme } from '../../providers/Theme'
import { Button } from '../../components/ui'

const HeroScene = lazy(() => import('./HeroScene'))

const WORDS = ['Explainer Videos', '3D Production', 'Animated Websites']

export function Hero() {
  const { ready } = useExperience()
  const { scrollTo } = useSmoothScroll()
  const root = useRef<HTMLElement>(null)
  const progress = useRef(0)
  const intro = useRef(0)
  const [active, setActive] = useState(true)
  const [hinted, setHinted] = useState(false)
  const mobile = useMedia('(max-width: 760px)')
  const { theme } = useTheme()

  // Pin the hero so the next section slides over it like a sheet.
  useGSAP(
    () => {
      const el = root.current!
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom top',
        pin: true,
        pinSpacing: false,
        scrub: true,
        onUpdate: (self) => {
          progress.current = self.progress
        },
        // Stop rendering WebGL once the hero is fully covered.
        onToggle: (self) => setActive(self.isActive),
      })
      gsap.to('.v1-hero__content', {
        yPercent: -18,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to('.v1-hero__shade', {
        opacity: 0.85,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      })
    },
    { scope: root },
  )

  // Intro choreography — waits for the preloader / curtain.
  useGSAP(
    () => {
      if (!ready) return
      const title = SplitText.create('.v1-hero__title', { type: 'lines,words', mask: 'lines', linesClass: 'split-line' })
      const tl = gsap.timeline({ delay: 0.1 })
      tl.set('.v1-hero__content', { visibility: 'visible' })
        .to(intro, { current: 1, duration: 2.6, ease: 'expo.out' }, 0)
        .from('.v1-hero__canvas', { autoAlpha: 0, duration: 1.6, ease: 'power2.out' }, 0)
        .from(title.words, { yPercent: 120, duration: 1.4, stagger: 0.07 }, 0.35)
        .from('.v1-hero__aside > *', { autoAlpha: 0, y: 30, duration: 1.2, stagger: 0.1 }, 0.75)
        .from('.v1-hero__hint', { autoAlpha: 0, y: 20, duration: 1.2 }, 1.6)
    },
    { scope: root, dependencies: [ready] },
  )

  // The drag hint retires after the first spin.
  useEffect(() => {
    const hide = () => setHinted(true)
    window.addEventListener('loop:grab', hide)
    return () => window.removeEventListener('loop:grab', hide)
  }, [])

  // Rotating word prism.
  useEffect(() => {
    if (!ready) return
    const prism = root.current!.querySelector('.v1-prism__inner')
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      gsap.to(prism, { rotateX: i * 120, duration: 1.2, ease: 'silk' })
    }, 2800)
    return () => window.clearInterval(id)
  }, [ready])

  return (
    <section className="v1-hero" ref={root} data-header-theme="auto" id="top">
      <div className="v1-hero__canvas">
        <Suspense fallback={null}>
          <HeroScene progress={progress} intro={intro} active={active} mobile={mobile} theme={theme} />
        </Suspense>
      </div>
      <div className="v1-hero__vignette" aria-hidden />
      <div className="v1-hero__content">
        <div className="v1-hero__bottom">
          <h1 className="v1-hero__title">
            Your story, <br />
            <span className="serif">our</span> expertise.
          </h1>
          <div className="v1-hero__aside">
            <div className="v1-prism" aria-label={WORDS.join(', ')}>
              <span className="v1-prism__dot" />
              <div className="v1-prism__view">
                <div className="v1-prism__inner">
                  {WORDS.map((w, i) => (
                    <span key={w} className="v1-prism__face" style={{ ['--f' as string]: i }}>
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="v1-hero__lede">
              Prioritizing client collaboration and satisfaction — strong partnerships, tailored services, and animation
              that makes people feel something.
            </p>
            <div className="v1-hero__ctas">
              <Button label="Request your video" variant="light" onClick={() => scrollTo('#contact', { duration: 2.4 })} />
              <Button label="Watch reel" variant="ghost" onClick={() => scrollTo('#reel', { duration: 2 })} />
            </div>
          </div>
        </div>
      </div>
      <div className="v1-hero__hint" aria-hidden>
        <div className={`v1-hero__hint-in mono${hinted ? ' is-done' : ''}`}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4.4h-4.4" />
        </svg>
        <span>{mobile ? 'Swipe the loop to spin it' : 'Grab the loop & spin it'}</span>
        </div>
      </div>
      <div className="v1-hero__shade" aria-hidden />
    </section>
  )
}
