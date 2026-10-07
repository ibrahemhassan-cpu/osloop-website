import { useState } from 'react'
import { brand, socials } from '../../lib/content'
import { useClock } from '../../lib/useClock'
import { Arrow, Magnetic, RollText } from '../../components/ui'
import { RichTitle } from '../v2/ChapterView'

const NEEDS = ['Explainer video', '3D production', 'Animated website', 'Not sure yet']

/** "Brief builder" — composes an email in the visitor's own mail app (no backend needed). */
export function Contact() {
  const [needs, setNeeds] = useState<string[]>(['Explainer video'])
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const time = useClock(brand.timeZone)

  const toggle = (n: string) => setNeeds((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]))

  const mailto = () => {
    const subject = `Project brief — ${needs.join(', ') || 'New project'}`
    const body = [`Hi OsLoop team,`, '', `I'm interested in: ${needs.join(', ') || '—'}`, '', msg || '(project details)', '', name ? `— ${name}` : '']
      .join('\n')
      .trim()
    return `mailto:${brand.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <section className="v3-contact" id="contact" data-header-theme="auto">
      <div className="v3-contact__main">
        <p className="v3-label mono" data-reveal="fade">
          (08) — Start a project
        </p>
        <h2 className="v3-contact__title" data-reveal="lines">
          <RichTitle text="Let’s make your story *move.*" />
        </h2>

        <form
          className="v3-brief"
          data-reveal="fade"
          onSubmit={(e) => {
            e.preventDefault()
            window.location.href = mailto()
          }}
        >
          <fieldset className="v3-brief__needs">
            <legend className="mono">What do you need?</legend>
            {NEEDS.map((n) => (
              <button
                type="button"
                key={n}
                className={`v3-chip${needs.includes(n) ? ' is-on' : ''}`}
                aria-pressed={needs.includes(n)}
                onClick={() => toggle(n)}
              >
                <span className="v3-chip__check" aria-hidden />
                {n}
              </button>
            ))}
          </fieldset>
          <label className="v3-field">
            <span className="mono">Your name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane from Acme" autoComplete="name" />
          </label>
          <label className="v3-field">
            <span className="mono">Tell us about the project</span>
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              rows={3}
              placeholder="What are you launching, who is it for, and when do you need it?"
              data-lenis-prevent
            />
          </label>
          <div className="v3-brief__foot">
            <Magnetic strength={0.2}>
              <button type="submit" className="btn btn--blue roll-host">
                <RollText text="Send the brief" />
                <span className="btn__icon">
                  <Arrow />
                </span>
              </button>
            </Magnetic>
            <span className="v3-brief__note">Opens your email app with the brief ready to send.</span>
          </div>
        </form>
      </div>

      <aside className="v3-contact__side">
        <div className="v3-contact__space" aria-hidden />
        <div className="v3-contact__info" data-reveal="fade" data-delay="0.2">
          <a className="v3-contact__mail roll-host" href={`mailto:${brand.email}`}>
            <RollText text={brand.email} />
          </a>
          <p>
            {brand.location} · <span className="v3-dot" /> {time} local time
          </p>
          <div className="v3-contact__socials">
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="roll-host">
                <RollText text={s.label} />
              </a>
            ))}
          </div>
        </div>
      </aside>
    </section>
  )
}
