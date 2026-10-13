import { useRef, type CSSProperties } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { team } from '../../lib/content'

// Card colours — `ink` tones get dark text for contrast.
const TONES = [
  { c: '#2c5bff', ink: false },
  { c: '#0b1640', ink: false },
  { c: '#9db7ff', ink: true },
  { c: '#ffb547', ink: true },
  { c: '#1940b4', ink: false },
  { c: '#ff8a65', ink: true },
  { c: '#46c2ff', ink: true },
  { c: '#3a2a8c', ink: false },
]

const ICONS: Record<string, React.ReactNode> = {
  CD: <path d="M3 11l18-7-7 18-2-8-9-3z" />,
  SW: <path d="M6 3h9l4 4v14H6zM9 10h7M9 14h7M9 18h4" />,
  SB: <path d="M3 5h8v6H3zM13 5h8v6h-8zM3 13h8v6H3zM13 13h8v6h-8z" />,
  IL: <path d="M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3" />,
  '3D': <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5" />,
  AN: <path d="M4 12c3-6 5-6 8 0s5 6 8 0" />,
  FX: <path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z" />,
  SFX: <path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10" />,
}

const initials = (s: string) =>
  s
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()

/**
 * "The crew" — the cards start stacked like a deck and, as you scroll, are dealt one by one onto a
 * circle, close together; the circle then turns clockwise. It sizes itself to the crew, so more
 * people simply make a fuller circle. Hover lifts a card and reveals the craft behind it.
 * Real names/photos plug in from content.ts. On phones the cards sit in a swipeable row.
 */
export function Team() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const deck = root.current!.querySelector<HTMLElement>('.team__deck')!
      const cards = gsap.utils.toArray<HTMLElement>('.tcard', root.current)
      const n = cards.length
      const mm = gsap.matchMedia()

      mm.add('(min-width: 760px)', () => {
        const st = { deal: 0, turn: 0 }
        let radius = 0
        // the circle: neighbours overlap a little (a little more as the crew grows) and the whole
        // ring, cards included, fits the space under the heading
        const measure = () => {
          const close = gsap.utils.clamp(0.55, 0.85, 0.95 - n * 0.018)
          const ring = close / Math.sin(Math.PI / Math.max(n, 3)) // centre-to-centre diameter, in card widths
          const w = gsap.utils.clamp(96, 230, Math.min(deck.clientHeight / (ring + 1.4), deck.clientWidth / (ring + 1)))
          radius = (ring * w) / 2
          deck.style.setProperty('--w', `${w.toFixed(1)}px`)
        }
        const paint = () => {
          cards.forEach((card, i) => {
            // dealt in order round the circle, each a moment after the one before
            const p = gsap.utils.clamp(0, 1, st.deal * 1.6 - (i / n) * 0.6)
            const e = p * p * (3 - 2 * p)
            const a = (((i / n) * 360 + st.turn - 90) * Math.PI) / 180 // from the top, clockwise
            const x = radius * Math.cos(a) * e
            const y = i * -3 * (1 - e) + radius * Math.sin(a) * e
            const tilt = (i % 2 ? 1 : -1) * (2 + (i % 3) * 2) * (1 - e)
            const front = (Math.sin(a) + 1) / 2 // 0 at the top of the circle, 1 at the bottom
            const scale = (0.86 + 0.14 * e) * (1 - 0.06 * e * (1 - front))
            card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg) scale(${scale.toFixed(3)})`
            card.style.zIndex = String(e > 0.5 ? 20 + Math.round(front * 100) : n - i)
          })
        }
        measure()
        paint()

        gsap
          .timeline({
            scrollTrigger: {
              trigger: root.current,
              start: 'top top',
              end: '+=160%',
              pin: '.team__stage',
              scrub: 1.2,
              invalidateOnRefresh: true,
              onRefresh: () => {
                measure()
                paint()
              },
            },
          })
          .to(st, { deal: 1, duration: 0.55, ease: 'power2.inOut', onUpdate: paint }, 0)
          .to(st, { turn: 90, duration: 1, ease: 'none', onUpdate: paint }, 0)
          .from('.team__hint', { autoAlpha: 0, y: 20, duration: 0.15 }, 0.45)

        return () => {
          cards.forEach((c) => {
            c.style.transform = ''
            c.style.zIndex = ''
          })
          deck.style.removeProperty('--w')
        }
      })

      // Reflection follows the pointer on each card.
      const move = (e: PointerEvent) => {
        const card = (e.target as HTMLElement).closest<HTMLElement>('.tcard')
        if (!card) return
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
        card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
      }
      const el = root.current!
      el.addEventListener('pointermove', move)
      return () => el.removeEventListener('pointermove', move)
    },
    { scope: root },
  )

  return (
    <section className="team" id="team" ref={root} data-header-theme="auto">
      <div className="team__stage">
        <div className="team__head">
          <h2 className="team__h" data-reveal="lines">
            The people behind <span className="serif">the loop.</span>
          </h2>
          <p className="team__p" data-reveal="fade">
            Writers, artists, animators and sound designers — one crew, from the first word to the final frame.
          </p>
        </div>

        <div className="team__deck">
          {team.map((m, i) => {
            const tone = TONES[i % TONES.length]
            const mono = m.mono ?? initials(m.role)
            return (
              <article
                key={`${m.role}-${i}`}
                className={`tcard${m.photo ? ' tcard--photo' : ''}${tone.ink ? ' tcard--ink' : ''}`}
                style={{ '--tone': tone.c } as CSSProperties}
                tabIndex={0}
              >
                <div className="tcard__inner">
                  {m.photo ? (
                    <img className="tcard__photo" src={m.photo} alt={m.name ?? m.role} loading="lazy" draggable={false} />
                  ) : (
                    <span className="tcard__mono" aria-hidden>
                      {mono}
                    </span>
                  )}
                  <div className="tcard__top">
                    {ICONS[mono] && (
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        {ICONS[mono]}
                      </svg>
                    )}
                  </div>
                  <div className="tcard__bottom">
                    {m.name && <p className="tcard__name">{m.name}</p>}
                    <h3 className="tcard__role">{m.role}</h3>
                    {m.skills && m.skills.length > 0 && (
                      <ul className="tcard__skills">
                        {m.skills.map((s) => (
                          <li key={s} className="mono">
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <span className="tcard__shine" aria-hidden />
                </div>
              </article>
            )
          })}
        </div>

        <p className="team__hint mono">Hover a card to meet the craft</p>
      </div>
    </section>
  )
}
