import { useRef, type CSSProperties } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { pipeline } from '../../lib/content'

const STEP = 360 / pipeline.length

export function Process() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const ring = root.current!.querySelector<HTMLElement>('.v1-ring')!
      const cards = gsap.utils.toArray<HTMLElement>('.v1-ring__card', root.current)
      const title = root.current!.querySelector('.v1-process__step-t')!
      let current = -1
      const state = { ry: 0 }

      const paint = () => {
        ring.style.transform = `rotateX(-8deg) rotateY(${state.ry}deg)`
        let best = 0
        let bestCos = -2
        cards.forEach((card, i) => {
          const a = ((i * STEP + state.ry) * Math.PI) / 180
          const c = Math.cos(a)
          card.style.opacity = String(gsap.utils.clamp(0, 1, 0.12 + (c + 0.2) * 0.85))
          card.style.setProperty('--glow', String(Math.max(0, c) ** 6))
          if (c > bestCos) {
            bestCos = c
            best = i
          }
        })
        if (best !== current) {
          current = best
          title.textContent = pipeline[best].title
          gsap.fromTo(title, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'silk' })
        }
      }
      paint()

      gsap.to(state, {
        ry: -STEP * (pipeline.length - 1),
        ease: 'none',
        onUpdate: paint,
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * 3.2}`,
          pin: true,
          scrub: 1.2,
          snap: { snapTo: 1 / (pipeline.length - 1), duration: { min: 0.3, max: 0.9 }, ease: 'power2.inOut', delay: 0.1 },
        },
      })

      gsap.to('.v1-process__floor', {
        rotate: 180,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${window.innerHeight * 3.2}`, scrub: true },
      })
    },
    { scope: root },
  )

  return (
    <section className="v1-process" id="process" ref={root} data-header-theme="dark" data-theme="dark">
      <div className="v1-process__head">
        <h2 className="v1-process__h" data-reveal="lines">
          From script <span className="serif">to screen.</span>
        </h2>
      </div>

      <div className="v1-process__scene">
        <div className="v1-process__floor" aria-hidden />
        <div className="v1-ring-wrap">
          <div className="v1-ring">
            {pipeline.map((s, i) => (
              <article
                className="v1-ring__card"
                key={s.title}
                style={{ '--a': `${i * STEP}deg`, '--bg': `url(${s.bg})` } as CSSProperties}
              >
                <div className="v1-ring__n">{s.n}</div>
                <div className="v1-ring__copy">
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="v1-process__hud">
        <div className="v1-process__mask v1-process__step-title">
          <span className="v1-process__step-t">{pipeline[0].title}</span>
        </div>
      </div>
    </section>
  )
}
