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

/**
 * "The crew" — cards start stacked like a deck and fan into an arc as you scroll.
 * Hover lifts a card and reveals the craft behind it. Real names/photos plug in from content.ts.
 */
export function Team() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('.tcard', root.current)
      const n = cards.length
      const mid = (n - 1) / 2
      const mm = gsap.matchMedia()

      mm.add('(min-width: 900px)', () => {
        const spread = () => Math.min(window.innerWidth * 0.105, 170)
        gsap.set(cards, {
          x: 0,
          y: (i) => 60 + i * -3,
          rotation: (i) => (i % 2 ? 1 : -1) * (2 + (i % 3) * 2),
          scale: 0.86,
        })
        gsap
          .timeline({
            scrollTrigger: {
              trigger: root.current,
              start: 'top top',
              end: '+=120%',
              pin: '.team__stage',
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
          })
          .to(cards, {
            x: (i) => (i - mid) * spread(),
            y: (i) => Math.pow(Math.abs(i - mid), 2) * 9,
            rotation: (i) => (i - mid) * 5.5,
            scale: 1,
            ease: 'power2.inOut',
            stagger: { each: 0.02, from: 'center' },
          })
          .from('.team__hint', { autoAlpha: 0, y: 20, duration: 0.3 }, '-=0.2')
      })

      // Reflection follows the pointer on each card.
      const move = (e: PointerEvent) => {
        const card = (e.target as HTMLElement).closest<HTMLElement>('.tcard')
        if (!card) return
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
        card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
      }
      root.current!.addEventListener('pointermove', move)
      return () => root.current?.removeEventListener('pointermove', move)
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
          {team.map((m, i) => (
            <article
              key={m.role}
              className={`tcard${m.photo ? ' tcard--photo' : ''}${TONES[i % TONES.length].ink ? ' tcard--ink' : ''}`}
              style={{ '--tone': TONES[i % TONES.length].c, zIndex: i < team.length / 2 ? i + 1 : team.length - i } as CSSProperties}
              tabIndex={0}
            >
              <div className="tcard__inner">
                {m.photo ? (
                  <img className="tcard__photo" src={m.photo} alt={m.name ?? m.role} loading="lazy" />
                ) : (
                  <span className="tcard__mono" aria-hidden>
                    {m.mono}
                  </span>
                )}
                <div className="tcard__top">
                  <span className="mono">
                    {String(i + 1).padStart(2, '0')} / {String(team.length).padStart(2, '0')}
                  </span>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    {ICONS[m.mono]}
                  </svg>
                </div>
                <div className="tcard__bottom">
                  {m.name && <p className="tcard__name">{m.name}</p>}
                  <h3 className="tcard__role">{m.role}</h3>
                  <ul className="tcard__skills">
                    {m.skills.map((s) => (
                      <li key={s} className="mono">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="tcard__shine" aria-hidden />
              </div>
            </article>
          ))}
        </div>

        <p className="team__hint mono">Hover a card to meet the craft</p>
      </div>
    </section>
  )
}
