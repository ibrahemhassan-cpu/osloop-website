import { useRef, type CSSProperties } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { pipeline } from '../../lib/content'

const STEP = 360 / pipeline.length

/** each stage's icon (24 × 24, stroked): script, storyboard, illustrations, voice over, animation, vfx & sfx, final result */
const icons = [
  '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  '<rect x="3" y="4" width="8" height="7" rx="1.5"/><rect x="13" y="4" width="8" height="7" rx="1.5"/><rect x="3" y="13" width="8" height="7" rx="1.5"/><rect x="13" y="13" width="8" height="7" rx="1.5"/><path d="M6.2 6.2v2.6l2.2-1.3z"/>',
  '<path d="M12 3a9 9 0 0 0 0 18c1 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.5-.7-.5-1.1 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="9.8" cy="6.8" r="1.2"/><circle cx="14.6" cy="6.8" r="1.2"/>',
  '<rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7"/>',
  '<circle cx="14.5" cy="12" r="6.5"/><path d="M13 9.5v5l4-2.5zM2 9h4M3 12h3M2 15h4"/>',
  '<path d="M9 3l1.6 4.4L15 9l-4.4 1.6L9 15l-1.6-4.4L3 9l4.4-1.6z"/><path d="M16 15v4M19 12.5v9M22 16v2"/>',
  '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M9 10l2 2 4-4"/>',
]

/**
 * A card's background art (600 × 780, the card's own shape): the blue grid the old illustrations had,
 * with the stage's icon in the top-right corner (beside the number, never over it), drawn in a white →
 * sky → orange line on a glass disc with a soft blue glow.
 */
const art = (icon: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 780">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16285f"/><stop offset="1" stop-color="#050b24"/></linearGradient>
        <radialGradient id="glow"><stop offset="0" stop-color="#2c5bff" stop-opacity=".6"/><stop offset="1" stop-color="#2c5bff" stop-opacity="0"/></radialGradient>
        <radialGradient id="disc" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="#2c5bff" stop-opacity=".45"/><stop offset="1" stop-color="#0a1438" stop-opacity=".35"/></radialGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#9db7ff" stroke-opacity=".07"/></pattern>
        <linearGradient id="ink" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#9db7ff"/><stop offset="1" stop-color="#ffb547"/></linearGradient>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".8"/></filter>
      </defs>
      <rect width="600" height="780" fill="url(#bg)"/>
      <rect width="600" height="780" fill="url(#grid)"/>
      <circle cx="438" cy="162" r="230" fill="url(#glow)"/>
      <circle cx="438" cy="162" r="108" fill="url(#disc)" stroke="#9db7ff" stroke-opacity=".3" stroke-width="2"/>
      <g transform="translate(372 96) scale(5.5)" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <g stroke="#2c5bff" stroke-width="2.4" opacity=".8" filter="url(#soft)">${icon}</g>
        <g stroke="url(#ink)" stroke-width="1.1">${icon}</g>
      </g>
    </svg>`,
  )}")`

export function Process() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const ring = root.current!.querySelector<HTMLElement>('.v1-ring')!
      const rays = root.current!.querySelector<HTMLElement>('.v1-process__rays')!
      const cards = gsap.utils.toArray<HTMLElement>('.v1-ring__card', root.current)
      const title = root.current!.querySelector('.v1-process__step-t')!
      let current = -1
      const state = { ry: 0 }

      const paint = () => {
        ring.style.transform = `rotateX(-8deg) rotateY(${state.ry}deg)`
        // the light lines turn in the floor's own plane, together with the cards (like a turntable)
        rays.style.transform = `rotate(${-state.ry}deg)`
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

      // the ring turns through the cards over 3.2 screens of scroll, then the last card holds for a little
      // more before the pin lets go, so the next section only comes up once it has been seen whole
      const TURN = 3.2
      const HOLD = 0.6
      const turnEnd = TURN / (TURN + HOLD) // where the turn ends, as a share of the pin
      const step = turnEnd / (pipeline.length - 1)
      gsap
        .timeline({
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${window.innerHeight * (TURN + HOLD)}`,
            pin: true,
            scrub: 1.2,
            // settle on a card while turning; the hold scrolls freely
            snap: {
              snapTo: (v: number) => (v >= turnEnd ? v : Math.round(v / step) * step),
              duration: { min: 0.3, max: 0.9 },
              ease: 'power2.inOut',
              delay: 0.1,
            },
          },
        })
        .to(state, { ry: -STEP * (pipeline.length - 1), ease: 'none', duration: TURN, onUpdate: paint })
        .to({}, { duration: HOLD })
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
        <div className="v1-process__floor" aria-hidden>
          <span className="v1-process__rays" />
        </div>
        <div className="v1-ring-wrap">
          <div className="v1-ring">
            {pipeline.map((s, i) => (
              <article
                className="v1-ring__card"
                key={s.title}
                style={{ '--a': `${i * STEP}deg`, '--bg': art(icons[i]) } as CSSProperties}
              >
                {/* the icon is part of the background art; this keeps the number where it always was */}
                <div className="v1-ring__top" aria-hidden />
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
        <div className="v1-process__mask v1-process__step-title">
          <span className="v1-process__step-t">{pipeline[0].title}</span>
        </div>
      </div>
    </section>
  )
}
