import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { services } from '../../lib/content'
import { ImageLoop } from '../../components/ImageLoop'

export function Services() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 981px)', () => {
        const track = root.current!.querySelector<HTMLElement>('.v1-services__track')!
        const distance = () => track.scrollWidth - window.innerWidth
        const move = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              gsap.set('.v1-services__bar-fill', { scaleX: self.progress })
            },
          },
        })
        gsap.utils.toArray<HTMLElement>('.v1-svc', root.current).forEach((card) => {
          gsap.from(card.querySelectorAll('.v1-svc__title, .v1-svc__lead, .v1-svc__body, .v1-svc__tags'), {
            y: 30,
            autoAlpha: 0,
            stagger: 0.07,
            duration: 1.1,
            scrollTrigger: { trigger: card, containerAnimation: move, start: 'left 78%' },
          })
        })
      })
    },
    { scope: root },
  )

  return (
    <section className="v1-services" id="services" ref={root} data-header-theme="auto">
      <div className="v1-services__track">
        <div className="v1-services__intro">
          <h2 className="v1-services__h" data-reveal="lines">
            Nine services. <br />
            <span className="serif">One obsession:</span> <br />
            your story.
          </h2>
          <p className="v1-services__p" data-reveal="fade" data-delay="0.2">
            From explainers and 3D films to brand identities and animated websites — one team, one standard, built around
            the message you need people to remember.
          </p>
          <div className="v1-services__hint mono" data-reveal="fade" data-delay="0.3">
            <span>Keep scrolling</span>
            <span className="v1-services__hint-arrow">→</span>
          </div>
        </div>

        {services.map((s, i) => (
          <article className="v1-svc" key={s.id}>
            <ImageLoop className="v1-svc__media" images={s.images} alt={`${s.title} — OsLoop work`} offset={(i % 3) * 700} />
            <div className="v1-svc__text">
              <h3 className="v1-svc__title">{s.title}</h3>
              <p className="v1-svc__lead serif">{s.lead}</p>
              <p className="v1-svc__body">{s.body}</p>
              <ul className="v1-svc__tags">
                {s.tags.map((t) => (
                  <li key={t} className="mono">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
      <div className="v1-services__bar" aria-hidden>
        <div className="v1-services__bar-fill" />
      </div>
    </section>
  )
}
