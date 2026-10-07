import { useRef, type CSSProperties } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { pipeline } from '../../lib/content'

const STEP = 360 / pipeline.length

const icons = [
  // script, storyboard, illustration, voice, animation, vfx, sfx
  <path key="0" d="M6 3h9l4 4v14H6zM9 10h7M9 14h7M9 18h4" />,
  <path key="1" d="M3 5h8v6H3zM13 5h8v6h-8zM3 13h8v6H3zM13 13h8v6h-8z" />,
  <path key="2" d="M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3" />,
  <path key="3" d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" />,
  <path key="4" d="M4 12c3-6 5-6 8 0s5 6 8 0" />,
  <path key="5" d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z" />,
  <path key="6" d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h0" />,
]

export function Process() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const ring = root.current!.querySelector<HTMLElement>('.v1-ring')!
      const cards = gsap.utils.toArray<HTMLElement>('.v1-ring__card', root.current)
      const counter = root.current!.querySelector('.v1-process__step-n')!
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
          counter.textContent = pipeline[best].n
          title.textContent = pipeline[best].title
          gsap.fromTo([counter, title], { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'silk' })
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
            <article className="v1-ring__card" key={s.n} style={{ '--a': `${i * STEP}deg` } as CSSProperties}>
              <div className="v1-ring__top">
                <span className="mono">Step {s.n}</span>
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {icons[i]}
                </svg>
              </div>
              <div className="v1-ring__n">{s.n}</div>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </article>
          ))}
        </div>
        </div>
      </div>

      <div className="v1-process__hud">
        <div className="v1-process__step mono">
          <span className="v1-process__mask">
            <span className="v1-process__step-n">01</span>
          </span>
          <span>/ 0{pipeline.length}</span>
        </div>
        <div className="v1-process__mask v1-process__step-title">
          <span className="v1-process__step-t">{pipeline[0].title}</span>
        </div>
      </div>
    </section>
  )
}
