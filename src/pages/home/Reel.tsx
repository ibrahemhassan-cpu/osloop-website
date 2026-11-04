import { useCallback, useRef, useState } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { reel } from '../../lib/content'
import { ReelModal } from '../../components/ReelModal'
import { YouTubeBackground } from '../../components/YouTubeBackground'
import { useI18n } from '../../lib/i18n'
import './reel.css'

export function Reel() {
  const { t } = useI18n()
  const root = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ desktop: '(min-width: 761px)', mobile: '(max-width: 760px)' }, (ctx) => {
        const { desktop } = ctx.conditions as { desktop: boolean }
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: desktop ? '+=160%' : '+=110%',
            pin: '.v1-reel__stage',
            scrub: 1,
          },
        })
        tl.fromTo(
          '.v1-reel__frame',
          { clipPath: desktop ? 'inset(31% 33% 31% 33% round 28px)' : 'inset(36% 8% 36% 8% round 20px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1 },
        )
          .fromTo('.v1-reel__media', { scale: 1.35 }, { scale: 1, duration: 1 }, 0)
          .to('.v1-reel__word--l', { xPercent: -60, autoAlpha: 0, duration: 0.8 }, 0)
          .to('.v1-reel__word--r', { xPercent: 60, autoAlpha: 0, duration: 0.8 }, 0)
          .fromTo('.v1-reel__badge, .v1-reel__sound', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.7)
          .to({}, { duration: 0.25 })
      })
    },
    { scope: root },
  )

  return (
    <section className="v1-reel" id="reel" ref={root} data-header-theme="dark" data-theme="dark">
      <div className="v1-reel__stage">
        <div className="v1-reel__frame" data-cursor={t.reel.cursor} onClick={() => setOpen(true)} role="button" tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(true)} aria-label={t.reel.aria}>
          <div className="v1-reel__media">
            {reel.loopMp4 ? (
              <video src={reel.loopMp4} poster={reel.poster} autoPlay muted loop playsInline />
            ) : (
              <YouTubeBackground />
            )}
          </div>
          <div className="v1-reel__badge">
            <span className="v1-reel__play" aria-hidden>
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
              </svg>
            </span>
            <span>
              <span className="mono">{t.reel.label}</span>
              <strong>{t.reel.title}</strong>
            </span>
          </div>
          <div className="v1-reel__sound mono">
            <span className="v1-reel__eq" aria-hidden>
              <i />
              <i />
              <i />
              <i />
            </span>
            {t.reel.sound}
          </div>
        </div>
        <div className="v1-reel__word v1-reel__word--l" aria-hidden>
          {t.reel.wordLeft}
        </div>
        <div className="v1-reel__word v1-reel__word--r" aria-hidden>
          {t.reel.wordRight}
        </div>
      </div>
      <ReelModal open={open} onClose={close} />
    </section>
  )
}
