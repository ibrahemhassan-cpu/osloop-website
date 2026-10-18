import { useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { ProjectCover } from '../../components/ProjectCover'
import { VideoEmbed } from '../../components/VideoEmbed'
import { Arrow, Button } from '../../components/ui'
import { useExperience, TransitionLink } from '../../providers/Experience'
import { useAutoReveal } from '../../lib/useAutoReveal'
import { useNavTo } from '../../lib/useNavTo'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../lib/gsap'
import { projects, type Project } from '../../lib/content'
import { Testimonials } from '../home/Testimonials'
import { NAV } from '../../lib/nav'
import './projects.css'

/** Route wrapper — remounts the page per project so every animation starts fresh. */
export default function ProjectRoute() {
  const { slug } = useParams()
  const project = projects.find((p) => p.slug === slug)
  if (!project) return <Navigate to="/" replace />
  return <ProjectPage key={project.slug} project={project} />
}

function ProjectPage({ project: p }: { project: Project }) {
  const { ready } = useExperience()
  const navTo = useNavTo()
  const main = useRef<HTMLElement>(null)
  const [stage, setStage] = useState(0)
  const index = projects.indexOf(p)
  const next = projects[(index + 1) % projects.length]
  // a gallery with one image per stage follows the story; otherwise the cover leads the stills
  const stills = p.gallery.length >= p.journey.length ? p.gallery : [p.cover, ...p.gallery].filter((x): x is string => !!x)
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

      // Journey timeline: the line draws itself, and every stage it reaches lights up and stays lit.
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
          onEnter: () => {
            el.classList.add('is-on')
            setStage(i)
          },
          onEnterBack: () => setStage(i),
          // scrolling back above a stage is the only thing that turns it off again
          onLeaveBack: () => {
            el.classList.remove('is-on')
            setStage(Math.max(0, i - 1))
          },
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
          <TransitionLink to="/#work" className="case__back mono">
            <Arrow rotate={180} size={12} /> Back to work
          </TransitionLink>
          <h1 className="case__title">{p.title}</h1>
          <div className="case__intro">
            <p>{p.summary}</p>
          </div>
          <dl className="case__meta">
            <div>
              <dt className="mono">Year</dt>
              <dd>{p.year}</dd>
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
                  {stills.length ? (
                    stills.map((src, i) => (
                      <img key={src} src={src} alt="" loading="lazy" className={i === stage % stills.length ? 'is-on' : ''} />
                    ))
                  ) : (
                    <ProjectCover project={p} />
                  )}
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
              {p.journey.map((s) => (
                <li key={s.stage} className="jstep">
                  <span className="jstep__dot" aria-hidden />
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
            <div className="case__end-copy" data-reveal="fade">
              <p className="case__end-text">{p.end}</p>
              {p.link.kind === 'youtube' ? (
                <a className="case__ext mono" href={`https://www.youtube.com/watch?v=${p.link.id}`} target="_blank" rel="noreferrer">
                  Open on YouTube <Arrow size={12} rotate={-45} />
                </a>
              ) : (
                <a className="case__ext mono" href={p.link.url} target="_blank" rel="noreferrer">
                  {p.link.label} <Arrow size={12} rotate={-45} />
                </a>
              )}
            </div>
            <div className="case__media" data-reveal="scale">
              {p.link.kind === 'youtube' ? (
                <VideoEmbed id={p.link.id} title={p.title} />
              ) : (
                <a className="case__link" href={p.link.url} target="_blank" rel="noreferrer">
                  <span className="case__link-media">
                    <ProjectCover project={p} />
                  </span>
                  <span className="case__link-label">
                    {p.link.label}
                    <Arrow size={20} rotate={-45} />
                  </span>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* what the client said: the same reviews section as the home page */}
        {p.reviews.length > 0 && (
          <Testimonials
            id="client-review"
            list={false}
            items={p.reviews.map((r) => ({ quote: r.quote, project: p.name }))}
            title={
              <>
                What the client <span className="serif">said.</span>
              </>
            }
          />
        )}

        <section className="case__next" data-header-theme="dark" data-theme="dark">
          <TransitionLink to={`/projects/${next.slug}`} label={next.name} className="nextp" data-cursor="Next story">
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
