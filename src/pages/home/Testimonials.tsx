import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../lib/gsap'
import { testimonials } from '../../lib/content'
import { Arrow } from '../../components/ui'

const DURATION = 9
const N = testimonials.length

export function Testimonials() {
  const root = useRef<HTMLElement>(null)
  const [idx, setIdx] = useState(0)
  const idxRef = useRef(0)
  const leaving = useRef<gsap.core.Tween | null>(null)
  const timer = useRef<gsap.core.Tween | null>(null)
  const inView = useRef(false)
  const hovering = useRef(false)

  /** Go to a review. Rapid clicks never get stuck: an in-flight exit is cut short. */
  const show = (next: number) => {
    next = ((next % N) + N) % N
    if (next === idxRef.current && !leaving.current) return
    idxRef.current = next
    leaving.current?.kill()
    leaving.current = gsap.to(root.current!.querySelectorAll('.v1-testi__quote, .v1-testi__project'), {
      autoAlpha: 0,
      y: -14,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        leaving.current = null
        setIdx(next)
      },
    })
  }
  const showRef = useRef(show)
  showRef.current = show

  // Bring the new review in, restart the progress bar.
  useGSAP(
    () => {
      const q = root.current!.querySelector('.v1-testi__quote')!
      const split = SplitText.create(q, { type: 'lines', mask: 'lines', linesClass: 'split-line' })
      gsap.set('.v1-testi__quote, .v1-testi__project', { autoAlpha: 1, y: 0, visibility: 'visible' })
      gsap.from(split.lines, { yPercent: 110, duration: 1, stagger: 0.06, ease: 'silk' })
      gsap.from('.v1-testi__project', { autoAlpha: 0, y: 10, duration: 0.8, delay: 0.2 })
      timer.current?.kill()
      timer.current = gsap.fromTo(
        '.v1-testi__timer-fill',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: DURATION,
          ease: 'none',
          paused: !inView.current || hovering.current,
          onComplete: () => showRef.current(idxRef.current + 1),
        },
      )
      return () => split.revert()
    },
    { scope: root, dependencies: [idx] },
  )

  // Autoplay only while the section is on screen.
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top 60%',
      end: 'bottom 40%',
      onToggle: (self) => {
        inView.current = self.isActive
        if (self.isActive && !hovering.current) timer.current?.play()
        else timer.current?.pause()
      },
    })
    return () => st.kill()
  }, [])

  // Horizontal swipe (touch + pen + mouse drag) on the quote area.
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipe.current
    swipe.current = null
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) show(idxRef.current + (dx < 0 ? 1 : -1))
  }

  const t = testimonials[idx]

  return (
    <section className="v1-testi" id="testimonials" ref={root} data-header-theme="dark" data-theme="dark">
      <div className="v1-testi__head">
        <h2 className="v1-testi__h" data-reveal="lines">
          Echoes of <span className="serif">satisfaction.</span>
        </h2>
        <div className="v1-testi__rating" data-reveal="fade">
          <span className="v1-testi__stars" aria-label="5 out of 5 stars">
            ★★★★★
          </span>
          <span className="mono">Client reviews</span>
        </div>
      </div>

      <div
        className="v1-testi__body"
        onMouseEnter={() => {
          hovering.current = true
          timer.current?.pause()
        }}
        onMouseLeave={() => {
          hovering.current = false
          if (inView.current) timer.current?.play()
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
      >
        <div className="v1-testi__mark serif" aria-hidden>
          “
        </div>
        <blockquote className="v1-testi__quote" key={idx} aria-live="polite">
          {t.quote}
        </blockquote>
        <div className="v1-testi__meta">
          <div className="v1-testi__project">
            <span className="mono">Project</span>
            <strong>{t.project}</strong>
          </div>
          <div className="v1-testi__controls">
            <span className="v1-testi__count mono">
              {String(idx + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
            </span>
            <div className="v1-testi__timer" aria-hidden>
              <div className="v1-testi__timer-fill" />
            </div>
            <button type="button" className="v1-testi__btn" onClick={() => show(idxRef.current - 1)} aria-label="Previous review">
              <Arrow rotate={180} />
            </button>
            <button type="button" className="v1-testi__btn" onClick={() => show(idxRef.current + 1)} aria-label="Next review">
              <Arrow />
            </button>
          </div>
        </div>
      </div>

      <ol className="v1-testi__list">
        {testimonials.map((x, i) => (
          <li key={x.project}>
            <button type="button" className={i === idx ? 'is-on' : ''} onClick={() => show(i)} aria-current={i === idx}>
              <span className="mono">{String(i + 1).padStart(2, '0')}</span>
              {x.project}
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
