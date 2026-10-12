import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { MediaLogoWhite } from './Logo'

export function Preloader({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = root.current!
      const num = el.querySelector<HTMLElement>('.pre__num')!
      const count = { v: 0 }

      if (prefersReducedMotion()) {
        gsap.timeline().to(el, { autoAlpha: 0, duration: 0.4, delay: 0.3 }).add(onReveal, 0).add(onDone)
        return
      }

      const tl = gsap.timeline({ paused: true })
      tl.from('.pre__meta > *', { yPercent: 120, duration: 1, stagger: 0.08 }, 0)
        .to(
          count,
          {
            v: 100,
            duration: 2.4,
            ease: 'power2.inOut',
            onUpdate: () => {
              const v = Math.round(count.v)
              num.textContent = String(v).padStart(3, '0')
              el.style.setProperty('--p', String(count.v / 100))
            },
          },
          0.15,
        )
        .to('.pre__logo-wrap', { scale: 0.96, duration: 0.6, ease: 'power2.in' }, '+=0.1')
        .to('.pre__meta > *, .pre__num', { yPercent: -120, autoAlpha: 0, duration: 0.6, stagger: 0.04, ease: 'power3.in' }, '<')
        .to('.pre__logo-wrap', { autoAlpha: 0, y: -40, duration: 0.6, ease: 'power3.in' }, '<+0.1')
        .add(onReveal, '-=0.05')
        .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.3, ease: 'drift' }, '<')
        .add(onDone)

      // Start once fonts are ready (avoids a flash of fallback text inside the loader).
      const start = () => tl.play()
      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(start)
    },
    { scope: root },
  )

  return (
    <div className="pre" ref={root} aria-hidden>
      <div className="pre__logo-wrap">
        <MediaLogoWhite className="pre__logo pre__logo--ghost" hidden />
        <MediaLogoWhite className="pre__logo pre__logo--fill" hidden />
      </div>
      <div className="pre__bottom">
        <div className="pre__meta mono">
          <span>Media Production</span>
          <span>Alexandria — EG</span>
          <span>Your story, our expertise</span>
        </div>
        <div className="pre__num">000</div>
      </div>
    </div>
  )
}
