import { useLayoutEffect, useRef, useState } from 'react'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { ProjectCover } from '../../components/ProjectCover'
import { Arrow, Button } from '../../components/ui'
import { useExperience, TransitionLink } from '../../providers/Experience'
import { useAutoReveal } from '../../lib/useAutoReveal'
import { useNavTo } from '../../lib/useNavTo'
import { Flip, gsap, ScrollTrigger, SplitText, useGSAP } from '../../lib/gsap'
import { projects, type Project } from '../../lib/content'
import { NAV } from '../../lib/nav'
import './projects.css'

const groupOf = (p: Project) =>
  p.category.includes('3D') ? '3D' : p.category.includes('VFX') ? 'VFX' : p.category.includes('Motion') ? 'Motion' : 'Explainers'
const FILTERS = ['All', 'Explainers', '3D', 'VFX', 'Motion'].filter((f) => f === 'All' || projects.some((p) => groupOf(p) === f))

export default function ProjectsPage() {
  const { ready } = useExperience()
  const navTo = useNavTo()
  const main = useRef<HTMLElement>(null)
  const [filter, setFilter] = useState('All')
  const flip = useRef<Flip.FlipState | null>(null)
  useAutoReveal(main, ready)

  useGSAP(
    () => {
      if (!ready) return
      const title = SplitText.create('.projects-hero__title', { type: 'lines,words', mask: 'lines', linesClass: 'split-line' })
      gsap
        .timeline({ delay: 0.1 })
        .set('.projects-hero__title, .projects-hero__p, .pfilters', { visibility: 'visible' })
        .from(title.words, { yPercent: 120, duration: 1.4, stagger: 0.06 })
        .from('.projects-hero__p, .pfilters', { autoAlpha: 0, y: 24, duration: 1.1, stagger: 0.1 }, 0.5)

      gsap.utils.toArray<HTMLElement>('.pcard', main.current).forEach((card) => {
        const media = card.querySelector('.pcard__media')
        gsap.fromTo(
          media,
          { clipPath: 'inset(100% 0% 0% 0% round 26px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 26px)', duration: 1.5, ease: 'drift', scrollTrigger: { trigger: card, start: 'top 88%', once: true } },
        )
        gsap.fromTo(
          card.querySelector('.pcard__media .pcover'),
          { yPercent: -6, scale: 1.16 },
          { yPercent: 6, scale: 1.16, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } },
        )
      })
    },
    { scope: main, dependencies: [ready] },
  )

  // Animate the grid re-flow when the filter changes.
  useLayoutEffect(() => {
    if (!flip.current) return
    Flip.from(flip.current, {
      duration: 1,
      ease: 'silk',
      absolute: true,
      scale: true,
      stagger: 0.04,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.9, delay: 0.1 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.92, duration: 0.5 }),
      onComplete: () => ScrollTrigger.refresh(),
    })
    flip.current = null
  }, [filter])

  const choose = (f: string) => {
    if (f === filter) return
    flip.current = Flip.getState('.pgrid__item')
    setFilter(f)
  }

  let visible = 0

  return (
    <>
      <Header links={NAV} />
      <main className="projects" ref={main}>
        <section className="projects-hero" data-header-theme="auto">
          <h1 className="projects-hero__title">
            Stories we’ve <span className="serif">set in motion.</span>
          </h1>
          <p className="projects-hero__p">
            Every project starts as someone’s idea. Open any of them to see where it started, how it was made and where it
            ended.
          </p>
          <div className="pfilters" role="tablist" aria-label="Filter projects">
            {FILTERS.map((f) => {
              const count = f === 'All' ? projects.length : projects.filter((p) => groupOf(p) === f).length
              return (
                <button key={f} role="tab" aria-selected={filter === f} className={`pfilter${filter === f ? ' is-on' : ''}`} onClick={() => choose(f)}>
                  {f}
                  <sup>{count}</sup>
                </button>
              )
            })}
          </div>
        </section>

        <section className="pgrid" data-header-theme="auto">
          {projects.map((p, i) => {
            const show = filter === 'All' || groupOf(p) === filter
            const offset = show && visible++ % 2 === 1
            return (
              <article key={p.slug} className={`pgrid__item${show ? '' : ' is-hidden'}${offset ? ' is-offset' : ''}`} data-flip-id={p.slug}>
                <TransitionLink to={`/projects/${p.slug}`} label={p.title} className="pcard" data-cursor="Read story">
                  <div className="pcard__media">
                    <ProjectCover project={p} />
                    <span className="pcard__view">
                      View the story <Arrow rotate={-45} />
                    </span>
                  </div>
                  <div className="pcard__meta">
                    <span className="mono">
                      {String(i + 1).padStart(2, '0')} · {p.category}
                    </span>
                    <h2 className="pcard__title">{p.title}</h2>
                    <p>{p.summary}</p>
                  </div>
                </TransitionLink>
              </article>
            )
          })}
        </section>

        <section className="pcta" data-header-theme="auto">
          <h2 className="pcta__title" data-reveal="lines">
            Got a story that needs to <span className="serif">move?</span>
          </h2>
          <div data-reveal="fade">
            <Button label="Start your project" variant="blue" onClick={() => navTo('#contact')} />
          </div>
        </section>

        <Footer links={NAV} />
      </main>
    </>
  )
}
