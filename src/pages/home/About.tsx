import { useRef } from 'react'
import { gsap, SplitText, useGSAP } from '../../lib/gsap'
import { industries as INDUSTRIES } from '../../lib/content'
import { useI18n } from '../../lib/i18n'
import { rich } from '../../lib/rich'
import { useNavTo } from '../../lib/useNavTo'
import { Button } from '../../components/ui'
import { Marquee } from '../../components/Marquee'
import { useExperience } from '../../providers/Experience'

function Star() {
  return (
    <svg className="v1-ribbon__star" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" fill="currentColor" />
    </svg>
  )
}

export function Ribbons() {
  const { t, c } = useI18n()
  return (
    <section className="v1-ribbons" data-header-theme="auto" aria-label={t.about.craft}>
      <div className="v1-ribbon v1-ribbon--blue">
        <Marquee speed={2}>
          {c.marqueeA.map((w) => (
            <span className="v1-ribbon__item" key={w}>
              {w}
              <Star />
            </span>
          ))}
        </Marquee>
      </div>
      <div className="v1-ribbon v1-ribbon--ink">
        <Marquee speed={1.6} reverse>
          {c.marqueeB.map((w) => (
            <span className="v1-ribbon__item" key={w}>
              {w}
              <Star />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}

const ICONS: Record<string, React.ReactNode> = {
  Healthcare: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10zM9 11h6M12 8v6" />,
  'Real Estate': <path d="M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5" />,
  Food: <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 1.5-3 4-3 7v3h3" />,
  SaaS: <path d="M4 5h16v11H4zM8 20h8M12 16v4M8 9h5M8 12h8" />,
}

export function About() {
  const root = useRef<HTMLElement>(null)
  const { ready } = useExperience()
  const navTo = useNavTo()
  const { t, c } = useI18n()

  useGSAP(
    () => {
      if (!ready) return
      const statement = root.current!.querySelector('.v1-about__statement')!
      gsap.set(statement, { visibility: 'visible' })
      SplitText.create(statement, {
        type: 'words',
        wordsClass: 'v1-about__word',
        autoSplit: true,
        onSplit(self) {
          return gsap.fromTo(
            self.words,
            { opacity: 0.12 },
            {
              opacity: 1,
              stagger: 0.12,
              ease: 'none',
              scrollTrigger: { trigger: statement, start: 'top 78%', end: 'bottom 52%', scrub: 1 },
            },
          )
        },
      })
    },
    { scope: root, dependencies: [ready] },
  )

  return (
    <section className="v1-about" id="about" ref={root} data-header-theme="auto">
      <p className="v1-about__statement">
        {rich(t.about.statement)}
      </p>

      <div className="v1-about__row">
        <div className="v1-about__info" data-reveal="fade">
          <p className="v1-about__text">
            {t.about.text}
          </p>
          <ul className="v1-about__inds">
            {c.industries.map((x, i) => (
              <li key={x}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {ICONS[INDUSTRIES[i]]}
                </svg>
                {x}
              </li>
            ))}
            <li className="v1-about__more">{t.about.more}</li>
          </ul>
        </div>
        <div className="v1-about__ctas" data-reveal="fade" data-delay="0.15">
          <Button label={t.about.cta} variant="light" onClick={() => navTo('#work')} />
        </div>
      </div>
    </section>
  )
}
