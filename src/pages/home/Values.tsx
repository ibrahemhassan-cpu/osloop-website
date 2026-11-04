import { useRef, type CSSProperties } from 'react'
import { ValueVisual as Visual } from '../../components/ValueVisual'
import { gsap, useGSAP } from '../../lib/gsap'
import { useI18n } from '../../lib/i18n'
import { rich } from '../../lib/rich'

export function Values() {
  const root = useRef<HTMLElement>(null)
  const { t, c } = useI18n()

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('.v1-value', root.current)
      cards.forEach((wrap, i) => {
        const next = cards[i + 1]
        if (!next) return
        const card = wrap.querySelector('.v1-value__card')
        const shade = wrap.querySelector('.v1-value__shade')
        const st = { trigger: next, start: 'top bottom', end: 'top 18%', scrub: true }
        gsap.to(card, { scale: 0.9 + i * 0.025, rotateX: 4, ease: 'none', scrollTrigger: st })
        gsap.to(shade, { opacity: 0.55, ease: 'none', scrollTrigger: st })
      })
    },
    { scope: root },
  )

  return (
    <section className="v1-values" id="story" ref={root} data-header-theme="auto">
      <div className="v1-values__head">
        <h2 className="v1-values__h" data-reveal="lines">
          {rich(t.values.title)}
        </h2>
        <p className="v1-values__p" data-reveal="fade" data-delay="0.15">
          {t.values.text}
        </p>
      </div>

      <div className="v1-values__stack">
        {c.values.map((v, i) => (
          <div className="v1-value" key={v.n} style={{ '--i': i } as CSSProperties}>
            <div className={`v1-value__card v1-value__card--${i}`}>
              <div className="v1-value__left">
                <span className="v1-value__n">{v.n}</span>
                <h3 className="v1-value__t">{v.title}</h3>
              </div>
              <div className="v1-value__right">
                <Visual i={i} />
                <p>{v.body}</p>
              </div>
              <div className="v1-value__shade" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
