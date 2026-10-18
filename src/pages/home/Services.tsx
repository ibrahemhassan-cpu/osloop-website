import { useRef } from 'react'
import { gsap, useGSAP, type ScrollTrigger } from '../../lib/gsap'
import { useSmoothScroll } from '../../providers/SmoothScroll'
import { services } from '../../lib/content'
import { ImageLoop } from '../../components/ImageLoop'

export function Services() {
  const root = useRef<HTMLElement>(null)
  const pin = useRef<ScrollTrigger | null>(null)
  const { scrollTo } = useSmoothScroll()

  /** straight down to the next section — the cards don't slide past on the way */
  const skip = () => {
    const track = root.current!.querySelector('.v1-services__track')
    gsap.to(track, {
      autoAlpha: 0,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        scrollTo('#work', { immediate: true })
        pin.current?.getTween()?.progress(1)
        gsap.set(track, { autoAlpha: 1, delay: 0.1 })
      },
    })
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 981px)', () => {
        const track = root.current!.querySelector<HTMLElement>('.v1-services__track')!
        const distance = () => track.scrollWidth - window.innerWidth
        const move = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              gsap.set('.v1-services__bar-fill', { scaleX: self.progress })
            },
          },
        })
        pin.current = move.scrollTrigger ?? null
        gsap.utils.toArray<HTMLElement>('.v1-svc', root.current).forEach((panel) => {
          const media = panel.querySelector('.v1-svc__loop .iloop__track')
          const title = panel.querySelector('.v1-svc__title')
          gsap.fromTo(media, { xPercent: -12, scale: 1.18 }, {
            xPercent: 12,
            scale: 1.05,
            ease: 'none',
            scrollTrigger: { trigger: panel, containerAnimation: move, start: 'left right', end: 'right left', scrub: true },
          })
          gsap.from(title, {
            xPercent: 25,
            ease: 'none',
            scrollTrigger: { trigger: panel, containerAnimation: move, start: 'left right', end: 'left 30%', scrub: true },
          })
          gsap.from(panel.querySelectorAll('.v1-svc__tags li'), {
            y: 30,
            autoAlpha: 0,
            stagger: 0.06,
            duration: 1,
            scrollTrigger: { trigger: panel, containerAnimation: move, start: 'left 60%' },
          })
        })
      })
    },
    { scope: root },
  )

  return (
    <section className="v1-services" id="services" ref={root} data-header-theme="auto">
      <div className="v1-services__track">
        <div className="v1-services__intro">
          <h2 className="v1-services__h" data-reveal="lines">
            Ten services. <br />
            <span className="serif">One obsession:</span> <br />
            your story.
          </h2>
          <p className="v1-services__p" data-reveal="fade" data-delay="0.2">
            From a two-minute explainer to a full product universe in 3D, every frame is built around the one thing
            that matters: the message you need people to remember.
          </p>
          <div className="v1-services__hint mono" data-reveal="fade" data-delay="0.3">
            <span>Keep scrolling</span>
            <span className="v1-services__hint-arrow">→</span>
          </div>
        </div>

        {services.map((s, i) => (
          <article className="v1-svc" key={s.id}>
            <div className="v1-svc__text">
              <h3 className="v1-svc__title">{s.title}</h3>
              <p className="v1-svc__lead serif">{s.lead}</p>
              <p className="v1-svc__body">{s.body}</p>
              <ul className="v1-svc__tags">
                {s.tags.map((t) => (
                  <li key={t} className="mono">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="v1-svc__media">
              <ImageLoop className="v1-svc__loop" images={s.images} alt={`${s.title}, OsLoop work`} offset={(i % 3) * 700} dots />
            </div>
          </article>
        ))}
      </div>
      <div className="v1-services__bar" aria-hidden>
        <div className="v1-services__bar-fill" />
      </div>
      <button type="button" className="v1-services__skip" onClick={skip} aria-label="Skip to the next section">
        <span className="mono">Next section</span>
        <span className="v1-services__skip-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        </span>
      </button>
    </section>
  )
}
