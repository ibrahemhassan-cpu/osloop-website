import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from '../lib/gsap'
import { reel } from '../lib/content'

// The popup always plays from 0:00: the iframe is created on open and destroyed on close,
// so nothing resumes from a previous position.
import { useSmoothScroll } from '../providers/SmoothScroll'
import './reel-modal.css'

export function ReelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const { lenis } = useSmoothScroll()

  useEffect(() => {
    if (!open) return
    lenis?.stop()
    // the custom cursor can't follow the pointer over the YouTube iframe — hide it, keep the native one
    document.documentElement.setAttribute('data-cursor-hidden', '')
    const el = root.current!
    gsap.fromTo(el, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 1.1, ease: 'drift' })
    gsap.fromTo(el.querySelector('.reel-modal__frame'), { scale: 0.9, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.2, delay: 0.3 })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      lenis?.start()
      document.documentElement.removeAttribute('data-cursor-hidden')
    }
  }, [open, lenis, onClose])

  if (!open) return null
  return createPortal(
    <div className="reel-modal" ref={root} role="dialog" aria-modal aria-label="Showreel" onClick={onClose}>
      <div className="reel-modal__frame" onClick={(e) => e.stopPropagation()}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${reel.youtubeId}?autoplay=1&start=0&rel=0&modestbranding=1&playsinline=1`}
          title="OsLoop showreel"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
      <button className="reel-modal__close mono" onClick={onClose}>
        Close ✕
      </button>
    </div>,
    document.body,
  )
}
