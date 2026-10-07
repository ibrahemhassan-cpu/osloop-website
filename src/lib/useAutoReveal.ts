import type { RefObject } from 'react'
import { gsap, ScrollTrigger, SplitText, useGSAP, prefersReducedMotion } from './gsap'

/**
 * Declarative scroll reveals. Mark elements with:
 *   data-reveal="lines" | "words" | "chars" | "fade" | "rule" | "scale"
 *   data-delay="0.2"   (optional, seconds)
 * Runs once `enabled` is true (after preloader / curtain).
 */
export function useAutoReveal(scope: RefObject<HTMLElement | null>, enabled: boolean) {
  useGSAP(
    () => {
      if (!enabled || !scope.current) return
      const els = gsap.utils.toArray<HTMLElement>('[data-reveal]', scope.current)
      const reduce = prefersReducedMotion()

      els.forEach((el) => {
        const type = el.dataset.reveal
        const delay = parseFloat(el.dataset.delay ?? '0')
        const st = { trigger: el, start: 'top 88%', once: true }
        gsap.set(el, { visibility: 'visible' })
        if (reduce) return

        if (type === 'lines' || type === 'words' || type === 'chars') {
          SplitText.create(el, {
            type: type === 'lines' ? 'lines' : type === 'words' ? 'words,lines' : 'chars,words',
            mask: type === 'chars' ? 'words' : 'lines',
            autoSplit: true,
            linesClass: 'split-line',
            onSplit(self) {
              const targets = type === 'lines' ? self.lines : type === 'words' ? self.words : self.chars
              return gsap.from(targets, {
                yPercent: 120,
                rotate: type === 'chars' ? 0 : 2,
                duration: type === 'chars' ? 1 : 1.25,
                stagger: type === 'lines' ? 0.1 : type === 'words' ? 0.035 : 0.025,
                ease: 'silk',
                delay,
                scrollTrigger: st,
              })
            },
          })
        } else if (type === 'rule') {
          gsap.from(el, { scaleX: 0, transformOrigin: 'left center', duration: 1.6, ease: 'drift', delay, scrollTrigger: st })
        } else if (type === 'scale') {
          gsap.from(el, { scale: 0.85, autoAlpha: 0, duration: 1.4, delay, scrollTrigger: st })
        } else {
          gsap.from(el, { y: 50, autoAlpha: 0, duration: 1.3, delay, scrollTrigger: st })
        }
      })
      ScrollTrigger.refresh()
    },
    { scope, dependencies: [enabled] },
  )
}
