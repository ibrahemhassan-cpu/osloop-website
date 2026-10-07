import { useRef, type CSSProperties } from 'react'
import { gsap, SplitText, useGSAP } from '../../lib/gsap'
import { brand, pipeline, services, testimonials, values } from '../../lib/content'
import { useExperience } from '../../providers/Experience'
import { useSmoothScroll } from '../../providers/SmoothScroll'
import { ValueVisual } from '../../components/ValueVisual'
import { Arrow } from '../../components/ui'
import { RichTitle } from '../v2/ChapterView'

function Head({ label, title, body, align = 'left' }: { label: string; title: string; body?: string; align?: 'left' | 'split' }) {
  return (
    <div className={`v3-head v3-head--${align}`}>
      <p className="v3-label mono" data-reveal="fade">
        {label}
      </p>
      <h2 className="v3-h2" data-reveal="lines">
        <RichTitle text={title} />
      </h2>
      {body && (
        <p className="v3-head__body" data-reveal="fade" data-delay="0.15">
          {body}
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ About */
const PILLARS = [
  {
    t: 'Write',
    k: 'Script & storyboard',
    d: 'We learn your product and your audience, then shape the message into a script and a frame-by-frame plan.',
    icon: <path d="M6 3h9l4 4v14H6zM9 10h7M9 14h7M9 18h4" />,
  },
  {
    t: 'Design',
    k: 'Illustration & 3D',
    d: 'Characters, worlds and products designed in your brand’s visual language — flat 2D, hand-drawn or photoreal 3D.',
    icon: <path d="M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3" />,
  },
  {
    t: 'Move',
    k: 'Animation, VFX & sound',
    d: 'Animation, effects, voice-over and sound design bring it to life — so the message lands and stays.',
    icon: <path d="M4 12c3-6 5-6 8 0s5 6 8 0" />,
  },
]

export function About() {
  const root = useRef<HTMLElement>(null)
  const { ready } = useExperience()

  useGSAP(
    () => {
      if (!ready) return
      const st = root.current!.querySelector('.v3-about__statement')!
      gsap.set(st, { visibility: 'visible' })
      SplitText.create(st, {
        type: 'words',
        autoSplit: true,
        onSplit(self) {
          return gsap.fromTo(
            self.words,
            { opacity: 0.14 },
            { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: st, start: 'top 80%', end: 'bottom 50%', scrub: 1 } },
          )
        },
      })
    },
    { scope: root, dependencies: [ready] },
  )

  return (
    <section className="v3-about" id="about" ref={root} data-header-theme="auto">
      <p className="v3-label mono" data-reveal="fade">
        (01) — Who we are
      </p>
      <p className="v3-about__statement">
        Every brand has a story worth telling. Most are hard to explain.{' '}
        <span className="serif">That’s where we come in</span> — OsLoop is an animation studio that scripts it, draws it,
        voices it and sets it in motion.
      </p>
      <div className="v3-pillars">
        {PILLARS.map((p, i) => (
          <article className="v3-pillar" key={p.t} data-reveal="fade" data-delay={String(i * 0.12)}>
            <div className="v3-pillar__top">
              <span className="v3-pillar__icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {p.icon}
                </svg>
              </span>
              <span className="mono">0{i + 1}</span>
            </div>
            <h3>
              We {p.t.toLowerCase()} it<span className="v3-pillar__dot">.</span>
            </h3>
            <p className="v3-pillar__k mono">{p.k}</p>
            <p>{p.d}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- Services */
const PERFECT_FOR: Record<string, string[]> = {
  explainer: ['Product launches & demos', 'Landing pages & ads', 'Investor & sales pitches'],
  '3d': ['Product showcases', 'VFX for film & ads', 'Social & launch campaigns'],
  web: ['Brand & product sites', 'Launch campaigns', 'Interactive storytelling'],
}

export function Services() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>('.v3-svc', root.current).forEach((card, i) => {
        gsap.from(card, {
          y: 120,
          rotateX: -12,
          autoAlpha: 0,
          duration: 1.5,
          delay: i * 0.12,
          transformOrigin: '50% 0%',
          scrollTrigger: { trigger: root.current!.querySelector('.v3-services__grid'), start: 'top 82%', once: true },
        })
        gsap.fromTo(
          card.querySelector('img'),
          { yPercent: -8, scale: 1.15 },
          { yPercent: 8, scale: 1.15, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } },
        )
      })
    },
    { scope: root },
  )

  const tilt = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    gsap.to(el, { rotateY: x * 6, rotateX: -y * 6, duration: 0.8, ease: 'power3' })
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`)
    el.style.setProperty('--my', `${(y + 0.5) * 100}%`)
  }
  const untilt = (e: React.PointerEvent<HTMLElement>) => gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, duration: 1.2, ease: 'elastic.out(1, 0.5)' })

  return (
    <section className="v3-services" id="services" ref={root} data-header-theme="auto">
      <Head
        label="(02) — What we make"
        title="Three crafts. *One team.*"
        body="Pick one, or combine them. Every project gets the same team, the same process and the same obsession with your message."
        align="split"
      />
      <div className="v3-services__grid">
        {services.map((s) => (
          <article className="v3-svc" key={s.id} id={`svc-${s.id}`} onPointerMove={tilt} onPointerLeave={untilt}>
            <div className="v3-svc__media">
              <img src={s.image} alt={`${s.title} by OsLoop`} loading="lazy" />
              <span className="v3-svc__index mono">{s.index}</span>
            </div>
            <div className="v3-svc__body">
              <h3>{s.title}</h3>
              <p className="v3-svc__lead serif">{s.lead}</p>
              <p className="v3-svc__desc">{s.body}</p>
              <p className="v3-svc__for mono">Perfect for</p>
              <ul className="v3-svc__list">
                {PERFECT_FOR[s.id].map((x) => (
                  <li key={x}>
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
                      <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {x}
                  </li>
                ))}
              </ul>
              <div className="v3-svc__tags">
                {s.tags.map((t) => (
                  <span key={t} className="mono">
                    {t}
                  </span>
                ))}
              </div>
              <a className="v3-svc__cta" href={`mailto:${brand.email}?subject=${encodeURIComponent(`${s.title} request`)}`}>
                Request {s.title.toLowerCase()} <Arrow rotate={-45} />
              </a>
            </div>
            <span className="v3-svc__shine" aria-hidden />
          </article>
        ))}
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- Why us */
export function Why() {
  return (
    <section className="v3-why" id="why" data-header-theme="auto">
      <Head label="(05) — Why OsLoop" title="What makes us *different.*" body="Four promises we keep on every single project." align="split" />
      <div className="v3-bento">
        {values.map((v, i) => (
          <article key={v.n} className={`v3-cell v3-cell--v${i}`} data-reveal="scale" data-delay={String((i % 3) * 0.08)}>
            <div className="v3-cell__visual">
              <ValueVisual i={i} />
            </div>
            <div className="v3-cell__text">
              <span className="mono">{v.n}</span>
              <h3>{v.title}</h3>
              <p>{v.body}</p>
            </div>
          </article>
        ))}
        <article className="v3-cell v3-cell--rating" data-reveal="scale" data-delay="0.1">
          <div className="v3-cell__stars" aria-label="Five stars">
            ★★★★★
          </div>
          <p className="v3-cell__quote serif">“{testimonials[1].quote.split('—')[0].trim()}”</p>
          <p className="mono">Rated five stars by clients on Upwork</p>
        </article>
        <article className="v3-cell v3-cell--pipe" data-reveal="scale" data-delay="0.18">
          <p className="mono">One team, end to end</p>
          <h3>Script → Sound</h3>
          <div className="v3-cell__chain">
            {pipeline.map((p, i) => (
              <span key={p.n} style={{ '--i': i } as CSSProperties}>
                {p.title}
              </span>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- Industries */
const INDUSTRIES = [
  { t: 'Healthcare', d: 'Treatments, devices and patient journeys explained with clarity and care.', proof: 'Recent: explainer video for dentists' },
  { t: 'Crypto & Web3', d: 'Complex protocols turned into simple, trustworthy stories.' },
  { t: 'Food & Beverage', d: 'Products and brands with real appetite appeal.' },
  { t: 'SaaS & Tech', d: 'Features and workflows that click in seconds, not minutes.' },
]

export function Industries() {
  const { scrollTo } = useSmoothScroll()
  return (
    <section className="v3-ind" id="industries" data-header-theme="auto">
      <Head
        label="(06) — Industries"
        title="We speak *your industry.*"
        body="Whether you’re in healthcare or crypto, food or SaaS, we dive deep into your industry’s unique needs — then translate it into animation that resonates."
      />
      <ul className="v3-ind__list">
        {INDUSTRIES.map((x, i) => (
          <li key={x.t} className="v3-ind__row" data-reveal="fade" data-delay={String(i * 0.06)}>
            <span className="v3-ind__n mono">0{i + 1}</span>
            <span className="v3-ind__t">{x.t}</span>
            <span className="v3-ind__d">
              {x.d}
              {x.proof && <em className="mono">{x.proof}</em>}
            </span>
            <span className="v3-ind__fill" aria-hidden />
          </li>
        ))}
        <li className="v3-ind__row v3-ind__row--cta" data-reveal="fade" data-delay="0.3">
          <button onClick={() => scrollTo('#contact', { duration: 2 })}>
            <span className="v3-ind__n mono">+</span>
            <span className="v3-ind__t">Your industry?</span>
            <span className="v3-ind__d">
              Let’s talk <Arrow rotate={-45} />
            </span>
          </button>
        </li>
      </ul>
    </section>
  )
}

/* ---------------------------------------------------------------- Reviews */
export function Reviews() {
  const root = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 900px)', () => {
        gsap.utils.toArray<HTMLElement>('.v3-reviews__col', root.current).forEach((col, i) => {
          gsap.fromTo(
            col,
            { y: i === 1 ? 140 : -40 },
            { y: i === 1 ? -140 : 40, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } },
          )
        })
      })
    },
    { scope: root },
  )
  const cols = [0, 1, 2].map((c) => testimonials.filter((_, i) => i % 3 === c))
  return (
    <section className="v3-reviews" id="reviews" ref={root} data-header-theme="auto">
      <Head label="(07) — Client reviews" title="Echoes of *satisfaction.*" body="Real words from the people we’ve made videos for." align="split" />
      <div className="v3-reviews__grid">
        {cols.map((col, c) => (
          <div className="v3-reviews__col" key={c}>
            {col.map((t) => (
              <figure className="v3-review" key={t.project} data-reveal="fade">
                <div className="v3-review__stars" aria-label="Five stars">
                  ★★★★★
                </div>
                <blockquote>“{t.quote}”</blockquote>
                <figcaption>
                  <span className="v3-review__avatar" aria-hidden>
                    {t.project.charAt(0)}
                  </span>
                  <span>
                    <strong>Upwork client</strong>
                    <span className="mono">{t.project}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
