import { useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { ProjectCover } from '../../components/ProjectCover'
import { Arrow, Button } from '../../components/ui'
import { useExperience, TransitionLink } from '../../providers/Experience'
import { useAutoReveal } from '../../lib/useAutoReveal'
import { useNavTo } from '../../lib/useNavTo'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../lib/gsap'
import { projects, type Project } from '../../lib/content'
import { NAV } from '../../lib/nav'
import './projects.css'

/** Route wrapper — remounts the page per project so every animation starts fresh. */
export default function ProjectRoute() {
  const { slug } = useParams()
  const project = projects.find((p) => p.slug === slug)
  if (!project) return <Navigate to="/projects" replace />
  return <ProjectPage key={project.slug} project={project} />
}

function ProjectPage({ project: p }: { project: Project }) {
  const { ready } = useExperience()
  const navTo = useNavTo()
  const main = useRef<HTMLElement>(null)
  const [stage, setStage] = useState(0)
  const index = projects.indexOf(p)
  const next = projects[(index + 1) % projects.length]
  useAutoReveal(main, ready)

  useGSAP(
    () => {
      if (!ready) return
      const title = SplitText.create('.case__title', { type: 'lines,words', mask: 'lines', linesClass: 'split-line' })
      gsap
        .timeline({ delay: 0.1 })
        .set('.case__title, .case__intro > *, .case__meta', { visibility: 'visible' })
        .from(title.words, { yPercent: 120, duration: 1.4, stagger: 0.05 })
        .from('.case__intro > *', { autoAlpha: 0, y: 24, duration: 1.1, stagger: 0.08 }, 0.4)
        .from('.case__meta > *', { autoAlpha: 0, y: 24, duration: 1.1, stagger: 0.06 }, 0.6)

      // Cover opens up as it scrolls in.
      gsap.fromTo(
        '.case__cover',
        { clipPath: 'inset(8% 8% 8% 8% round 32px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '.case__cover', start: 'top 85%', end: 'top 10%', scrub: true } },
      )
      gsap.fromTo(
        '.case__cover .pcover',
        { scale: 1.25 },
        { scale: 1, ease: 'none', scrollTrigger: { trigger: '.case__cover', start: 'top bottom', end: 'bottom top', scrub: true } },
      )

      // "Where it started" — words light up as you read.
      const start = main.current!.querySelector('.case__lead')!
      gsap.set(start, { visibility: 'visible' })
      SplitText.create(start, {
        type: 'words',
        autoSplit: true,
        onSplit(self) {
          return gsap.fromTo(
            self.words,
            { opacity: 0.15 },
            { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: start, start: 'top 80%', end: 'bottom 55%', scrub: 1 } },
          )
        },
      })

      // Journey timeline: the line draws itself, each stage lights up in turn.
      gsap.fromTo(
        '.journey__fill',
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.journey__list', start: 'top 60%', end: 'bottom 60%', scrub: true } },
      )
      gsap.utils.toArray<HTMLElement>('.jstep', main.current).forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 62%',
          end: 'bottom 62%',
          toggleClass: 'is-on',
          onToggle: (self) => self.isActive && setStage(i),
        })
      })
    },
    { scope: main, dependencies: [ready] },
  )

  return (
    <>
      <Header links={NAV} />
      <main className="case" ref={main}>
        <section className="case__hero" data-header-theme="auto">
          <TransitionLink to="/projects" className="case__back mono">
            <Arrow rotate={180} size={12} /> All projects
          </TransitionLink>
          <h1 className="case__title">{p.title}</h1>
          <div className="case__intro">
            <p>{p.summary}</p>
          </div>
          <dl className="case__meta">
            <div>
              <dt className="mono">Client</dt>
              <dd>{p.client}</dd>
            </div>
            <div>
              <dt className="mono">Category</dt>
              <dd>{p.category}</dd>
            </div>
            <div>
              <dt className="mono">Deliverable</dt>
              <dd>{p.deliverable}</dd>
            </div>
            <div>
              <dt className="mono">Services</dt>
              <dd>{p.services.join(' · ')}</dd>
            </div>
          </dl>
        </section>

        <div className="case__cover" data-header-theme="dark">
          <ProjectCover project={p} eager />
        </div>
        <section className="case__chapter" data-header-theme="auto">
          <div className="case__chapter-head">
            <h2 data-reveal="lines">
              Where it <span className="serif">started.</span>
            </h2>
          </div>
          <p className="case__lead">{p.start}</p>
        </section>
        <section className="case__chapter case__chapter--journey" data-header-theme="auto">
          <div className="case__chapter-head">
            <h2 data-reveal="lines">
              How it was <span className="serif">made.</span>
            </h2>
          </div>
          <div className="journey">
            <aside className="journey__aside">
              <div className="journey__sticky">
                <div className="journey__media">
                  <ProjectCover project={p} />
                </div>
                <div className="journey__now">
                  <span className="journey__count">
                    <span key={stage}>{String(stage + 1).padStart(2, '0')}</span>
                  </span>
                  <span className="mono">/ {String(p.journey.length).padStart(2, '0')}</span>
                </div>
                <p className="journey__stage" key={`t${stage}`}>
                  {p.journey[stage].stage}
                </p>
              </div>
            </aside>
            <ol className="journey__list">
              <span className="journey__line" aria-hidden>
                <span className="journey__fill" />
              </span>
              {p.journey.map((s, i) => (
                <li key={s.stage} className="jstep">
                  <span className="jstep__dot" aria-hidden />
                  <span className="jstep__n mono">Step {String(i + 1).padStart(2, '0')}</span>
                  <h3>{s.stage}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="case__chapter case__chapter--end" data-header-theme="auto">
          <div className="case__chapter-head">
            <h2 data-reveal="lines">
              Where it <span className="serif">ended.</span>
            </h2>
          </div>
          <div className="case__end">
            <p className="case__end-text" data-reveal="fade">
              {p.end}
            </p>
            <figure className="case__quote" data-reveal="scale">
              <div className="case__stars" aria-label="Five stars">
                ★★★★★
              </div>
              <blockquote>“{p.quote.text}”</blockquote>
              <figcaption className="mono">
                {p.client} — {p.quote.source}
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="case__next" data-header-theme="dark" data-theme="dark">
          <TransitionLink to={`/projects/${next.slug}`} label={next.title} className="nextp" data-cursor="Next story">
            <span className="nextp__bg" aria-hidden>
              <ProjectCover project={next} />
            </span>
            <span className="nextp__k mono">Next project</span>
            <span className="nextp__title">{next.title}</span>
            <span className="nextp__go">
              <Arrow size={26} rotate={-45} />
            </span>
          </TransitionLink>
          <div className="case__cta">
            <p>Have a story like this one?</p>
            <Button label="Start your project" variant="blue" onClick={() => navTo('#contact')} />
          </div>
        </section>

        <Footer links={NAV} />
      </main>
    </>
  )
}
