import { useEffect, useRef, useState } from 'react'
import { gsap, isTouch } from '../../lib/gsap'
import { useI18n } from '../../lib/i18n'
import { rich } from '../../lib/rich'
import { TransitionLink } from '../../providers/Experience'
import { ProjectCover } from '../../components/ProjectCover'
import { Arrow } from '../../components/ui'

/** Selected work — a big index of projects with a floating preview that trails the cursor. */
export function Work() {
  const { t, c } = useI18n()
  const projects = c.projects
  const root = useRef<HTMLElement>(null)
  const preview = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    if (isTouch() || !preview.current) return
    const el = preview.current
    const xTo = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' })
    const rTo = gsap.quickTo(el, 'rotation', { duration: 1.2, ease: 'power3' })
    let lastX = 0
    const move = (e: PointerEvent) => {
      xTo(e.clientX)
      yTo(e.clientY)
      rTo(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6))
      lastX = e.clientX
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  return (
    <section className="work" id="work" ref={root} data-header-theme="auto">
      <div className="work__head">
        <h2 className="work__h" data-reveal="lines">
          {rich(t.work.title)}
        </h2>
        <p className="work__p" data-reveal="fade">
          {t.work.text}
        </p>
      </div>

      <ul className={`work__list${hover !== null ? ' is-hovering' : ''}`} onMouseLeave={() => setHover(null)}>
        {projects.map((p, i) => (
          <li key={p.slug} data-reveal="fade" data-delay={String(i * 0.06)}>
            <TransitionLink
              to={`/projects/${p.slug}`}
              label={p.name}
              className={`work__row${hover === i ? ' is-hover' : ''}`}
              data-cursor={t.work.view}
              onMouseEnter={() => setHover(i)}
            >
              <span className="work__idx mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="work__thumb">
                <ProjectCover project={p} sizes="84px" />
              </span>
              {/* the official title, split so every row keeps the one-line rhythm of the list */}
              <span className="work__title">
                {p.name}
                <span className="work__sub">{p.title.split(': ')[1]}</span>
              </span>
              <span className="work__cat mono">{p.category}</span>
              <span className="work__go">
                <Arrow size={18} rotate={-45} />
              </span>
              <span className="work__line" aria-hidden />
            </TransitionLink>
          </li>
        ))}
      </ul>

      <div className="work__more" data-reveal="fade">
        <p>
          <strong>{projects.length}</strong> {t.work.count}
        </p>
      </div>

      <div className={`work__preview${hover !== null ? ' is-on' : ''}`} ref={preview} aria-hidden>
        <div className="work__preview-inner">
          <div className="work__reel" style={{ transform: `translateY(${-(hover ?? 0) * 100}%)` }}>
            {projects.map((p) => (
              <div className="work__frame" key={p.slug}>
                <ProjectCover project={p} sizes="400px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
