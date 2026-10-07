import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../lib/gsap'
import { testimonials } from '../../lib/content'
import { Arrow, Magnetic } from '../../components/ui'

const DURATION = 9

export function Testimonials() {
  const root = useRef<HTMLElement>(null)
  const [idx, setIdx] = useState(0)
  const busy = useRef(false)
  const progress = useRef<gsap.core.Tween | null>(null)
  const inView = useRef(false)

  const change = (dir: 1 | -1 | number, absolute = false) => {
    if (busy.current) return
    const next = absolute ? dir : (idx + dir + testimonials.length) % testimonials.length
    if (next === idx) return
    busy.current = true
    const lines = root.current!.querySelectorAll('.v1-testi__quote .split-line')
    gsap
      .timeline({ onComplete: () => setIdx(next) })
      .to(lines, { yPercent: -110, duration: 0.6, stagger: 0.03, ease: 'power3.in' })
      .to('.v1-testi__project', { autoAlpha: 0, y: -10, duration: 0.4 }, 0)
  }
  const changeRef = useRef(change)
  changeRef.current = change

  // Animate the new quote in.
  useGSAP(
    () => {
      const q = root.current!.querySelector('.v1-testi__quote')!
      const split = SplitText.create(q, { type: 'lines', mask: 'lines', linesClass: 'split-line' })
      gsap.set(q, { visibility: 'visible' })
      gsap
        .timeline({ onComplete: () => (busy.current = false) })
        .from(split.lines, { yPercent: 110, duration: 1.1, stagger: 0.07, ease: 'silk' })
        .fromTo('.v1-testi__project', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.3)
      progress.current?.kill()
      progress.current = gsap.fromTo(
        '.v1-testi__timer-fill',
        { scaleX: 0 },
        { scaleX: 1, duration: DURATION, ease: 'none', paused: !inView.current, onComplete: () => changeRef.current(1) },
      )
      return () => split.revert()
    },
    { scope: root, dependencies: [idx] },
  )

  // Autoplay only while in view.
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top 60%',
      end: 'bottom 40%',
      onToggle: (self) => {
        inView.current = self.isActive
        if (self.isActive) progress.current?.play()
        else progress.current?.pause()
      },
    })
    return () => st.kill()
  }, [])

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
        onMouseEnter={() => progress.current?.pause()}
        onMouseLeave={() => inView.current && progress.current?.play()}
      >
        <div className="v1-testi__mark serif" aria-hidden>
          “
        </div>
        <blockquote className="v1-testi__quote" key={idx}>
          {t.quote}
        </blockquote>
        <div className="v1-testi__meta">
          <div className="v1-testi__project">
            <span className="mono">Project</span>
            <strong>{t.project}</strong>
          </div>
          <div className="v1-testi__controls">
            <span className="v1-testi__count mono">
              {String(idx + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
            </span>
            <div className="v1-testi__timer">
              <div className="v1-testi__timer-fill" />
            </div>
            <Magnetic>
              <button className="v1-testi__btn" onClick={() => change(-1)} aria-label="Previous testimonial">
                <Arrow rotate={180} />
              </button>
            </Magnetic>
            <Magnetic>
              <button className="v1-testi__btn" onClick={() => change(1)} aria-label="Next testimonial">
                <Arrow />
              </button>
            </Magnetic>
          </div>
        </div>
      </div>

      <ol className="v1-testi__list">
        {testimonials.map((x, i) => (
          <li key={x.project}>
            <button className={i === idx ? 'is-on' : ''} onClick={() => change(i, true)}>
              <span className="mono">{String(i + 1).padStart(2, '0')}</span>
              {x.project}
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
