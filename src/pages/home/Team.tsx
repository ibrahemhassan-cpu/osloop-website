import { useRef, useState } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { team } from '../../lib/content'

const N = team.length
const STEP = 360 / N

/** Stand-in portrait until the designed team photos arrive (same treatment for every card). */
function Placeholder({ i }: { i: number }) {
  const hue = [222, 230, 214, 205, 238, 218, 226, 210][i % 8]
  return (
    <svg className="tcard__ph" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`tg${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 70% 46%)`} />
          <stop offset="1" stopColor="#050b24" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill={`url(#tg${i})`} />
      <circle cx="150" cy="150" r="62" fill="rgba(255,255,255,.18)" />
      <path d="M40 400c0-80 50-130 110-130s110 50 110 130z" fill="rgba(255,255,255,.14)" />
    </svg>
  )
}

/**
 * The crew — a wheel of portrait cards. While pinned, scrolling turns the wheel clockwise and
 * each member passes through the centre; scrolling up turns it back.
 */
export function Team() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('.tcard', root.current)
      const state = { p: 0 }
      let current = -1
      let radius = 0
      const measure = () => {
        const w = window.innerWidth
        radius = w < 760 ? Math.max(340, w * 1.1) : gsap.utils.clamp(560, 920, w * 0.52)
      }
      const paint = () => {
        cards.forEach((card, i) => {
          // angle from the top of the wheel; positive = clockwise (to the right)
          let th = (state.p - i) * STEP
          th = ((((th + 180) % 360) + 360) % 360) - 180
          const rad = (th * Math.PI) / 180
          const c = Math.cos(rad)
          const k = Math.max(0, c)
          const x = radius * Math.sin(rad)
          const y = radius * (1 - c)
          const scale = 0.72 + 0.4 * k ** 3
          card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(th * 0.6).toFixed(2)}deg) scale(${scale.toFixed(3)})`
          card.style.zIndex = String(Math.round(100 + c * 100))
          card.style.opacity = String(gsap.utils.clamp(0, 1, (c + 0.25) * 1.8))
        })
        const a = ((Math.round(state.p) % N) + N) % N
        if (a !== current) {
          current = a
          setActive(a)
        }
      }
      measure()
      paint()

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

      gsap.to(state, {
        p: N - 1,
        ease: 'none',
        onUpdate: paint,
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * 0.6 * (N - 1)}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onRefresh: () => {
            measure()
            paint()
          },
        },
      })
      return () => el.removeEventListener('pointermove', move)
    },
    { scope: root },
  )

  return (
    <section className="team" id="team" ref={root} data-header-theme="auto">
      <div className="team__head">
        <h2 className="team__h" data-reveal="lines">
          The people behind <span className="serif">the loop.</span>
        </h2>
        <p className="team__p" data-reveal="fade">
          Writers, artists, animators and sound designers — one crew, from the first word to the final frame.
        </p>
      </div>

      <div className="team__wheel">
        {team.map((m, i) => (
          <article key={m.role} className={`tcard${i === active ? ' is-active' : ''}`} aria-current={i === active}>
            <div className="tcard__inner">
              <div className="tcard__photo">
                {m.photo ? <img src={m.photo} alt={m.name ?? m.role} loading="lazy" draggable={false} /> : <Placeholder i={i} />}
              </div>
              <div className="tcard__info">
                {m.name && <h3 className="tcard__name">{m.name}</h3>}
                <p className="tcard__role">{m.role}</p>
              </div>
              <span className="tcard__shine" aria-hidden />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
