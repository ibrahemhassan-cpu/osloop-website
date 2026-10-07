import { useEffect, useRef, useState, type FormEvent } from 'react'
import { gsap, SplitText, useGSAP, isTouch } from '../../lib/gsap'
import { brand, contact, socials } from '../../lib/content'
import { useClock } from '../../lib/useClock'
import { Arrow, Magnetic, RollText } from '../../components/ui'

const NEEDS = ['Explainer video', '3D production', 'Animated website', 'Not sure yet']
type Status = 'idle' | 'sending' | 'sent' | 'mailed' | 'error'

export function Contact() {
  const root = useRef<HTMLElement>(null)
  const orb = useRef<HTMLDivElement>(null)
  const done = useRef<HTMLDivElement>(null)
  const time = useClock(brand.timeZone)

  const [needs, setNeeds] = useState<string[]>(['Explainer video'])
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Status>('idle')

  useGSAP(
    () => {
      const title = root.current!.querySelector('.v1-cta__title')!
      gsap.set(title, { visibility: 'visible' })
      const split = SplitText.create(title, { type: 'chars', charsClass: 'v1-cta__char' })
      gsap.from(split.chars, {
        yPercent: 110,
        rotateX: -70,
        transformOrigin: '50% 100%',
        stagger: 0.06,
        ease: 'silk',
        scrollTrigger: { trigger: root.current, start: 'top 75%', end: 'top 15%', scrub: 1.2 },
      })
      gsap.to('.v1-badge__ring', { rotate: 360, duration: 22, repeat: -1, ease: 'none' })
    },
    { scope: root },
  )

  useEffect(() => {
    if (isTouch()) return
    const el = root.current!
    const xTo = gsap.quickTo(orb.current, 'x', { duration: 1.6, ease: 'power3' })
    const yTo = gsap.quickTo(orb.current, 'y', { duration: 1.6, ease: 'power3' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      xTo(e.clientX - r.left - r.width / 2)
      yTo(e.clientY - r.top - r.height / 2)
    }
    el.addEventListener('pointermove', move)
    return () => el.removeEventListener('pointermove', move)
  }, [])

  // Success panel entrance.
  useEffect(() => {
    if ((status === 'sent' || status === 'mailed') && done.current) {
      gsap
        .timeline()
        .fromTo(done.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1 })
        .fromTo(done.current.querySelector('.cform__tick path'), { strokeDashoffset: 60 }, { strokeDashoffset: 0, duration: 1 }, 0.2)
    }
  }, [status])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: '' }))
  }
  const toggle = (n: string) => setNeeds((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Please tell us your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Please enter a valid email.'
    if (form.message.trim().length < 10) e.message = 'A few words about the project, please.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const subject = `Project brief — ${needs.join(', ') || 'New project'}`
    const lines = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      ...(form.company ? [`Company: ${form.company}`] : []),
      `Needs: ${needs.join(', ') || '—'}`,
      '',
      form.message,
    ]

    if (!contact.formEndpoint) {
      window.location.href = `mailto:${brand.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
      setStatus('mailed')
      return
    }
    try {
      setStatus('sending')
      const res = await fetch(contact.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...form, needs: needs.join(', '), _subject: subject }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const whatsapp = contact.whatsapp.replace(/[^\d]/g, '')

  return (
    <section className="v1-cta" id="contact" ref={root} data-header-theme="auto">
      <div className="v1-cta__orb" ref={orb} aria-hidden />
      <div className="v1-cta__inner">
        <span className="v1-cta__kicker" data-reveal="fade">
          How can we help you?
        </span>
        <h2 className="v1-cta__title">
          Let’s <span className="serif">talk.</span>
        </h2>

        <div className="v1-cta__grid">
          <div className="v1-cta__info" data-reveal="fade">
            <p>
              Tell us about your product, your audience and your deadline. We’ll come back with a creative direction and a
              clear plan to bring it to life.
            </p>
            <a className="v1-cta__mail roll-host" href={`mailto:${brand.email}?subject=Video%20request`}>
              <RollText text={brand.email} />
              <Arrow size={22} rotate={-45} />
            </a>
            <div className="v1-cta__meta">
              <a href={brand.mapUrl} target="_blank" rel="noreferrer">
                {brand.location}
              </a>
              <span>Local time {time}</span>
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                  WhatsApp {contact.whatsapp}
                </a>
              )}
            </div>
            <div className="v1-cta__socials">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="roll-host">
                  <RollText text={s.label} />
                </a>
              ))}
            </div>
            <Magnetic strength={0.45} className="v1-cta__badge-wrap">
              <a className="v1-badge" href={`mailto:${brand.email}?subject=Video%20request`} data-cursor="Email us">
                <svg className="v1-badge__ring" viewBox="0 0 200 200" aria-hidden>
                  <defs>
                    <path id="badge-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
                  </defs>
                  <text>
                    <textPath href="#badge-circle" startOffset="0">
                      REQUEST YOUR VIDEO ✦ REQUEST YOUR VIDEO ✦ REQUEST YOUR VIDEO ✦
                    </textPath>
                  </text>
                </svg>
                <span className="v1-badge__core">
                  <Arrow size={30} rotate={-45} />
                </span>
              </a>
            </Magnetic>
          </div>

          <div className="cform-wrap" data-reveal="fade" data-delay="0.15">
            {status === 'sent' || status === 'mailed' ? (
              <div className="cform cform--done" ref={done}>
                <svg className="cform__tick" viewBox="0 0 52 52" width="64" height="64" aria-hidden>
                  <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                  <path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" />
                </svg>
                <h3>{status === 'sent' ? `Thanks, ${form.name.split(' ')[0]}!` : 'Almost there…'}</h3>
                <p>
                  {status === 'sent'
                    ? 'Your message is on its way. We’ll get back to you with next steps soon.'
                    : `Your email app should have opened with your brief ready — just hit send. If it didn’t, write to us at ${brand.email}.`}
                </p>
                <button type="button" className="cform__again mono" onClick={() => setStatus('idle')}>
                  Send another message
                </button>
              </div>
            ) : (
              <form className="cform" onSubmit={submit} noValidate>
                <fieldset className="cform__needs">
                  <legend className="mono">What do you need?</legend>
                  {NEEDS.map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={`cchip${needs.includes(n) ? ' is-on' : ''}`}
                      aria-pressed={needs.includes(n)}
                      onClick={() => toggle(n)}
                    >
                      <span className="cchip__dot" aria-hidden />
                      {n}
                    </button>
                  ))}
                </fieldset>
                <div className="cform__row">
                  <label className={`cfield${errors.name ? ' has-error' : ''}`}>
                    <span className="mono">Name *</span>
                    <input value={form.name} onChange={set('name')} autoComplete="name" placeholder="Your name" />
                    {errors.name && <em>{errors.name}</em>}
                  </label>
                  <label className={`cfield${errors.email ? ' has-error' : ''}`}>
                    <span className="mono">Email *</span>
                    <input value={form.email} onChange={set('email')} type="email" autoComplete="email" placeholder="you@company.com" />
                    {errors.email && <em>{errors.email}</em>}
                  </label>
                </div>
                <label className="cfield">
                  <span className="mono">Company</span>
                  <input value={form.company} onChange={set('company')} autoComplete="organization" placeholder="Optional" />
                </label>
                <label className={`cfield${errors.message ? ' has-error' : ''}`}>
                  <span className="mono">Tell us about the project *</span>
                  <textarea
                    value={form.message}
                    onChange={set('message')}
                    rows={4}
                    placeholder="What are you launching, who is it for, and when do you need it?"
                    data-lenis-prevent
                  />
                  {errors.message && <em>{errors.message}</em>}
                </label>
                <div className="cform__foot">
                  <Magnetic strength={0.2}>
                    <button type="submit" className="btn btn--blue roll-host" disabled={status === 'sending'}>
                      <RollText text={status === 'sending' ? 'Sending…' : 'Send message'} />
                      <span className="btn__icon">
                        <Arrow />
                      </span>
                    </button>
                  </Magnetic>
                  {status === 'error' && (
                    <span className="cform__error">
                      Something went wrong — please email us at <a href={`mailto:${brand.email}`}>{brand.email}</a>.
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
