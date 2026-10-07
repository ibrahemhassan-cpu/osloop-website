import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { services } from '../../lib/content'

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
        gsap.utils.toArray<HTMLElement>('.v1-svc', root.current).forEach((panel) => {
          const media = panel.querySelector('.v1-svc__media img')
          const title = panel.querySelector('.v1-svc__title')
          gsap.fromTo(media, { xPercent: -12, scale: 1.18 }, {
            xPercent: 12,
            scale: 1.05,
            ease: 'none',
            scrollTrigger: { trigger: panel, containerAnimation: move, start: 'left right', end: 'right left', scrub: true },
          })
          gsap.from(title, {
            xPercent: 25,
            ease: 'none',
            scrollTrigger: { trigger: panel, containerAnimation: move, start: 'left right', end: 'left 30%', scrub: true },
          })
          gsap.from(panel.querySelectorAll('.v1-svc__tags li'), {
            y: 30,
            autoAlpha: 0,
            stagger: 0.06,
            duration: 1,
            scrollTrigger: { trigger: panel, containerAnimation: move, start: 'left 60%' },
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
            Three crafts. <br />
            <span className="serif">One obsession:</span> <br />
            your story.
          </h2>
          <p className="v1-services__p" data-reveal="fade" data-delay="0.2">
            From a two-minute explainer to a full product universe in 3D, every frame is built around the one thing
            that matters — the message you need people to remember.
          </p>
          <div className="v1-services__hint mono" data-reveal="fade" data-delay="0.3">
            <span>Keep scrolling</span>
            <span className="v1-services__hint-arrow">→</span>
          </div>
        </div>

        {services.map((s) => (
          <article className="v1-svc" key={s.id} data-cursor="Explore">
            <div className="v1-svc__text">
              <span className="v1-svc__index">{s.index}</span>
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
            <div className="v1-svc__media">
              <img src={s.image} alt={`${s.title} — OsLoop work`} loading="lazy" />
              <span className="v1-svc__media-tag mono">{s.index} / 03</span>
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
